import { Response } from "express";
import { RepairRequest, IRepairRequest } from "../models/RepairRequest";
import { AuthRequest } from "../middleware/auth";
import { diagnose } from "../services/diagnosisService";

// customer একটা নতুন repair request তৈরি করে
export const createRepair = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // multipart/form-data-এ text field গুলো req.body-তেই আসে
    const { title, category, description, location, priority } = req.body;

    if (!title || !category || !description || !location) {
      res.status(400).json({
        message: "Title, category, description and location are required",
      });
      return;
    }

    // rule-based diagnosis চালাই — title + description থেকে keyword মিলিয়ে
    // knowledge base থেকে সম্ভাব্য কারণ, সমাধান ও খরচ বের করে
    const result = await diagnose(`${title} ${description}`);

    // ম্যাচ পেলে সম্ভাব্য কারণ + সমাধান একসাথে একটা পড়ার মতো text বানাই
    // (RepairRequest model-এ diagnosis একটা string field)
    let diagnosis: string | undefined;
    let estimatedCost: string | undefined;
    let status: IRepairRequest["status"] = "pending";

    if (result) {
      const causes = result.possibleCauses.map((c) => `• ${c}`).join("\n");
      diagnosis = `${result.title}\n\nসম্ভাব্য কারণ:\n${causes}\n\nসমাধান: ${result.solution}`;
      estimatedCost = result.estimatedCost;
      status = "diagnosed"; // ম্যাচ পেলে status এক ধাপ এগিয়ে দিই
    }

    const repair = await RepairRequest.create({
      customer: req.user?.id, // token থেকে পাওয়া user-এর id
      title,
      category,
      description,
      location,
      priority: priority || "medium",
      // ছবি upload হলে multer req.file বসায়; req.file.path = Cloudinary-র URL।
      // ছবি না দিলে undefined থাকে, তাই image field খালিই থাকে।
      image: req.file?.path,
      // auto-diagnosis-এর ফলাফল (ম্যাচ না পেলে undefined থাকে, field খালি)
      diagnosis,
      estimatedCost,
      status,
    });

    res.status(201).json({
      message: "Repair request created",
      repair,
    });
  } catch (error) {
    console.error("Create repair error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// logged-in customer শুধু নিজের request গুলো দেখে
export const getMyRepairs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const repairs = await RepairRequest.find({ customer: req.user?.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ repairs });
  } catch (error) {
    console.error("Get repairs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// একটা নির্দিষ্ট repair request দেখা (শুধু নিজের টা)
export const getRepairById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const repair = await RepairRequest.findById(req.params.id).populate(
      "customer",
      "name email"
    );

    if (!repair) {
      res.status(404).json({ message: "Repair request not found" });
      return;
    }

    // ownership check — এই request কি সত্যিই এই user-এর?
    if (repair.customer._id.toString() !== req.user?.id) {
      res.status(403).json({ message: "Not authorized to view this request" });
      return;
    }

    res.status(200).json({ repair });
  } catch (error) {
    console.error("Get repair error:", error);
    res.status(500).json({ message: "Server error" });
  }
};