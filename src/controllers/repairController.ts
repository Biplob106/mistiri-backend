import { Response } from "express";
import { RepairRequest } from "../models/RepairRequest";
import { AuthRequest } from "../middleware/auth";

// customer একটা নতুন repair request তৈরি করে
export const createRepair = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, category, description, location, priority } = req.body;

    if (!title || !category || !description || !location) {
      res.status(400).json({
        message: "Title, category, description and location are required",
      });
      return;
    }

    const repair = await RepairRequest.create({
      customer: req.user?.id, // token থেকে পাওয়া user-এর id
      title,
      category,
      description,
      location,
      priority: priority || "medium",
    });

    res.status(201).json({
      message: "Repair request created",
      repair,
    });
  } catch (error) {
    console.error("Create repair error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// logged-in customer শুধু নিজের request গুলো দেখে
export const getMyRepairs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const repairs = await RepairRequest.find({ customer: req.user?.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ repairs });
  } catch (error) {
    console.error("Get repairs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};