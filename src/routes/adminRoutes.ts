import { Router } from "express";
import {
  getAllUsers,
  deleteUser,
  getAllTechnicians,
  setTechnicianVerified,
  getAllBookings,
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

// সব booking দেখা
router.get("/bookings", getAllBookings);

export default router;
