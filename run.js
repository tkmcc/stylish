const index = require('./index');

function callback(err, msg) {
  console.log(`callback: err=${err}, msg=${JSON.stringify(msg)}`);
}

function run() {
  const event = {
    queryStringParameters: {
      url: 'http://tkm.io/',
    },
  };
  const context = {};
  index.handler(event, context, callback);
}

run();
