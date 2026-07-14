import { Router } from "express";
import { createRepair, getMyRepairs, getRepairById } from "../controllers/repairController";
import { protect } from "../middleware/auth";
import { upload } from "../config/cloudinary";

const router = Router();

// protect (login যাচাই) → upload.single("image") (ছবি Cloudinary-তে পাঠায়) → createRepair
router.post("/", protect, upload.single("image"), createRepair);
router.get("/my", protect, getMyRepairs);
router.get("/:id", protect, getRepairById);

export default router;