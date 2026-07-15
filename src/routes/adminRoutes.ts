import { Router } from "express";
import {
  getAllUsers,
  deleteUser,
  getAllTechnicians,
  setTechnicianVerified,
} from "../controllers/adminController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// সব route শুধু admin-এর জন্য
router.use(protect, authorize("admin"));

// user ব্যবস্থাপনা
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// technician verify ব্যবস্থাপনা
router.get("/technicians", getAllTechnicians);
router.patch("/technicians/:id/verify", setTechnicianVerified);

export default router;
