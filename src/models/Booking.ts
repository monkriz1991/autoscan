// models/Booking.ts

import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialist",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    customerName: String,
    customerPhone: String,

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

let Booking: mongoose.Model<any>;

if (mongoose.models.Booking) {
  Booking = mongoose.models.Booking;
} else {
  Booking = mongoose.model("Booking", BookingSchema);
}

export default Booking;
