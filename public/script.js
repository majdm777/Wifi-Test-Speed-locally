import SpeedTest from 'https://esm.sh/@cloudflare/speedtest@latest';

const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');
const pingValueEl = document.getElementById('ping-value');
const jitterValueEl = document.getElementById('jitter-value');
const downloadValueEl = document.getElementById('download-value');
const uploadValueEl = document.getElementById('upload-value');

function setStatus(text) {
  statusEl.textContent = text;
}

function bpsToMbps(bps) {
  return bps / 1_000_000;
}

async function runFullTest() {
  startBtn.disabled = true;
  pingValueEl.textContent = '--';
  jitterValueEl.textContent = '--';
  downloadValueEl.textContent = '--';
  uploadValueEl.textContent = '--';
  setStatus('Starting test against Cloudflare\'s network...');

  const test = new SpeedTest({ autoStart: false });

  test.onResultsChange = ({ type }) => {
    // Update the UI live as each measurement type completes
    const results = test.results;

    const latency = results.getUnloadedLatency();
    if (latency != null) pingValueEl.textContent = latency.toFixed(1);

    const jitter = results.getUnloadedJitter();
    if (jitter != null) jitterValueEl.textContent = jitter.toFixed(1);

    const download = results.getDownloadBandwidth();
    if (download != null) downloadValueEl.textContent = bpsToMbps(download).toFixed(1);

    const upload = results.getUploadBandwidth();
    if (upload != null) uploadValueEl.textContent = bpsToMbps(upload).toFixed(1);

    if (type === 'latency') setStatus('Measuring ping and jitter...');
    if (type === 'download') setStatus('Testing download speed...');
    if (type === 'upload') setStatus('Testing upload speed...');
  };

  test.onFinish = () => {
    setStatus('Done');
    startBtn.disabled = false;
  };

  test.onError = (error) => {
    console.error(error);
    setStatus('Test failed — check your internet connection');
    startBtn.disabled = false;
  };

  test.play();
}

startBtn.addEventListener('click', runFullTest);
