# WiFi Speed Test

A simple, self-hosted WiFi speed test — no internet connection required. Runs entirely on your local network and measures download speed, upload speed, ping, and jitter between your device and the server.

## Why

Public speed test sites measure your connection to their servers over the internet. This tool measures speed over your **local WiFi network** — useful for testing WiFi performance on its own, without your ISP or internet routing being part of the result.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework, no build step)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS version recommended)

### Installation

```bash
git clone <your-repo-url>
cd wifi-speed-test
npm install
```

### Run

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing Other Devices on Your Network

To test WiFi speed from a phone or another computer:

1. Find your host machine's local IP address:
   - **Mac/Linux:** `ifconfig | grep inet`
   - **Windows:** `ipconfig`
   - Look for something like `192.168.1.X`
2. On the other device (connected to the same WiFi), open `http://192.168.1.X:3000`
3. Click **Start Test**

## How It Works

- **Ping/Jitter:** Sends repeated lightweight requests to `/ping` and measures round-trip time and variance.
- **Download:** Requests a large data blob from `/download` and times how long it takes to fully arrive.
- **Upload:** Sends a data blob to `/upload` and times how long the server takes to receive it.

Speeds are calculated in Mbps from the transferred byte size and elapsed time.

## Project Structure

```
wifi-speed-test/
├── server/
│   ├── server.js          # Express app entry point
│   └── routes/
│       └── speedtest.js   # /download, /upload, /ping endpoints
├── public/
│   ├── index.html         # Test page UI
│   ├── style.css
│   └── script.js          # Client-side test logic
├── package.json
└── README.md
```

## Notes

- Results are capped by your machine's own network interface speed, not just the WiFi link itself.
- No data is stored — uploaded test data is discarded immediately by the server.

