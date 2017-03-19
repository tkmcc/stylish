const aws = require('aws-sdk');
const phantomjs = require('phantomjs-prebuilt');

exports.handler = function(event, context, callback) {
  const phantom = phantomjs.exec('phjs-main.js', 'http://google.com/');

  phantom.stdout.on('data', function(buf) {
    console.log('[STR] stdout "%s"', String(buf));
  });

  phantom.stderr.on('data', function(buf) {
    console.log('[STR] stderr "%s"', String(buf));
    context.fail(buf);
  });

  phantom.on('close', function(code) {
    console.log('[END] code', code);
  });

  phantom.on('exit', code => {
    callback(null, 'Execution complete!');
  });
};
