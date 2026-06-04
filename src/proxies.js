const { HttpsProxyAgent } = require("https-proxy-agent");

// Webshare residential proxies (same as the previous ones)
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

const https = require("https");

// Persistent agents for connection reuse (major speed boost on VPS)
const agentPool = {};
let workingProxies = [...proxyList]; // Start with all, filter dynamically

function getProxyAgent(proxyUrl) {
  if (!agentPool[proxyUrl]) {
    agentPool[proxyUrl] = new HttpsProxyAgent(proxyUrl, {
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 3000 // 3s socket timeout (fast failover)
    });
  }
  return agentPool[proxyUrl];
}

// Check if a single proxy is healthy
async function checkProxyHealth(proxyUrl) {
  return new Promise((resolve) => {
    const agent = getProxyAgent(proxyUrl);
    const req = https.get("https://httpbin.org/ip", { agent, timeout: 3000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Background worker to update working proxies
async function updateWorkingProxies() {
  console.log("[Proxy Monitor] Checking proxy health...");
  const statusList = await Promise.all(
    proxyList.map(async (url) => {
      const isWorking = await checkProxyHealth(url);
      return { url, isWorking };
    })
  );

  const active = statusList.filter(p => p.isWorking).map(p => p.url);
  if (active.length > 0) {
    workingProxies = active;
    console.log(`[Proxy Monitor] Updated active proxies pool: ${workingProxies.length}/${proxyList.length} working.`);
  } else {
    // If all failed, don't empty the list (fallback to all to avoid division by zero/crash)
    workingProxies = [...proxyList];
    console.warn("[Proxy Monitor] WARNING: All proxies failed! Falling back to full list.");
  }
}

// Run initial check and set interval for every 3 minutes
updateWorkingProxies();
setInterval(updateWorkingProxies, 3 * 60 * 1000);

function getRandomProxy() {
  const url = workingProxies[Math.floor(Math.random() * workingProxies.length)];
  return {
    url,
    agent: getProxyAgent(url)
  };
}

module.exports = {
  getRandomProxy
};
