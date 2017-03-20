const Aws = require('aws-sdk');
const Canvas = require('canvas');
const Image = Canvas.Image;
const PhantomJs = require('phantomjs-prebuilt');
const RgbQuant = require('rgbquant');

function parseJson(str) {
  try {
    const o = JSON.parse(str);
    if (o && typeof o === 'object') {
      return o;
    }
  }
  catch (e) { }

  return undefined;
}

function parseMsg(raw) {
  const msg = parseJson(raw);

  if (msg && msg.status && msg.status === 'ok') {
    return msg;
  }

  return undefined;
}

function png2palette(complete, data) {
  const img = new Image;
	img.src = data;

	const can = new Canvas(img.width, img.height);
	const ctx = can.getContext('2d');
	ctx.drawImage(img, 0, 0, img.width, img.height);

	const q = new RgbQuant({ colors: 8 });
	q.sample(can);

  const palette = q.palette(true);

	complete(null, palette);
}

function phantomHandler(complete, raw) {
  const msg = parseMsg(raw);
  if (!msg) {
    console.log('Phantom: "%s"', String(raw));
    return;
  }

  const screenshot = new Buffer(msg.body, 'base64');
  png2palette(complete, screenshot);
}

exports.handler = function(event, context, callback) {
  const phantom = PhantomJs.exec('phjs-main.js', 'http://google.com/');

  phantom.stdout.on('data', (msg) => phantomHandler(callback, String(msg)));
  phantom.stderr.on('data', (err) => callback(String(err)));
  phantom.on('exit', (code) => console.log('Phantom exited with ' + code));
};
