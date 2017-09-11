const index = require('./index');

function callback(err, msg) {
  console.log(`callback: err=${err}, msg=${JSON.stringify(msg)}`);
  process.exit();
}

function run() {
  const LAMBDA_EXECUTION_TIMEOUT_MS = 30 * 1000; // 30 second timeout
  const now = Date.now();

  const event = {
    queryStringParameters: {
      url: 'http://tkm.io/',
    },
  };

  const context = {
    getRemainingTimeInMillis: () => {
      return (LAMBDA_EXECUTION_TIMEOUT_MS - (Date.now() - now));
    },
  };

  index.handler(event, context, callback);
}

run();
