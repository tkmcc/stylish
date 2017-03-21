'use strict';

const PhantomJs = require('phantomjs-prebuilt');
const Png = require('pngjs').PNG;
const RgbQuant = require('rgbquant');
const Stream = require('stream');

const PHANTOM_ARGS = {
  url: 'http://google.com/',
  viewSize: {
    width: 1920,
    height: 1080,
  },
};

function parseJson(str) {
  try {
    const o = JSON.parse(str);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {
    // Continue regardless
  }

  return undefined;
}

function parseMsg(raw) {
  const msg = parseJson(raw);

  if (msg && msg.status && msg.status === 'ok') {
    return msg;
  }

  return undefined;
}

function final(complete, palette) {
  const response = {
    statusCode: palette ? 200 : 500,
    headers: { },
    body: palette,
  };

  complete(null, response);
}

function png2palette(complete, data) {
  const png = new Uint32Array(data);

  // Turn array of {R, G, B, A} into array of 32 bit pixels
  const pixels = png.reduce((acc, val, index) => {
    const pos = (index % 4);

    const pixelIndex = ((index - pos) / 4);
    const pixel = acc[pixelIndex];

    const color = png[index] & 0xff;
    const shiftBits = 8 * pos;

    const updated = pixel | (color << shiftBits);
    acc.set([updated], pixelIndex);

    return acc;
  }, new Uint32Array(data.length / 4));

  const q = new RgbQuant({ colors: 8 });
  q.sample(pixels);

  const palette = q.palette(true).map(rgb => `rgb(${rgb.join()})`);

  final(complete, palette);
}

function phantomHandler(complete, raw) {
  const msg = parseMsg(raw);
  if (!msg) {
    console.log('Phantom: "%s"', raw);
    return;
  }

  const screenshot = new Buffer(msg.body, 'base64');
  const pngStream = new Stream.PassThrough();

  pngStream.end(screenshot);

  pngStream.pipe(new Png({ filterType: 4 }))
    .on('error', complete)
    .on('parsed', (data) => {
      png2palette(complete, data);
    });
}

exports.handler = function (event, context, callback) {
  const phantom = PhantomJs.exec('phjs-main.js', JSON.stringify(PHANTOM_ARGS));
  let msgBuffer = '';

  phantom.stdout.on('data', (msg) => { msgBuffer = msgBuffer.concat(String(msg)); });
  phantom.stderr.on('data', err => callback(err));
  phantom.on('exit', (code) => {
    if (code !== 0) console.log(`Phantom exited with ${code}`);
  });

  phantom.on('close', (code) => {
    if (code !== 0) {
      console.log(`Phantom closed with ${code}`);
    }

    phantomHandler(callback, msgBuffer);
  });
};
