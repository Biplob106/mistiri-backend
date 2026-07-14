import { Router } from "express";
import { createRepair, getMyRepairs, getRepairById } from "../controllers/repairController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, createRepair);
router.get("/my", protect, getMyRepairs);
router.get("/:id", protect, getRepairById);

export default router;