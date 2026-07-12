# WiFi Speed Test





## Why


Why?
because they lie to us .
the results you get is not correct 
Trust me.
i am using the same engine tho.

Public speed test sites measure your connection to their servers over the internet. This app does the same thing, but in a simple local web interface. It uses [Cloudflare's official speed test engine](https://github.com/cloudflare/speedtest) (`@cloudflare/speedtest`), the same underlying code that powers [speed.cloudflare.com](https://speed.cloudflare.com). That means the results should be comparable to other major online speed tests.

This is a real internet speed test, not a loopback-only test. The local Express server is only used to serve the page and frontend assets.


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

The app loads `@cloudflare/speedtest` in the browser and runs its full measurement sequence against Cloudflare's edge network:

- **Ping/Jitter:** Unloaded latency measurements against Cloudflare's edge.
- **Download:** A ramping sequence of GET requests of increasing size, measuring throughput.
- **Upload:** A ramping sequence of POST requests of increasing size, measuring throughput.

Results update live in the UI as each stage completes. The local Express server included in this project just serves the static frontend files — it isn't used for the speed measurements themselves.

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

## License

MIT