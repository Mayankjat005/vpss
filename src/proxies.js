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

// Persistent agents for connection reuse (major speed boost on VPS)
const agentPool = {};

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

function getRandomProxy() {
  const url = proxyList[Math.floor(Math.random() * proxyList.length)];
  return {
    url,
    agent: getProxyAgent(url)
  };
}

module.exports = {
  getRandomProxy
};
