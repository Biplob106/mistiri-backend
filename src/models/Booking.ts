import mongoose, { Schema, Document, Types } from "mongoose";

// একটা booking-এর ভেতরে review কেমন — কাজ শেষ হলে customer দেয়
export interface IReview {
  rating: number; // ১ থেকে ৫
  comment?: string;
  createdAt: Date;
}

// একটা booking = কোন repair-এর জন্য কোন technician-কে customer ডেকেছে,
// আর সেই কাজ কোন অবস্থায় আছে।
export interface IBooking extends Document {
  repair: Types.ObjectId; // কোন repair request
  customer: Types.ObjectId; // কে ডেকেছে
  technician: Types.ObjectId; // কোন technician (User id)
  status: "requested" | "accepted" | "in_progress" | "completed" | "cancelled";
  scheduledDate?: Date; // কবে আসবে (optional)
  review?: IReview; // কাজ শেষ হলে customer-এর review
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    // একটা repair-এর একটাই সক্রিয় booking — তাই unique
    repair: {
      type: Schema.Types.ObjectId,
      ref: "RepairRequest",
      required: true,
      unique: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    technician: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["requested", "accepted", "in_progress", "completed", "cancelled"],
      default: "requested",
    },
    scheduledDate: { type: Date },
    review: { type: reviewSchema },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
