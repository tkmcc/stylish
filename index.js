const PhantomJs = require('phantomjs-prebuilt');
const Png = require('pngjs').PNG;
const RgbQuant = require('rgbquant');

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

function png2palette(complete, png) {
  const rgb = png.data;

  // Turn array of {R, G, B, A} into array of 32 bit pixels
  const pixels = rgb.reduce((acc, val, index) => {
    const pos = (index % 4);
    if (pos === 0) {
      acc.push(0);
    }

    const pixel = acc.pop();
    const color = val & 0xff;
    const shiftBits = 8 * pos;

    acc.push(pixel & (color << shiftBits));

    return acc;
  }, []);

  const u32pixels = new Uint32Array(pixels);

  const q = new RgbQuant({ colors: 8 });
  q.sample(u32pixels);

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

  const png = new Png({ filterType: 4 });
  png.parse(screenshot, png2palette.bind(complete, png));
}

exports.handler = function (event, context, callback) {
  const phantom = PhantomJs.exec('phjs-main.js', JSON.stringify(PHANTOM_ARGS));

  phantom.stdout.on('data', msg => phantomHandler(callback, String(msg)));
  phantom.stderr.on('data', err => callback(String(err)));
  phantom.on('exit', code => console.log(`Phantom exited with ${code}`));
};
