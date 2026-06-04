const https = require("https");

const SERVERS = {
  "Iron": { base: "https://uwu.eat-peach.sbs", path: "moviebox" },
  "Spider": { base: "https://usa.eat-peach.sbs", path: "holly" },
  "Wolf": { base: "https://usa.eat-peach.sbs", path: "air" },
  "Multi": { base: "https://usa.eat-peach.sbs", path: "multi" },
  "Dark": { base: "https://uwu.eat-peach.sbs", path: "net" }
};

const headers = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  "origin": "https://peachify.top",
  "priority": "u=1, i",
  "referer": "https://peachify.top/",
  "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
};

function testDirectFetch(urlStr) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: "GET",
      headers: headers,
      // Spoofed TLS configurations
      ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA:AES256-SHA",
      honorCipherOrder: true,
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.3",
      servername: url.hostname,
      timeout: 5000
    };

    const startTime = Date.now();
    const req = https.request(reqOptions, (res) => {
      let data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(data).toString("utf8");
        resolve({
          status: res.statusCode,
          time: `${Date.now() - startTime}ms`,
          ok: res.statusCode === 200,
          preview: body.substring(0, 200)
        });
      });
    });

    req.on("error", (err) => {
      resolve({ status: "ERROR", error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ status: "TIMEOUT", error: "Connection timed out" });
    });

    req.end();
  });
}

async function run() {
  // Test a movie sub request to the Iron server
  const testUrl = `${SERVERS.Iron.base}/subs/movie/299534`;
  console.log(`Testing direct connection from VPS to target: ${testUrl}`);
  
  const result = await testDirectFetch(testUrl);
  console.log("\n--- TEST RESULT ---");
  console.log("Status Code:", result.status);
  console.log("Response Time:", result.time);
  if (result.ok) {
    console.log("✅ Success! VPS IP is NOT blocked by eat-peach.sbs.");
    console.log("Response Preview:", result.preview);
  } else {
    console.log("❌ Failed! VPS IP is blocked or rejected.");
    console.log("Error/Detail:", result.error || result.preview);
  }
}

run();
