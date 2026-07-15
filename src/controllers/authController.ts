import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";

// Google ID token যাচাইয়ের client — audience হিসেবে আমাদের client id
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // ১. email আর password এসেছে কিনা
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // ২. এই email-এর user আছে কিনা খুঁজি
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // ৩. password মেলে কিনা যাচাই করি
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // ৪. token বানাই — ভিতরে user-এর id আর role রাখি
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // ৫. token আর user তথ্য ফেরত দিই (password ছাড়া)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Google Sign-In — frontend থেকে আসা credential (ID token) যাচাই করে।
// প্রথমবার হলে নতুন customer বানাই, তারপর আমাদের নিজের JWT ফেরত দিই।
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ message: "Google credential missing" });
      return;
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(500).json({ message: "Google login not configured" });
      return;
    }

    // Google-এর সাথে token যাচাই — audience আমাদের client id হতে হবে
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(401).json({ message: "Invalid Google token" });
      return;
    }

    // আগে থাকলে সেই user, নাহলে নতুন customer (random password — password login হবে না)
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(24).toString("hex"),
        10
      );
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        password: randomPassword,
        role: "customer",
      });
    }

    // নিজের JWT — login-এর মতোই একই shape
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: "Google login failed" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};