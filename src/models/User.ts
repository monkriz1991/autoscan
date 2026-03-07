import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["SUPERADMIN", "BUSINESS_OWNER", "STAFF"],
      default: "BUSINESS_OWNER",
      required: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },
  },
  { timestamps: true },
);

let User: mongoose.Model<any>;

if (mongoose.models.User) {
  User = mongoose.models.User;
} else {
  User = mongoose.model("User", UserSchema);
}

export default User;
