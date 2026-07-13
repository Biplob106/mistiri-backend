import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // ১. দরকারি field আছে কিনা দেখি
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    // ২. এই email দিয়ে আগে কেউ register করেছে কিনা
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // ৩. password hash করি (কখনো plain text save করি না)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ৪. user তৈরি করি
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    // ৫. response-এ password পাঠাই না
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};