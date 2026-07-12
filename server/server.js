const express = require('express');
const path = require('path');
const speedtestRoutes = require('./routes/speedtest');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse raw bodies for the upload test (we don't need to actually read the content,
// just consume the stream — handled inside the route itself)
app.use('/upload', express.raw({ type: '*/*', limit: '200mb' }));

// API routes
app.use('/', speedtestRoutes);

// Serve the frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Speed test server running:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<your-local-ip>:${PORT}  (use this from other devices on your WiFi)`);
});
