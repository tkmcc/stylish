/* eslint-env phantomjs */

const system = require('system');
const webpage = require('webpage');

const page = webpage.create();
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) ' +
         'AppleWebKit/537.36 (KHTML, like Gecko) ' +
         'Chrome/56.0.2924.87 Safari/537.36';
const args = JSON.parse(system.args[1]);
const url = args.url;
const viewSize = args.viewSize;
const ws = new WebSocket(args.wss);

function prepareWs() {
  ws.onerror = function (error) {
    console.log('WebSocket: ' + error);
    phantom.exit();
  };
}

function complete(msg) {
  ws.send(JSON.stringify(msg));
  ws.close(0);

  phantom.exit();
}

function renderPage() {
  const render = page.renderBase64('PNG');
  const msg = {
    status: 'ok',
    body: render,
  };

  complete(msg);
}

function uponPageOpen(status) {
  if (status === 'success') {
    renderPage();
    return;
  }

  const msg = {
    status: 'error',
    body: status,
  };

  complete(msg);
}

prepareWs();

page.settings.userAgent = ua;
page.viewportSize = viewSize;

page.open(url, uponPageOpen);
