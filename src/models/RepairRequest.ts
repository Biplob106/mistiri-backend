import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRepairRequest extends Document {
  customer: Types.ObjectId;
  title: string;
  category: string;
  description: string;
  image?: string;
  location: string;
  priority: "low" | "medium" | "high";
  diagnosis?: string;
  estimatedCost?: string;
  status:
    | "pending"
    | "diagnosed"
    | "assigned"
    | "in_progress"
    | "completed"
    | "reviewed";
  technician?: Types.ObjectId;
  createdAt: Date;
}

const repairRequestSchema = new Schema<IRepairRequest>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    location: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    diagnosis: { type: String },
    estimatedCost: { type: String },
    status: {
      type: String,
      enum: [
        "pending",
        "diagnosed",
        "assigned",
        "in_progress",
        "completed",
        "reviewed",
      ],
      default: "pending",
    },
    technician: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const RepairRequest = mongoose.model<IRepairRequest>(
  "RepairRequest",
  repairRequestSchema
);