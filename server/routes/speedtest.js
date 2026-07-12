const express = require('express');
const router = express.Router();

// Pre-generate a big buffer once at startup so /download doesn't waste time
// generating random bytes on every request. 50MB is enough to slice from.
const MAX_BUFFER_SIZE = 50 * 1024 * 1024; // 50MB
const dummyBuffer = Buffer.alloc(MAX_BUFFER_SIZE);
require('crypto').randomFillSync(dummyBuffer);

// GET /download?size=<bytes>
// Sends back <size> bytes of data for the client to time.
router.get('/download', (req, res) => {
  let size = parseInt(req.query.size, 10) || 10 * 1024 * 1024; // default 10MB
  size = Math.min(size, MAX_BUFFER_SIZE); // cap it

  res.set('Content-Type', 'application/octet-stream');
  res.set('Cache-Control', 'no-store');
  res.send(dummyBuffer.subarray(0, size));
});

// POST /upload
// Client sends a blob of data; we just consume it and confirm receipt.
// Body parsing (express.raw) happens in server.js for this route.
router.post('/upload', (req, res) => {
  // req.body is already fully buffered by express.raw by the time we're here
  res.set('Cache-Control', 'no-store');
  res.sendStatus(200);
});

// GET /ping
// Tiny endpoint for latency/jitter measurement.
router.get('/ping', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendStatus(200);
});

module.exports = router;
