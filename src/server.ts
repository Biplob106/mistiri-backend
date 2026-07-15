import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";   // ← নতুন
import repairRoutes from "./routes/repairRoutes";
import technicianRoutes from "./routes/technicianRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Mistiri API is running" });
});

app.use("/api/auth", authRoutes);   // ← নতুন
app.use("/api/repairs", repairRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));