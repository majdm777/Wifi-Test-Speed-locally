# WiFi Speed Test

A small web interface for measuring a device's internet connection against
Cloudflare. The Node.js server hosts the interface on your computer so that
devices on the same local network can open it.

## What It Measures

The browser sends timed requests to Cloudflare's speed-test endpoints and
reports:

- **Ping** and **jitter** to Cloudflare
- **Download** bandwidth from Cloudflare
- **Upload** bandwidth to Cloudflare

This is an internet speed test, not a Wi-Fi-only or LAN-throughput test. The
result includes the device's Wi-Fi connection, router, ISP connection, and the
path to Cloudflare. It therefore may differ from tests run against other
providers or endpoints.

The local Express server serves the page. Although the repository also contains
`/ping`, `/download`, and `/upload` routes, the current browser client does not
use them for its measurements.

Each download and upload stage has a maximum duration of **30 seconds**. The
display updates while data is transferred; when a stage reaches its limit, its
in-progress request is stopped and the latest throughput value is retained.

## Requirements

- [Node.js](https://nodejs.org/) (an LTS release is recommended)
- Internet access, so the browser can load the Cloudflare speed-test module and
  contact Cloudflare's network

## Install and Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) and select **Start Internet
Speed Test**.

For development with automatic server restarts:

```bash
npm run dev
```

## Test Another Device on the Same Network

1. Start the server on the host computer.
2. Find the host's private IP address (on Windows, run `ipconfig`; look for an
   address such as `192.168.1.20`).
3. On a phone or computer connected to the same LAN/Wi-Fi, open
   `http://<host-ip>:3000`.
4. Start the test in that device's browser.

The displayed result is for the device running the browser, not necessarily the
computer hosting the server. If the page cannot be reached, allow Node.js
through the host firewall for private networks.

## Project Structure

```text
server/
  server.js              Express server and static-file host
  routes/speedtest.js    Local ping/download/upload endpoints (currently unused by the client)
public/
  index.html             Page markup
  style.css              Page styling
  script.js              Timed Cloudflare speed-test client logic
package.json
```

## Notes

- The app does not persist test results.
- A lost internet connection interrupts the test.
- The browser must be able to reach Cloudflare's speed-test service.

## License

MIT
