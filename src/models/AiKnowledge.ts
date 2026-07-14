import mongoose, { Schema, Document } from "mongoose";

// knowledge base-এর একটা entry দেখতে কেমন — একেকটা common সমস্যা
export interface IAiKnowledge extends Document {
  category: string; // যেমন: "AC", "Plumbing", "Electrical"
  title: string; // সমস্যার সংক্ষিপ্ত নাম (দেখানোর জন্য)
  keywords: string[]; // user-এর লেখায় এগুলো মিললে এই entry ম্যাচ করে
  possibleCauses: string[]; // সম্ভাব্য কারণগুলো
  solution: string; // পরামর্শ / সমাধান
  estimatedCost: string; // আনুমানিক খরচ (range হিসেবে string, model-এর সাথে মিল)
}

const aiKnowledgeSchema = new Schema<IAiKnowledge>(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    // keyword গুলো ছোট হাতের অক্ষরে রাখি, যাতে matching সহজ হয়
    keywords: { type: [String], required: true, lowercase: true },
    possibleCauses: { type: [String], default: [] },
    solution: { type: String, required: true },
    estimatedCost: { type: String, required: true },
  },
  { timestamps: true }
);

export const AiKnowledge = mongoose.model<IAiKnowledge>(
  "AiKnowledge",
  aiKnowledgeSchema
);
