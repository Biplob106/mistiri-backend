import { Router } from "express";
import {
  getCustomerAnalytics,
  getAdminAnalytics,
} from "../controllers/analyticsController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// customer নিজের data-র সারাংশ দেখে (dashboard-এর জন্য)
router.get("/me", protect, authorize("customer"), getCustomerAnalytics);

// admin পুরো platform-এর সারাংশ দেখে
router.get("/admin", protect, authorize("admin"), getAdminAnalytics);

export default router;
