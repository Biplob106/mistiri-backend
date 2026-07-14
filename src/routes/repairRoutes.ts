import { Router } from "express";
import { createRepair, getMyRepairs } from "../controllers/repairController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, createRepair);
router.get("/my", protect, getMyRepairs);

export default router;