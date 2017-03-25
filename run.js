const index = require('./index');

function callback(err, msg) {
  console.log(`callback: err=${err}, msg=${JSON.stringify(msg)}`);
  process.exit();
}

function run() {
  const event = {
    queryStringParameters: {
      url: 'http://tkm.io/',
    },
  };
  const context = {
    getRemainingTimeInMillis: () => 0,
  };
  index.handler(event, context, callback);
}

run();
