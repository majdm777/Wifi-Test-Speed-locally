import SpeedTest from 'https://esm.sh/@cloudflare/speedtest@latest';

const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');
const pingValueEl = document.getElementById('ping-value');
const jitterValueEl = document.getElementById('jitter-value');
const downloadValueEl = document.getElementById('download-value');
const uploadValueEl = document.getElementById('upload-value');

let activeTest = null;
let isTestRunning = false;
let hasFinished = false;

function setStatus(text, state = 'info') {
  statusEl.textContent = text;
  statusEl.className = `status ${state}`;
}

function resetResults() {
  pingValueEl.textContent = '--';
  jitterValueEl.textContent = '--';
  downloadValueEl.textContent = '--';
  uploadValueEl.textContent = '--';
}

function bpsToMbps(bps) {
  return bps / 1_000_000;
}

function finishTest(message, state = 'success') {
  if (hasFinished) return;

  hasFinished = true;
  isTestRunning = false;
  startBtn.disabled = false;
  setStatus(message, state);
}

function stopActiveTest() {
  if (!activeTest) return;

  try {
    if (typeof activeTest.stop === 'function') {
      activeTest.stop();
    } else if (typeof activeTest.abort === 'function') {
      activeTest.abort();
    }
  } catch (error) {
    console.warn('Could not stop the speed test cleanly:', error);
  }
}

function handleConnectionLoss() {
  if (!isTestRunning) return;

  stopActiveTest();
  finishTest('Test interrupted — no internet connection', 'error');
}

window.addEventListener('offline', handleConnectionLoss);
window.addEventListener('online', () => {
  if (!isTestRunning) {
    setStatus('Connection restored. You can start a new test.', 'info');
  }
});

async function runFullTest() {
  if (!navigator.onLine) {
    setStatus('Test interrupted — no internet connection', 'error');
    return;
  }

  hasFinished = false;
  isTestRunning = true;
  startBtn.disabled = true;
  resetResults();
  setStatus('Starting test against Cloudflare\'s network...', 'running');

  const test = new SpeedTest({ autoStart: false });
  activeTest = test;

  test.onResultsChange = ({ type }) => {
    if (!navigator.onLine) {
      handleConnectionLoss();
      return;
    }

    const results = test.results;

    const latency = results.getUnloadedLatency();
    if (latency != null) pingValueEl.textContent = latency.toFixed(1);

    const jitter = results.getUnloadedJitter();
    if (jitter != null) jitterValueEl.textContent = jitter.toFixed(1);

    const download = results.getDownloadBandwidth();
    if (download != null) downloadValueEl.textContent = bpsToMbps(download).toFixed(1);

    const upload = results.getUploadBandwidth();
    if (upload != null) uploadValueEl.textContent = bpsToMbps(upload).toFixed(1);

    if (type === 'latency') setStatus('Measuring ping and jitter...', 'running');
    if (type === 'download') setStatus('Testing download speed...', 'running');
    if (type === 'upload') setStatus('Testing upload speed...', 'running');
  };

  test.onFinish = () => {
    if (!navigator.onLine) {
      handleConnectionLoss();
      return;
    }

    finishTest('Done', 'success');
    activeTest = null;
  };

  test.onError = (error) => {
    console.error(error);
    if (!navigator.onLine) {
      finishTest('Test interrupted — no internet connection', 'error');
    } else {
      finishTest('Test failed — check your internet connection', 'error');
    }
    activeTest = null;
  };

  test.play();
}

startBtn.addEventListener('click', runFullTest);
