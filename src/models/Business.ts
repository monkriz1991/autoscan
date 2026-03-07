// src/models/Business.ts
import mongoose, { Schema, model, models } from "mongoose";

const BusinessSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    widgetKey: { type: String, unique: true },
    themeColor: { type: String, default: "#000000" },
  },
  { timestamps: true },
);

let Business: mongoose.Model<any>;

if (mongoose.models.Business) {
  Business = mongoose.models.Business;
} else {
  Business = mongoose.model("Business", BusinessSchema);
}

export default Business;
