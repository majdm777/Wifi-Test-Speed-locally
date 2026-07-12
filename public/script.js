const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');
const pingValueEl = document.getElementById('ping-value');
const jitterValueEl = document.getElementById('jitter-value');
const downloadValueEl = document.getElementById('download-value');
const uploadValueEl = document.getElementById('upload-value');

function setStatus(text) {
  statusEl.textContent = text;
}

// --- Ping / Jitter ---
// Hits /ping several times and measures round-trip time for each.
async function testPing(samples = 8) {
  const times = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    const res = await fetch(`/ping?cachebust=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Ping request failed with status ${res.status}`);
    }
    times.push(performance.now() - start);
  }
  const avgPing = times.reduce((a, b) => a + b, 0) / times.length;
  const jitter =
    times.reduce((sum, t) => sum + Math.abs(t - avgPing), 0) / times.length;
  return { avgPing, jitter };
}

// --- Download ---
// Downloads a chunk of data from the server and measures throughput.
async function testDownload(sizeInBytes = 25 * 1024 * 1024) {
  const start = performance.now();
  const res = await fetch(`/download?size=${sizeInBytes}&cachebust=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Download request failed with status ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('Readable response body not available');
  }

  let receivedBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
  }

  const durationSec = (performance.now() - start) / 1000;
  const mbps = (receivedBytes * 8) / durationSec / 1_000_000;
  return mbps;
}

// --- Upload ---
// Uploads a chunk of random data and measures throughput.
async function testUpload(sizeInBytes = 10 * 1024 * 1024) {
  const data = new Uint8Array(sizeInBytes); // zero-filled is fine, server discards it
  const start = performance.now();
  const res = await fetch('/upload', {
    method: 'POST',
    body: data,
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  if (!res.ok) {
    throw new Error(`Upload request failed with status ${res.status}`);
  }
  await res.arrayBuffer();

  const durationSec = (performance.now() - start) / 1000;
  const mbps = (sizeInBytes * 8) / durationSec / 1_000_000;
  return mbps;
}

async function runFullTest() {
  startBtn.disabled = true;
  pingValueEl.textContent = '--';
  jitterValueEl.textContent = '--';
  downloadValueEl.textContent = '--';
  uploadValueEl.textContent = '--';

  try {
    setStatus('Measuring ping...');
    const { avgPing, jitter } = await testPing();
    pingValueEl.textContent = avgPing.toFixed(1);
    jitterValueEl.textContent = jitter.toFixed(1);

    setStatus('Testing download speed...');
    const downloadMbps = await testDownload();
    downloadValueEl.textContent = downloadMbps.toFixed(1);

    setStatus('Testing upload speed...');
    const uploadMbps = await testUpload();
    uploadValueEl.textContent = uploadMbps.toFixed(1);

    setStatus('Done');
  } catch (err) {
    console.error(err);
    setStatus('Test failed — check the server is running');
  } finally {
    startBtn.disabled = false;
  }
}

startBtn.addEventListener('click', runFullTest);
