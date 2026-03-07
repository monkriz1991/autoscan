// models/Specialist.ts
import mongoose from "mongoose";
import "./Service";

const SpecialistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
  },
  { timestamps: true },
);

let Specialist: mongoose.Model<any>;

if (mongoose.models.Specialist) {
  Specialist = mongoose.models.Specialist;
} else {
  Specialist = mongoose.model("Specialist", SpecialistSchema);
}

export default Specialist;
