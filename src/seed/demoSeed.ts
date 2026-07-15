import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { Technician } from "../models/Technician";

dotenv.config();

// assignment demo-র জন্য পরিচিত account গুলো (submission-এ যেগুলো credentials দেওয়া হবে)
const DEMO_USERS = [
  {
    name: "Demo Customer",
    email: "customer@mistiri.app",
    password: "Demo@1234",
    role: "customer" as const,
  },
  {
    name: "Demo Admin",
    email: "admin@mistiri.app",
    password: "Admin@1234",
    role: "admin" as const,
  },
];

// Explore/listing পেজ যাতে খালি না থাকে — কয়েকজন technician প্রোফাইলসহ
const DEMO_TECHNICIANS = [
  {
    name: "Rahim Uddin",
    email: "rahim.tech@mistiri.app",
    skills: ["AC", "Appliance"],
    serviceAreas: ["Mirpur", "Pallabi"],
    experience: 6,
    hourlyRate: 600,
    verified: true,
    rating: 4.7,
    totalReviews: 23,
    bio: "৬ বছর ধরে AC ও ঘরোয়া appliance সারাই করছি। দ্রুত ও পরিচ্ছন্ন কাজে বিশ্বাসী।",
  },
  {
    name: "Karim Sheikh",
    email: "karim.tech@mistiri.app",
    skills: ["Plumbing"],
    serviceAreas: ["Dhanmondi", "Mohammadpur"],
    experience: 4,
    hourlyRate: 500,
    verified: true,
    rating: 4.5,
    totalReviews: 15,
    bio: "কল, পাইপ ও বাথরুম ফিটিংয়ে অভিজ্ঞ। লিক শনাক্ত করে স্থায়ী সমাধান দিই।",
  },
  {
    name: "Jamal Hossain",
    email: "jamal.tech@mistiri.app",
    skills: ["Electrical"],
    serviceAreas: ["Uttara", "Airport"],
    experience: 8,
    hourlyRate: 700,
    verified: true,
    rating: 4.8,
    totalReviews: 31,
    bio: "৮ বছরের ইলেকট্রিক্যাল অভিজ্ঞতা — ওয়্যারিং, লোড ও সেফটি নিশ্চিত করে কাজ করি।",
  },
  {
    name: "Sohel Rana",
    email: "sohel.tech@mistiri.app",
    skills: ["AC", "Electrical"],
    serviceAreas: ["Gulshan", "Banani"],
    experience: 5,
    hourlyRate: 800,
    verified: true,
    rating: 4.6,
    totalReviews: 19,
    bio: "AC servicing ও electrical দুটোতেই কাজ করি। সময়মতো পৌঁছানো আমার অঙ্গীকার।",
  },
  {
    name: "Nasir Ahmed",
    email: "nasir.tech@mistiri.app",
    skills: ["Appliance", "Plumbing"],
    serviceAreas: ["Mirpur", "Kazipara"],
    experience: 3,
    hourlyRate: 450,
    verified: false,
    rating: 4.2,
    totalReviews: 7,
    bio: "ফ্রিজ, ওয়াশিং মেশিন ও সাধারণ plumbing সমস্যায় সাশ্রয়ী সমাধান দিই।",
  },
  {
    name: "Babul Mia",
    email: "babul.tech@mistiri.app",
    skills: ["Electrical", "AC"],
    serviceAreas: ["Badda", "Rampura"],
    experience: 7,
    hourlyRate: 650,
    verified: true,
    rating: 4.4,
    totalReviews: 12,
    bio: "৭ বছরের অভিজ্ঞতা। ছোট-বড় সব ইলেকট্রিক্যাল কাজ যত্ন নিয়ে করি।",
  },
];

// email দিয়ে user upsert করি (আগে থাকলে update, নাহলে নতুন) — বারবার চালালেও নিরাপদ
async function upsertUser(
  name: string,
  email: string,
  password: string,
  role: "customer" | "technician" | "admin"
) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email },
    { name, email, password: hashed, role },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return user;
}

async function run() {
  await connectDB();

  // ১. demo customer ও admin
  for (const u of DEMO_USERS) {
    await upsertUser(u.name, u.email, u.password, u.role);
    console.log(`✓ ${u.role}: ${u.email}`);
  }

  // ২. demo technician + প্রোফাইল
  for (const t of DEMO_TECHNICIANS) {
    const user = await upsertUser(t.name, t.email, "Tech@1234", "technician");
    await Technician.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        // schema নিজেই lowercase করে, তবু স্পষ্টতার জন্য এখানে দিই
        skills: t.skills.map((s) => s.toLowerCase()),
        serviceAreas: t.serviceAreas.map((a) => a.toLowerCase()),
        experience: t.experience,
        hourlyRate: t.hourlyRate,
        available: true,
        verified: t.verified,
        rating: t.rating,
        totalReviews: t.totalReviews,
        bio: t.bio,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`✓ technician: ${t.name}`);
  }

  console.log("\n✅ Demo data seeded.");
  console.log("Customer → customer@mistiri.app / Demo@1234");
  console.log("Admin    → admin@mistiri.app / Admin@1234");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
