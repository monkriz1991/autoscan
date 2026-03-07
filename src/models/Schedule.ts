import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema(
  {
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialist",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String, // "09:00"
      required: true,
    },

    endTime: {
      type: String, // "18:00"
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

let Schedule: mongoose.Model<any>;

if (mongoose.models.Schedule) {
  Schedule = mongoose.models.Schedule;
} else {
  Schedule = mongoose.model("Schedule", ScheduleSchema);
}

export default Schedule;
