import { Response } from "express";
import { User } from "../models/User";
import { Technician } from "../models/Technician";
import { Booking } from "../models/Booking";
import { AuthRequest } from "../middleware/auth";

// admin সব user দেখে (password ছাড়া), নতুন আগে
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// admin একজন user মুছে দেয়। নিজেকে মোছা যাবে না।
// technician হলে তার profile-ও একসাথে মুছি।
export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // technician হলে তার profile-ও পরিষ্কার করি
    if (user.role === "technician") {
      await Technician.deleteOne({ user: user._id });
    }

    await user.deleteOne();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// admin সব technician profile দেখে (verify ব্যবস্থাপনার জন্য)
export const getAllTechnicians = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const technicians = await Technician.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ technicians });
  } catch (error) {
    console.error("Get all technicians error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// admin পুরো platform-এর সব booking দেখে (repair/customer/technician সহ)
export const getAllBookings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const bookings = await Booking.find()
      .populate("repair", "title category location status")
      .populate("customer", "name email")
      .populate("technician", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// admin একজন technician-কে verify/unverify করে (body.verified)
export const setTechnicianVerified = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { verified } = req.body;
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { verified: !!verified },
      { new: true }
    ).populate("user", "name email");

    if (!technician) {
      res.status(404).json({ message: "Technician not found" });
      return;
    }

    res.status(200).json({ message: "Updated", technician });
  } catch (error) {
    console.error("Verify technician error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
