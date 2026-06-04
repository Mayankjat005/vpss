const { getRandomProxy } = require("./proxies");
const https = require("https");

const proxyList = [
  "http://ztdsasjc:v3o40d03uyiv@38.154.203.95:5863",
  "http://ztdsasjc:v3o40d03uyiv@198.105.121.200:6462",
  "http://ztdsasjc:v3o40d03uyiv@64.137.96.74:6641",
  "http://ztdsasjc:v3o40d03uyiv@209.127.138.10:5784",
  "http://ztdsasjc:v3o40d03uyiv@38.154.185.97:6370",
  "http://ztdsasjc:v3o40d03uyiv@84.247.60.125:6095",
  "http://ztdsasjc:v3o40d03uyiv@142.111.67.146:5611",
  "http://ztdsasjc:v3o40d03uyiv@191.96.254.138:6185",
  "http://ztdsasjc:v3o40d03uyiv@31.58.9.4:6077",
  "http://ztdsasjc:v3o40d03uyiv@104.239.107.47:5699"
];

const { HttpsProxyAgent } = require("https-proxy-agent");

async function testProxy(proxyUrl) {
  return new Promise((resolve) => {
    const agent = new HttpsProxyAgent(proxyUrl, { timeout: 4000 });
    const startTime = Date.now();
    
    const req = https.get("https://httpbin.org/ip", { agent, timeout: 4000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve({ proxy: proxyUrl, status: "WORKING", time: `${Date.now() - startTime}ms`, response: data.trim() });
        } else {
          resolve({ proxy: proxyUrl, status: "FAILED", error: `HTTP ${res.statusCode}` });
        }
      });
    });
    
    req.on("error", (err) => {
      resolve({ proxy: proxyUrl, status: "FAILED", error: err.message });
    });
    
    req.on("timeout", () => {
      req.destroy();
      resolve({ proxy: proxyUrl, status: "FAILED", error: "Timeout" });
    });
  });
}

async function run() {
  console.log("Testing all proxies...");
  const results = [];
  for (const proxy of proxyList) {
    const res = await testProxy(proxy);
    console.log(`${res.status === "WORKING" ? "✅" : "❌"} ${res.proxy} -> ${res.status} ${res.error || res.time}`);
    results.push(res);
  }
  
  const workingCount = results.filter(r => r.status === "WORKING").length;
  console.log(`\nResults: ${workingCount}/${proxyList.length} proxies working.`);
}

run();
