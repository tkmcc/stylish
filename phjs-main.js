/* eslint-env phantomjs */

var system = require('system');
var webpage = require('webpage');

var page = webpage.create();
var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) ' +
         'AppleWebKit/537.36 (KHTML, like Gecko) ' +
         'Chrome/56.0.2924.87 Safari/537.36';
var args = JSON.parse(system.args[1]);
var url = args.url;
var viewSize = args.viewSize;


function complete(msg) {
  console.log(JSON.stringify(msg));
  phantom.exit();
}

function uponWindowLoad() {
  var render = page.renderBase64('PNG');
  var msg = {
    status: 'ok',
    body: render,
  };

  complete(msg);
}

function uponPageOpen(status) {
  if (status !== 'success') {
    var msg = {
      status: 'error',
      body: status,
    };

    complete(msg);
    return;
  }

  // Wait an extra second for anything else to load
  window.setTimeout(uponWindowLoad, 1000);
}

page.settings.userAgent = ua;
page.viewportSize = viewSize;

page.open(url, uponPageOpen);
