import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getAssignedBookings,
  updateBookingStatus,
  addReview,
} from "../controllers/bookingController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// customer একটা technician book করে + নিজের booking দেখে + review দেয়
router.post("/", protect, authorize("customer"), createBooking);
router.get("/my", protect, authorize("customer"), getMyBookings);
router.post("/:id/review", protect, authorize("customer"), addReview);

// technician তার কাজগুলো দেখে + status এগিয়ে নেয়
router.get("/assigned", protect, authorize("technician"), getAssignedBookings);
router.patch(
  "/:id/status",
  protect,
  authorize("technician"),
  updateBookingStatus
);

export default router;
