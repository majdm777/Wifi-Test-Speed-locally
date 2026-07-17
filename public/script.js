const startBtn = document.getElementById('start-btn');
const statusEl = document.getElementById('status');
const pingValueEl = document.getElementById('ping-value');
const jitterValueEl = document.getElementById('jitter-value');
const downloadValueEl = document.getElementById('download-value');
const uploadValueEl = document.getElementById('upload-value');

const SPEED_TEST_ORIGIN = 'https://speed.cloudflare.com';
const STAGE_DURATION_MS = 30_000;
const TRANSFER_CHUNK_BYTES = 25 * 1024 * 1024;
const PING_SAMPLE_COUNT = 8;

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

function updateSpeed(element, bps) {
  if (bps > 0) element.textContent = bpsToMbps(bps).toFixed(1);
}

function finishTest(message, state = 'success') {
  if (hasFinished) return;

  hasFinished = true;
  isTestRunning = false;
  activeTest = null;
  startBtn.disabled = false;
  setStatus(message, state);
}

function stopActiveTest() {
  if (!activeTest) return;

  activeTest.cancelled = true;
  activeTest.requests.forEach((request) => request.abort());
  activeTest.requests.clear();
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

function requestUrl(direction, bytes) {
  const endpoint = direction === 'upload' ? '__up' : '__down';
  return `${SPEED_TEST_ORIGIN}/${endpoint}?bytes=${bytes}&cacheBust=${crypto.randomUUID()}`;
}

function measurePing(test) {
  return new Promise((resolve, reject) => {
    const samples = [];

    const takeSample = () => {
      if (test.cancelled) return resolve(null);
      if (samples.length === PING_SAMPLE_COUNT) return resolve(samples);

      const request = new XMLHttpRequest();
      const startedAt = performance.now();
      test.requests.add(request);

      request.open('GET', requestUrl('download', 0));
      request.onload = () => {
        test.requests.delete(request);
        samples.push(performance.now() - startedAt);
        takeSample();
      };
      request.onerror = () => {
        test.requests.delete(request);
        reject(new Error('Could not measure latency.'));
      };
      request.onabort = () => {
        test.requests.delete(request);
        resolve(null);
      };
      request.send();
    };

    takeSample();
  });
}

function runTimedTransfer(test, direction, updateValue) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const uploadData = direction === 'upload' ? new Blob([new Uint8Array(TRANSFER_CHUNK_BYTES)]) : null;
    let completedBytes = 0;
    let activeRequest = null;
    let activeRequestBytes = 0;
    let settled = false;

    const getSpeed = () => {
      const elapsedSeconds = (performance.now() - startedAt) / 1000;
      return elapsedSeconds > 0 ? ((completedBytes + activeRequestBytes) * 8) / elapsedSeconds : 0;
    };

    const reportSpeed = () => updateValue(getSpeed());

    const finish = (timedOut = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(stageTimer);
      if (activeRequest) test.requests.delete(activeRequest);
      reportSpeed();
      resolve({ timedOut, bps: getSpeed() });
    };

    const startRequest = () => {
      if (settled || test.cancelled) return finish();

      activeRequestBytes = 0;
      const request = new XMLHttpRequest();
      activeRequest = request;
      test.requests.add(request);

      request.open(direction === 'download' ? 'GET' : 'POST', requestUrl(direction, TRANSFER_CHUNK_BYTES));
      if (direction === 'download') {
        request.onprogress = (event) => {
          activeRequestBytes = event.loaded;
          reportSpeed();
        };
      } else {
        request.upload.onprogress = (event) => {
          activeRequestBytes = event.loaded;
          reportSpeed();
        };
      }
      request.onload = () => {
        test.requests.delete(request);
        if (request.status < 200 || request.status >= 300) {
          settled = true;
          clearTimeout(stageTimer);
          reject(new Error(`Could not test ${direction} speed.`));
          return;
        }
        completedBytes += TRANSFER_CHUNK_BYTES;
        activeRequest = null;
        activeRequestBytes = 0;
        reportSpeed();
        if (performance.now() - startedAt >= STAGE_DURATION_MS) finish();
        else startRequest();
      };
      request.onerror = () => {
        test.requests.delete(request);
        if (!settled && !test.cancelled) {
          settled = true;
          clearTimeout(stageTimer);
          reject(new Error(`Could not test ${direction} speed.`));
        }
      };
      request.onabort = () => {
        test.requests.delete(request);
        if (test.cancelled) finish();
      };
      request.send(uploadData);
    };

    const stageTimer = setTimeout(() => {
      if (activeRequest) activeRequest.abort();
      finish(true);
    }, STAGE_DURATION_MS);

    startRequest();
  });
}

async function runFullTest() {
  if (!navigator.onLine) {
    setStatus('Test interrupted — no internet connection', 'error');
    return;
  }

  hasFinished = false;
  isTestRunning = true;
  startBtn.disabled = true;
  resetResults();
  const test = { cancelled: false, requests: new Set() };
  activeTest = test;

  try {
    setStatus('Measuring ping and jitter...', 'running');
    const pingSamples = await measurePing(test);
    if (test.cancelled) return;

    const ping = pingSamples.reduce((sum, sample) => sum + sample, 0) / pingSamples.length;
    const jitter = pingSamples.slice(1).reduce((sum, sample, index) => (
      sum + Math.abs(sample - pingSamples[index])
    ), 0) / (pingSamples.length - 1);
    pingValueEl.textContent = ping.toFixed(1);
    jitterValueEl.textContent = jitter.toFixed(1);

    setStatus('Testing download speed (up to 30 seconds)...', 'running');
    const download = await runTimedTransfer(test, 'download', (bps) => updateSpeed(downloadValueEl, bps));
    if (test.cancelled) return;

    setStatus('Testing upload speed (up to 30 seconds)...', 'running');
    const upload = await runTimedTransfer(test, 'upload', (bps) => updateSpeed(uploadValueEl, bps));
    if (test.cancelled) return;

    const limitedStages = [download, upload].filter((stage) => stage.timedOut).length;
    finishTest(limitedStages ? 'Done — one or more stages reached the 30-second limit' : 'Done', 'success');
  } catch (error) {
    console.error(error);
    if (!test.cancelled) finishTest('Test failed — check your internet connection', 'error');
  }
}

startBtn.addEventListener('click', runFullTest);
