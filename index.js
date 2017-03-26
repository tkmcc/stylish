'use strict';

const EventEmitter = require('events').EventEmitter;
const PhantomJs = require('phantomjs-prebuilt');
const Png = require('pngjs').PNG;
const RgbQuant = require('rgbquant');
const Stream = require('stream');
const Url = require('url');
const UrlValidator = require('url-validator');
const WebSocket = require('ws');

const WEBSOCKET_URL_OBJ = {
  protocol: 'ws:',
  slashes: true,
  hostname: 'localhost',
  port: 2048 + ~~(Math.random() * 4096),
  pathname: '/stylish-ws',
};

const WEBSOCKET_URL = Url.format(WEBSOCKET_URL_OBJ);
const DEFAULT_URL = 'http://tkm.io/';
const PHANTOM_ARGS = {
  wss: WEBSOCKET_URL,
  url: DEFAULT_URL,
  viewSize: {
    width: 1366,
    height: 768,
  },
};

const lmk = new EventEmitter();

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

  if (msg && msg.status && msg.body) {
    if (msg.status === 'ok') {
      return msg;
    }

    lmk.emit('complete', { err: `Phantom: "${msg.body}"` });
  }

  return undefined;
}

function finalize(palette) {
  const response = {
    statusCode: palette ? 200 : 500,
    headers: {
      'access-control-allow-origin': '*',
    },
    body: palette ? JSON.stringify({ palette }) : '',
  };

  console.log(`Palette: ${palette ? JSON.stringify({ palette }) : 'error'}`);

  lmk.emit('complete', { err: null, result: response });
}

function png2palette(data) {
  lmk.emit('time', 'Begin png2palette');

  const png = new Uint32Array(data);

  // Turn array of {R, G, B, A} into array of 32 bit pixels
  const pixels = png.reduce((acc, val, index) => {
    const pos = (index % 4);

    const pixelIndex = ((index - pos) / 4);
    const pixel = acc[pixelIndex];

    const color = png[index] & 0xff;
    const shiftBits = 8 * pos;

    /**
     * Example for group [0xAA, 0x12, 0x23, 0x10]
     * pos = 2
     * color = 0x23
     * shiftBits = 8 * 2 = 16
     * (color << shiftBits) = 0x00230000
     *                pixel = 0x000012AA
     *              updated = 0x002312AA
     **/

    const updated = pixel | (color << shiftBits);
    acc.fill(updated, pixelIndex, pixelIndex + 1);

    return acc;
  }, new Uint32Array(data.length / 4));

  lmk.emit('time', 'Complete png2palette');

  const q = new RgbQuant({ colors: 8 });
  q.sample(pixels);

  lmk.emit('time', 'Complete RgbQuant');

  const palette = q.palette(true);

  finalize(palette);
}

function phantomHandler(msg) {
  const screenshot = new Buffer(msg.body, 'base64');
  const pngStream = new Stream.PassThrough();

  pngStream.end(screenshot);

  pngStream.pipe(new Png({ filterType: 4 }))
    .on('error', err => lmk.emit('complete', { err: `pngStream: ${err}` }))
    .on('parsed', data => png2palette(data));
}

function urlFromEvent(event) {
  if (!event || !event.queryStringParameters || !event.queryStringParameters.url) {
    lmk.emit('complete', { err: 'Bad URL' });
  }

  return UrlValidator(event.queryStringParameters.url);
}

function prepareWss() {
  console.log(`WebSocket URL: ${PHANTOM_ARGS.wss}`);

  const wss = new WebSocket.Server({
    port: WEBSOCKET_URL_OBJ.port,
    pathname: WEBSOCKET_URL_OBJ.path,
  });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      const msg = parseMsg(raw);
      if (msg) {
        ws.close();

        lmk.emit('time', 'Got message');

        phantomHandler(msg);
      }
    });

    ws.on('close', () => {
      // Projeto completo
    });
  });

  return wss;
}

exports.handler = function (event, context, callback) {
  // Don't wait for an empty event loop to exit --
  //   we want to terminate immediately when we call callback()
  context.callbackWaitsForEmptyEventLoop = false;

  const wss = prepareWss();
  let timer = context.getRemainingTimeInMillis();

  lmk.on('complete', (opt) => {
    console.log(`complete: ${JSON.stringify(opt)}`);
    wss.close();

    callback(opt.err || null, opt.result || null);
  });

  lmk.on('time', (msg) => {
    const ms = context.getRemainingTimeInMillis();
    console.log(`[${ms}: -${timer - ms}] ${msg}`);
    timer = ms;
  });

  lmk.emit('time', 'Begin');

  const urlParam = urlFromEvent(event);
  console.log(`URL: ${urlParam}`);

  const phantomArgs = Object.assign({}, PHANTOM_ARGS, { url: urlParam });
  const phantom = PhantomJs.exec('phjs-main.js', JSON.stringify(phantomArgs));

  phantom.stdout.on('data', msg => console.log(`Phantom: "${msg}"`));
  phantom.stderr.on('data', err => callback(err));

  phantom.on('exit', (code) => {
    if (code !== 0) console.log(`Phantom exited with ${code}`);
  });

  phantom.on('close', (code) => {
    if (code !== 0) console.log(`Phantom closed with ${code}`);
  });
};
