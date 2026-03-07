import mongoose from "mongoose";
import "@/models/registerModels";

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(process.env.MONGODB_URI as string);
};
