const index = require('./index');

function callback(err, msg) {
  console.log(`callback: err=${err}, msg=${msg}`);
}

function run() {
  const event = {};
  const context = {};
  index.handler(event, context, callback);
}

run();
