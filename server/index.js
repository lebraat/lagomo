const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const config = require("./config/config");
require("dotenv").config();

const app = express();

// Initialize configuration before starting server
async function startServer() {
  try {
    // Load configuration (including secrets)
    const appConfig = await config.getConfig();
    const PORT = appConfig.server.port;

    // Middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'", "wss:", "https:", "http:"],
          frameSrc: ["'self'", "https:", "http:"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    app.use(cors());
    app.use(express.json());

    // Rate limiting middleware
    const rateLimit = require("express-rate-limit");
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    app.use(limiter);

    // Serve static files from root directory
    app.use(express.static(path.join(__dirname, "..")));

    // Database
    const sequelize = require("./config/database");

    // Routes
    const authRoutes = require("./routes/auth.routes");
    app.use("/api/auth", authRoutes);

    // Test database connection
    sequelize.authenticate()
      .then(() => console.log("Database connected successfully"))
      .catch(err => console.error("Unable to connect to the database:", err));

    // Sync database models
    sequelize.sync({ alter: true })
      .then(() => console.log("Database synced"))
      .catch(err => console.error("Error syncing database:", err));

    // Health check route
    app.get("/health", (req, res) => {
      res.json({ status: "healthy" });
    });

    // Serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(__dirname, "..", "index.html"));
    });

    // Error handling middleware
    app.use((err, req, res) => {
      console.error(err.stack);
      res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    });

    // Graceful shutdown handler
    const gracefulShutdown = async () => {
      console.log("Received shutdown signal. Starting graceful shutdown...");
      
      try {
        // Cleanup AWS resources
        await (await import("./config/aws")).shutdown();
        
        // Close database connections
        await require("./config/database").close();
        
        console.log("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
