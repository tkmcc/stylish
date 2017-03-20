const aws = require('aws-sdk');
const phantomjs = require('phantomjs-prebuilt');

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

function phantomHandler(callback, msgRaw) {
  const msg = parseJson(msgRaw);
  if (!msg || !msg.status || msg.status !== 'ok') {
    console.log('Phantom: "%s"', String(msgRaw));
    return;
  }

  const screenshot = new Buffer(msg.body, 'base64');
  callback(null, 'Execution was successful!');
}

exports.handler = function(event, context, callback) {
  const phantom = phantomjs.exec('phjs-main.js', 'http://google.com/');

  phantom.stdout.on('data', (msg) => phantomHandler(callback, String(msg)));
  phantom.stderr.on('data', (err) => callback(String(err)));
  phantom.on('exit', (code) => console.log('Phantom exited with ' + code));
};
