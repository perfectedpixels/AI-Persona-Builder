const serverless = require('serverless-http');
const app = require('./server/index');

// Wrap Express app for Lambda with binary support
// The binary option tells serverless-http which content types should be base64 encoded
module.exports.handler = serverless(app, {
  binary: ['audio/mpeg', 'audio/*']
});
