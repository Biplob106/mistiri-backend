import { Response } from "express";
import { Booking } from "../models/Booking";
import { RepairRequest } from "../models/RepairRequest";
import { Technician } from "../models/Technician";
import { AuthRequest } from "../middleware/auth";

// customer একটা repair-এর জন্য technician-কে book করে।
// body: { repairId, technicianId } — technicianId হলো technician-এর User id।
export const createBooking = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { repairId, technicianId, scheduledDate } = req.body;

    if (!repairId || !technicianId) {
      res
        .status(400)
        .json({ message: "repairId and technicianId are required" });
      return;
    }

    // repair আছে কিনা আর এটা এই customer-এর কিনা
    const repair = await RepairRequest.findById(repairId);
    if (!repair) {
      res.status(404).json({ message: "Repair request not found" });
      return;
    }
    if (repair.customer.toString() !== req.user?.id) {
      res.status(403).json({ message: "Not your repair request" });
      return;
    }

    // technician-এর profile আছে কিনা যাচাই করি
    const techProfile = await Technician.findOne({ user: technicianId });
    if (!techProfile) {
      res.status(404).json({ message: "Technician not found" });
      return;
    }

    // এই repair-এর জন্য আগে থেকে booking থাকলে আবার দেওয়া যাবে না
    const existing = await Booking.findOne({ repair: repairId });
    if (existing) {
      res
        .status(409)
        .json({ message: "This repair already has a booking" });
      return;
    }

    const booking = await Booking.create({
      repair: repairId,
      customer: req.user?.id,
      technician: technicianId,
      scheduledDate,
    });

    // repair-এ technician বসিয়ে status "assigned"-এ নিয়ে যাই
    repair.technician = technicianId;
    repair.status = "assigned";
    await repair.save();

    res.status(201).json({ message: "Technician booked", booking });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// customer নিজের সব booking দেখে
export const getMyBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const bookings = await Booking.find({ customer: req.user?.id })
      .populate("repair", "title category location status")
      .populate("technician", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// technician তার কাছে আসা কাজগুলো দেখে
export const getAssignedBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const bookings = await Booking.find({ technician: req.user?.id })
      .populate("repair", "title category location status description")
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get assigned bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// কোন status থেকে কোথায় যাওয়া যায় — technician কাজ এগিয়ে নেয়
const nextAllowed: Record<string, string[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed"],
};

// booking-এর status বদলায় technician (accept → start → complete)
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // শুধু যে technician-কে দেওয়া হয়েছে সে-ই বদলাতে পারবে
    if (booking.technician.toString() !== req.user?.id) {
      res.status(403).json({ message: "Not your booking" });
      return;
    }

    // এই ধাপ থেকে চাওয়া status-এ যাওয়া বৈধ কিনা
    const allowed = nextAllowed[booking.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({
        message: `Cannot change status from ${booking.status} to ${status}`,
      });
      return;
    }

    booking.status = status;
    await booking.save();

    // repair-এর status-ও মিলিয়ে আপডেট করি
    const repairStatusMap: Record<string, string> = {
      in_progress: "in_progress",
      completed: "completed",
    };
    if (repairStatusMap[status]) {
      await RepairRequest.findByIdAndUpdate(booking.repair, {
        status: repairStatusMap[status],
      });
    }

    res.status(200).json({ message: "Booking updated", booking });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// কাজ শেষ হলে customer rating + comment দেয়।
// এখানেই technician-এর গড় rating নতুন করে হিসেব হয়।
export const addReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    // শুধু নিজের booking-এ review দেওয়া যাবে
    if (booking.customer.toString() !== req.user?.id) {
      res.status(403).json({ message: "Not your booking" });
      return;
    }
    // কাজ শেষ না হলে review দেওয়া যাবে না
    if (booking.status !== "completed") {
      res
        .status(400)
        .json({ message: "You can only review a completed job" });
      return;
    }
    // একবারই review দেওয়া যাবে
    if (booking.review) {
      res.status(409).json({ message: "Review already submitted" });
      return;
    }

    booking.review = { rating, comment, createdAt: new Date() };
    await booking.save();

    // repair-কে "reviewed" ধাপে নিয়ে যাই (status flow-এর শেষ ধাপ)
    await RepairRequest.findByIdAndUpdate(booking.repair, {
      status: "reviewed",
    });

    // technician-এর গড় rating নতুন করে হিসেব করি —
    // পুরনো গড় × সংখ্যা + নতুন rating, তারপর মোট সংখ্যা দিয়ে ভাগ
    const tech = await Technician.findOne({ user: booking.technician });
    if (tech) {
      const newTotal = tech.totalReviews + 1;
      const newAvg =
        (tech.rating * tech.totalReviews + rating) / newTotal;
      tech.rating = Math.round(newAvg * 10) / 10; // এক দশমিক পর্যন্ত
      tech.totalReviews = newTotal;
      await tech.save();
    }

    res.status(200).json({ message: "Review submitted", booking });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
