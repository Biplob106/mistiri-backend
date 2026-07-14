import mongoose, { Schema, Document, Types } from "mongoose";

// একজন technician-এর profile দেখতে কেমন। এটা User-এর সাথে যুক্ত —
// User-এ থাকে login তথ্য (name/email/role), আর এখানে থাকে কাজের তথ্য।
export interface ITechnician extends Document {
  user: Types.ObjectId; // কোন User-এর profile (role অবশ্যই "technician")
  skills: string[]; // কোন category-তে কাজ করে (যেমন: AC, Plumbing)
  serviceAreas: string[]; // কোন কোন এলাকায় কাজ করে (যেমন: Mirpur, Dhanmondi)
  experience: number; // কত বছরের অভিজ্ঞতা
  bio?: string; // নিজের সম্পর্কে ছোট বর্ণনা
  hourlyRate?: number; // ঘণ্টাপ্রতি আনুমানিক রেট (৳)
  available: boolean; // এখন নতুন কাজ নিচ্ছে কিনা
  verified: boolean; // admin যাচাই করেছে কিনা
  rating: number; // review থেকে গড় rating (Phase 5-এ update হবে)
  totalReviews: number; // মোট কতটা review পেয়েছে
  createdAt: Date;
}

const technicianSchema = new Schema<ITechnician>(
  {
    // একজন User-এর একটাই technician profile — তাই unique
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // skill/area গুলো ছোট হাতের রাখি, যাতে search/matching সহজ হয়
    skills: { type: [String], required: true, lowercase: true },
    serviceAreas: { type: [String], required: true, lowercase: true },
    experience: { type: Number, default: 0 },
    bio: { type: String },
    hourlyRate: { type: Number },
    available: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    // rating শুরুতে 0, review এলে গড় হিসেব করে বসবে
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Technician = mongoose.model<ITechnician>(
  "Technician",
  technicianSchema
);
