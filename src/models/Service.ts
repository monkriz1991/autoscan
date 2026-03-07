// models/Service.ts

import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    default: null,
  },

  level: { type: Number, required: true }, // 1-5
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
  ],
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
});

let Service: mongoose.Model<any>;

if (mongoose.models.Service) {
  Service = mongoose.models.Service;
} else {
  Service = mongoose.model("Service", ServiceSchema);
}

export default Service;
