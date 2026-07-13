import mongoose, { Schema, Document } from "mongoose";

// TypeScript-কে বলে দিচ্ছি একটা User দেখতে কেমন
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "customer" | "technician" | "admin";
  phone?: string;
  address?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "technician", "admin"],
      default: "customer",
    },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);