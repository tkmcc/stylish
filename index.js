'use strict';

const PhantomJs = require('phantomjs-prebuilt');
const Png = require('pngjs').PNG;
const RgbQuant = require('rgbquant');
const Stream = require('stream');
const UrlValidator = require('url-validator');

const PHANTOM_ARGS = {
  url: 'http://tkm.io/',
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

function parseMsg(complete, raw) {
  const msg = parseJson(raw);

  if (msg && msg.status && msg.body) {
    if (msg.status === 'ok') {
      return msg;
    }

    complete(`Error: "${msg.body}"`);
  }

  return undefined;
}

function final(complete, palette) {
  const response = {
    statusCode: palette ? 200 : 500,
    headers: {
      'access-control-allow-origin': '*'
    },
    body: palette ? JSON.stringify({ palette: palette }) : '',
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

  const palette = q.palette(true);

  final(complete, palette);
}

function phantomHandler(complete, raw) {
  const msg = parseMsg(complete, raw);
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

function urlFromEvent(event) {
  if (!event || !event.queryStringParameters || !event.queryStringParameters.url) {
    return false;
  }

  return UrlValidator(event.queryStringParameters.url);
}

exports.handler = function (event, context, callback) {
  const urlParam = urlFromEvent(event);
  if (!urlParam) {
    callback('Bad URL');
    return;
  }

  const phantomArgs = Object.assign({}, PHANTOM_ARGS, { url: urlParam });
  const phantom = PhantomJs.exec('phjs-main.js', JSON.stringify(phantomArgs));
  let msgBuffer = '';

  phantom.stdout.on('data', (msg) => { msgBuffer = msgBuffer.concat(String(msg)); });
  phantom.stderr.on('data', err => callback(err));
  phantom.on('exit', (code) => {
    if (code !== 0) console.log(`Phantom exited with ${code}`);
  });

  phantom.on('close', (code) => {
    if (code !== 0) console.log(`Phantom closed with ${code}`);

    phantomHandler(callback, msgBuffer);
  });
};
