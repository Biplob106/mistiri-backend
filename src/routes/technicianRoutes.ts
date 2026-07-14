import { Router } from "express";
import {
  upsertProfile,
  getMyProfile,
  listTechnicians,
  getTechnicianById,
  matchTechnicians,
} from "../controllers/technicianController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// নিজের profile — শুধু technician role-এর user বানাতে/দেখতে পারবে
router.post("/", protect, authorize("technician"), upsertProfile);
router.get("/me", protect, authorize("technician"), getMyProfile);

// একটা repair-এর জন্য মিলিয়ে technician খোঁজা (customer ব্যবহার করে)
// নোট: এই route "/:id"-এর আগে থাকতে হবে, নাহলে "match" কে id ধরে নেবে
router.get("/match/:repairId", protect, matchTechnicians);

// list + filter — যেকোনো logged-in user দেখতে পারে
router.get("/", protect, listTechnicians);
router.get("/:id", protect, getTechnicianById);

export default router;
