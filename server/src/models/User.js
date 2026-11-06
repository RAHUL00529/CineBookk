// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//       maxlength: 254,
//     },
//     name: { type: String, trim: true, maxlength: 80 },
//   },
//   { timestamps: { createdAt: true, updatedAt: false } },
// );

// export const User = mongoose.model("User", userSchema);

//////////////////////////////////////////////////////
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, trim: true },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
