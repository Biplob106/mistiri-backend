import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { AiKnowledge } from "../models/AiKnowledge";

dotenv.config();

// knowledge base-এর প্রাথমিক তথ্য — common ঘরোয়া সমস্যা।
// keyword গুলো ছোট হাতের, কারণ matching-এর সময় আমরা lowercase-এ মেলাব।
const knowledge = [
  {
    category: "AC",
    title: "AC ঠান্ডা করছে না",
    keywords: ["ac", "air condition", "cooling", "ঠান্ডা", "গরম", "not cooling", "gas"],
    possibleCauses: [
      "গ্যাস (refrigerant) কমে গেছে বা leak হয়েছে",
      "নোংরা filter বা coil বাতাস আটকাচ্ছে",
      "compressor বা capacitor দুর্বল",
    ],
    solution: "Filter পরিষ্কার করে গ্যাস চেক করান; leak থাকলে সারিয়ে refill করাতে হবে।",
    estimatedCost: "৳800 - ৳3000",
  },
  {
    category: "AC",
    title: "AC থেকে পানি পড়ছে",
    keywords: ["ac", "leak", "পানি", "water", "drip", "ফোঁটা", "drain"],
    possibleCauses: [
      "drain pipe বন্ধ হয়ে গেছে",
      "installation-এ সামান্য বাঁকা হয়ে বসানো",
      "coil-এ বরফ জমে গলে পড়ছে",
    ],
    solution: "Drain pipe পরিষ্কার করুন এবং indoor unit সঠিক angle-এ বসানো আছে কিনা দেখুন।",
    estimatedCost: "৳500 - ৳1500",
  },
  {
    category: "Plumbing",
    title: "কল / ট্যাপ থেকে পানি লিক করছে",
    keywords: ["tap", "কল", "leak", "লিক", "পানি", "water", "faucet", "drip", "ফোঁটা"],
    possibleCauses: [
      "ভেতরের washer বা rubber ক্ষয়ে গেছে",
      "cartridge বা valve নষ্ট",
      "সংযোগ ঢিলা হয়ে গেছে",
    ],
    solution: "Washer বা cartridge বদলে দিলে সাধারণত লিক বন্ধ হয়।",
    estimatedCost: "৳300 - ৳1200",
  },
  {
    category: "Plumbing",
    title: "পাইপ / বেসিন বন্ধ (clogged)",
    keywords: ["pipe", "পাইপ", "clog", "block", "বন্ধ", "drain", "basin", "বেসিন", "commode", "টয়লেট"],
    possibleCauses: [
      "ময়লা, চুল বা তেল জমে পাইপ আটকে গেছে",
      "পুরনো পাইপে scale জমেছে",
    ],
    solution: "Drain cleaning বা pressure দিয়ে পরিষ্কার করাতে হবে; দরকারে অংশ বদলাতে হয়।",
    estimatedCost: "৳500 - ৳2000",
  },
  {
    category: "Electrical",
    title: "লাইট বারবার নিভছে / জ্বলছে (flicker)",
    keywords: ["light", "লাইট", "flicker", "নিভছে", "বাতি", "bulb", "blink", "মিটমিট"],
    possibleCauses: [
      "সংযোগ ঢিলা হয়ে গেছে",
      "bulb বা holder নষ্ট",
      "voltage ওঠানামা করছে",
    ],
    solution: "সংযোগ শক্ত করুন, প্রয়োজনে holder/bulb বদলান; সমস্যা থাকলে wiring চেক করান।",
    estimatedCost: "৳200 - ৳1000",
  },
  {
    category: "Electrical",
    title: "ঘন ঘন circuit breaker পড়ে যাচ্ছে",
    keywords: ["breaker", "circuit", "short", "শর্ট", "current", "কারেন্ট", "trip", "fuse", "spark", "স্পার্ক"],
    possibleCauses: [
      "কোথাও short circuit বা overload হচ্ছে",
      "খারাপ wiring বা নষ্ট appliance",
    ],
    solution: "কোন line-এ সমস্যা তা খুঁজে wiring/appliance ঠিক করাতে হবে — নিজে না করাই ভালো।",
    estimatedCost: "৳500 - ৳2500",
  },
  {
    category: "Appliance",
    title: "ফ্রিজ ঠান্ডা হচ্ছে না",
    keywords: ["fridge", "ফ্রিজ", "refrigerator", "ঠান্ডা", "cooling", "freezer", "gas"],
    possibleCauses: [
      "গ্যাস leak বা কমে গেছে",
      "thermostat বা compressor দুর্বল",
      "door gasket ঢিলা, ঠান্ডা বেরিয়ে যাচ্ছে",
    ],
    solution: "গ্যাস ও thermostat চেক করান; gasket ঢিলা হলে বদলান।",
    estimatedCost: "৳1000 - ৳4000",
  },
];

// script: DB-তে যুক্ত হয়ে পুরনো data মুছে নতুন seed বসায়, তারপর বেরিয়ে যায়
const seed = async (): Promise<void> => {
  try {
    await connectDB();
    await AiKnowledge.deleteMany({}); // আগের entry থাকলে মুছে ফেলি (fresh seed)
    await AiKnowledge.insertMany(knowledge);
    console.log(`Seeded ${knowledge.length} knowledge entries`);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
