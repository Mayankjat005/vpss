module.exports = {
  apps: [
    {
      name: "peachify-api",
      script: "src/index.js",
      instances: "max",       // Run across all available CPU cores for max performance
      exec_mode: "cluster",   // Cluster mode for load balancing
      autorestart: true,      // Automatically restart on crash
      watch: false,           // Do not restart on file changes in production
      max_memory_restart: "1G", // Restart if it uses too much memory
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
