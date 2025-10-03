const {onRequest} = require("firebase-functions/v2/https");
const cors = require('cors')({ origin: true });

exports.test = onRequest((req, res) => {
  cors(req, res, () => {
    res.json({ 
      message: 'Hello World!', 
      timestamp: new Date().toISOString(),
      version: 'Firebase Functions v2'
    });
  });
});