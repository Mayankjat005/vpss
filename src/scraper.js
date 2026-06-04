const https = require("https");
const crypto = require("crypto");
const { getRandomProxy } = require("./proxies");

const PEACHIFY_KEY_HEX = "a8f2a1b5e9c470814f6b2c3a5d8e7f9c1a2b3c4d5e3f7a8b8cad1e2d0a4d5c5b";
const keyBytes = Buffer.from(PEACHIFY_KEY_HEX, "hex");

function decodeBase64Url(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  return Buffer.from(b64, "base64");
}

function decryptPayload(payload) {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid payload format");
  }

  const iv = decodeBase64Url(parts[0]);
  const ciphertext = decodeBase64Url(parts[1]);
  const authTag = decodeBase64Url(parts[2]);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBytes, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Failed to decrypt payload");
  }
}

// Custom HTTPS Request with JA3 TLS Spoofing and Timeout
function spoofedFetch(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    
    // We get a cached agent for a random proxy
    const proxy = getRandomProxy();
    
    const reqOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: options.headers || {},
      agent: proxy.agent,
      // The magic ciphers that trick Cloudflare into thinking we are Chrome 125
      ciphers: "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA:AES256-SHA",
      honorCipherOrder: true,
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.3",
      secureProtocol: "TLS_method",
      servername: url.hostname
    };

    const req = https.request(reqOptions, (res) => {
      let data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(data).toString("utf8");
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers,
          text: () => Promise.resolve(body)
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    // Hard timeout so a dead proxy never freezes the VPS server
    const reqTimeout = setTimeout(() => {
      req.destroy();
      reject(new Error("Request timed out (Proxy might be dead)"));
    }, 4500);

    req.on('close', () => {
      clearTimeout(reqTimeout);
    });

    req.end();
  });
}

const SERVERS = {
  "Iron": { base: "https://uwu.eat-peach.sbs", path: "moviebox" },
  "Spider": { base: "https://usa.eat-peach.sbs", path: "holly" },
  "Wolf": { base: "https://usa.eat-peach.sbs", path: "air" },
  "Multi": { base: "https://usa.eat-peach.sbs", path: "multi" },
  "Dark": { base: "https://uwu.eat-peach.sbs", path: "net" }
};

async function fetchPeachify(serverName, mediaType, id, season = null, episode = null, isSub = false) {
  const server = SERVERS[serverName];
  if (!server) {
    return { error: `Invalid server name: ${serverName}` };
  }

  let url = '';
  if (isSub) {
    url = `${server.base}/subs/${mediaType}/${id}`;
    if (mediaType === 'tv' && season && episode) {
      url += `/${season}/${episode}`;
    }
  } else {
    url = `${server.base}/${server.path}/${mediaType}/${id}`;
    if (mediaType === 'tv' && season && episode) {
      url += `/${season}/${episode}`;
    }
  }

  // Common modern browser headers
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

  try {
    const res = await spoofedFetch(url, { headers });

    if (!res.ok) {
      return { error: `HTTP ${res.status}`, server: serverName };
    }

    const text = await res.text();
    if (!text) return { error: "Empty response", server: serverName };

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { error: "Invalid JSON response", server: serverName };
    }

    if (data.isEncrypted && data.data) {
      const decrypted = decryptPayload(data.data);
      return { server: serverName, data: decrypted };
    } else if (data.result) {
      const decrypted = decryptPayload(data.result);
      return { server: serverName, data: decrypted };
    }

    return { server: serverName, data: data };
  } catch (err) {
    return { error: err.message, server: serverName };
  }
}

module.exports = { fetchPeachify };
