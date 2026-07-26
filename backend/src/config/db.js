import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

const connectWithRetry = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== "production",
    });
    console.log(
      `[db] MongoDB connected → host: ${conn.connection.host}, db: ${conn.connection.name}, env: ${env.nodeEnv}`
    );
  } catch (error) {
    console.error(`[db] Initial connection failed: ${error.message}`);
    console.error("[db] Retrying in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

export const connectDB = async () => {
  await connectWithRetry();
};

mongoose.connection.on("error", (err) => {
  console.error(`[db] Connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[db] Disconnected. Attempting to reconnect...");
  connectWithRetry();
});

mongoose.connection.on("reconnected", () => {
  console.log("[db] Reconnected successfully.");
});

const gracefulShutdown = async (signal) => {
  console.log(`\n[db] ${signal} received. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log("[db] MongoDB connection closed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error(`[db] Error during shutdown: ${err.message}`);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));