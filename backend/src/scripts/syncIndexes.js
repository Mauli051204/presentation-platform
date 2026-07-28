import mongoose from "mongoose";
import dotenv from "dotenv";
import { env } from "../config/env.js";

import User from "../models/User.js";
import PresenterProfile from "../models/PresenterProfile.js";
import CollegeProfile from "../models/CollegeProfile.js";
import Requirement from "../models/Requirement.js";
import Application from "../models/Application.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import SearchLog from "../models/SearchLog.js";
import RefreshToken from "../models/RefreshToken.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import PlatformSettings from "../models/PlatformSettings.js";

dotenv.config();

const models = [
  User,
  PresenterProfile,
  CollegeProfile,
  Requirement,
  Application,
  Booking,
  Payment,
  Review,
  Notification,
  SearchLog,
  RefreshToken,
  Conversation,
  Message,
  PlatformSettings,
];

const run = async () => {
  console.log("Connecting to: " + env.mongoUri.replace(/\/\/.*@/, "//<redacted>@"));
  await mongoose.connect(env.mongoUri);
  console.log("Connected. Syncing indexes for all models...\n");

  for (const model of models) {
    try {
      await model.syncIndexes();
      console.log("OK: " + model.modelName + " - indexes synced");
    } catch (error) {
      console.error("FAILED: " + model.modelName + " - " + error.message);
    }
  }

  console.log("\nDone. Verifying Requirement text index specifically:");
  const indexes = await Requirement.collection.getIndexes({ full: true });
  const textIndex = indexes.find((i) => i.key && Object.values(i.key).includes("text"));
  console.log(textIndex ? "TEXT INDEX PRESENT: " + JSON.stringify(textIndex.key) : "STILL MISSING!");

  process.exit(0);
};

run().catch((error) => {
  console.error("Index sync failed:", error);
  process.exit(1);
});
