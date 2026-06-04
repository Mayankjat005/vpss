const express = require("express");
const { fetchPeachify, SERVERS } = require("./scraper");

const router = express.Router();

// Fallback logic to try multiple servers if one fails or blocks
async function tryFetchWithFallback(mediaType, id, season, episode, isSub) {
  const serverNames = Object.keys(SERVERS);
  const errors = [];

  for (const serverName of serverNames) {
    console.log(`[VPS Scraper] Trying server ${serverName} for ${mediaType} ${id}...`);
    const result = await fetchPeachify(serverName, mediaType, id, season, episode, isSub);
    
    if (!result.error) {
      return result; // Success
    }
    
    console.warn(`[VPS Scraper] Server ${serverName} failed:`, result.error);
    errors.push({ server: serverName, error: result.error });
  }

  // If all servers failed, return all errors for debugging
  return { error: "All servers failed", details: errors };
}

// Media streams endpoint
router.get("/all/:mediaType/:id/:season?/:episode?", async (req, res) => {
  const { mediaType, id, season, episode } = req.params;
  const result = await tryFetchWithFallback(mediaType, id, season, episode, false);
  
  if (result.error && !result.details) {
    return res.status(500).json(result);
  } else if (result.error && result.details) {
    return res.status(502).json(result); // Bad Gateway if proxies failed
  }
  
  res.json(result);
});

// Subtitles endpoint
router.get("/subs/:mediaType/:id/:season?/:episode?", async (req, res) => {
  const { mediaType, id, season, episode } = req.params;
  const result = await tryFetchWithFallback(mediaType, id, season, episode, true);
  
  if (result.error && !result.details) {
    return res.status(500).json(result);
  } else if (result.error && result.details) {
    return res.status(502).json(result);
  }
  
  res.json(result);
});

module.exports = router;
