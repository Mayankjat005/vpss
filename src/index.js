require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const apiRoutes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: "*", // Adjust to your frontend domain in production (e.g. "https://peachify.top")
  methods: ["GET", "POST", "OPTIONS"]
}));
app.use(express.json());

// Main API Router
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[VPS] Peachify API Scraper running on port ${PORT}`);
  console.log(`[VPS] PM2 Mode: ${process.env.pm_id ? "Active" : "Inactive"}`);
});
