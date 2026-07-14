import { Response } from "express";
import { Technician } from "../models/Technician";
import { RepairRequest } from "../models/RepairRequest";
import { AuthRequest } from "../middleware/auth";

// technician নিজের profile বানায় বা আপডেট করে।
// একটাই profile থাকে, তাই upsert — থাকলে update, না থাকলে নতুন তৈরি।
export const upsertProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { skills, serviceAreas, experience, bio, hourlyRate, available } =
      req.body;

    // skill আর এলাকা অন্তত একটা করে থাকা চাই — নাহলে matching অর্থহীন
    if (!skills?.length || !serviceAreas?.length) {
      res.status(400).json({
        message: "At least one skill and one service area are required",
      });
      return;
    }

    // skill/area গুলো ছোট হাতের করে trim করে রাখি — তাই search/matching
    // ধারাবাহিক হয় (schema-র lowercase array element-এ কাজ করে না, তাই এখানে করি)
    const normSkills = (skills as string[]).map((s) => s.trim().toLowerCase());
    const normAreas = (serviceAreas as string[]).map((a) =>
      a.trim().toLowerCase()
    );

    const profile = await Technician.findOneAndUpdate(
      { user: req.user?.id }, // token থেকে পাওয়া user-এর profile
      {
        user: req.user?.id,
        skills: normSkills,
        serviceAreas: normAreas,
        experience: experience ?? 0,
        bio,
        hourlyRate,
        // available না পাঠালে ধরে নিই কাজ নিচ্ছে
        available: available ?? true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Profile saved", technician: profile });
  } catch (error) {
    console.error("Upsert technician profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// logged-in technician নিজের profile দেখে
export const getMyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const profile = await Technician.findOne({ user: req.user?.id }).populate(
      "user",
      "name email phone"
    );

    if (!profile) {
      res.status(404).json({ message: "No profile yet" });
      return;
    }

    res.status(200).json({ technician: profile });
  } catch (error) {
    console.error("Get my technician profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// technician list — category ও area দিয়ে search/filter করা যায়।
// query: ?category=AC&area=mirpur&verified=true
export const listTechnicians = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { category, area, verified } = req.query;

    // ধাপে ধাপে mongo query বানাই — যেটা এসেছে শুধু সেটাই যোগ করি
    const query: Record<string, unknown> = {};

    if (category) {
      // skill lowercase-এ রাখা, তাই মিলিয়ে দেখি (partial match, case-insensitive)
      query.skills = { $regex: new RegExp(String(category), "i") };
    }
    if (area) {
      query.serviceAreas = { $regex: new RegExp(String(area), "i") };
    }
    if (verified === "true") {
      query.verified = true;
    }

    // verified আর বেশি rating-ওয়ালা technician আগে দেখাই
    const technicians = await Technician.find(query)
      .populate("user", "name email phone")
      .sort({ verified: -1, rating: -1, experience: -1 });

    res.status(200).json({ technicians });
  } catch (error) {
    console.error("List technicians error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// একজন নির্দিষ্ট technician-এর profile
export const getTechnicianById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const technician = await Technician.findById(req.params.id).populate(
      "user",
      "name email phone"
    );

    if (!technician) {
      res.status(404).json({ message: "Technician not found" });
      return;
    }

    res.status(200).json({ technician });
  } catch (error) {
    console.error("Get technician error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// একটা repair-এর জন্য উপযুক্ত technician খুঁজে দেয় —
// repair-এর category (skill) আর location (এলাকা) মিলিয়ে matching।
export const matchTechnicians = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const repair = await RepairRequest.findById(req.params.repairId);
    if (!repair) {
      res.status(404).json({ message: "Repair request not found" });
      return;
    }

    // ১. যারা এই category-তে কাজ করে আর এখন কাজ নিচ্ছে (available)
    const candidates = await Technician.find({
      skills: { $regex: new RegExp(repair.category, "i") },
      available: true,
    })
      .populate("user", "name email phone")
      .sort({ verified: -1, rating: -1, experience: -1 });

    // ২. এলাকা মেলানো — repair.location একটা free-text (যেমন "Mirpur, Dhaka"),
    // তাই technician-এর কোনো serviceArea ওই লেখার মধ্যে আছে কিনা দেখি।
    const location = repair.location.toLowerCase();
    const matched = candidates.filter((tech) =>
      tech.serviceAreas.some((area) => location.includes(area.toLowerCase()))
    );

    // এলাকা মিললে সেগুলো আগে; না মিললেও category-ম্যাচ candidate ফেরত দিই
    // (fallback), যাতে customer অন্তত কিছু option পায়।
    res.status(200).json({
      technicians: matched.length ? matched : candidates,
      areaMatched: matched.length > 0,
    });
  } catch (error) {
    console.error("Match technicians error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
