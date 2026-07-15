import { Response } from "express";
import { RepairRequest, IRepairRequest } from "../models/RepairRequest";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { Technician } from "../models/Technician";
import { AuthRequest } from "../middleware/auth";

// estimatedCost একটা string, যেমন "৳800 - ৳3000"। এখান থেকে ASCII সংখ্যাগুলো
// বের করে গড় (midpoint) হিসেব করি — একটা মাত্র সংখ্যা থাকলে সেটাই ফেরত দিই।
const parseCost = (cost?: string): number => {
  if (!cost) return 0;
  const numbers = (cost.match(/\d+/g) || []).map(Number);
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round(sum / numbers.length);
};

// createdAt থেকে "YYYY-MM" বানাই — মাস ধরে গ্রুপ করার জন্য
const monthKey = (date: Date): string => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
};

// একগুচ্ছ repair থেকে চার্টের জন্য দরকারি সব হিসেব একবারে বানিয়ে দিই।
// customer আর admin — দুই জায়গাতেই এই একই হিসেব লাগে, তাই আলাদা helper।
const buildRepairStats = (repairs: IRepairRequest[]) => {
  // status অনুযায়ী কয়টা
  const statusCounts: Record<string, number> = {};
  // category অনুযায়ী কয়টা
  const categoryMap: Record<string, number> = {};
  // মাস অনুযায়ী মোট আনুমানিক খরচ
  const monthlyMap: Record<string, number> = {};
  let totalEstimatedCost = 0;

  for (const repair of repairs) {
    statusCounts[repair.status] = (statusCounts[repair.status] || 0) + 1;
    categoryMap[repair.category] = (categoryMap[repair.category] || 0) + 1;

    const cost = parseCost(repair.estimatedCost);
    totalEstimatedCost += cost;

    const key = monthKey(repair.createdAt);
    monthlyMap[key] = (monthlyMap[key] || 0) + cost;
  }

  // চার্ট library সহজে পড়তে পারে এমন array-তে বদলাই
  const categoryDistribution = Object.entries(categoryMap).map(
    ([category, count]) => ({ category, count })
  );

  // মাসগুলো সময় অনুযায়ী সাজাই (পুরনো → নতুন)
  const monthlyCost = Object.entries(monthlyMap)
    .map(([month, cost]) => ({ month, cost }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalRepairs: repairs.length,
    statusCounts,
    categoryDistribution,
    monthlyCost,
    totalEstimatedCost,
  };
};

// customer নিজের dashboard-এর জন্য নিজের data-র সারাংশ পায়
export const getCustomerAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const repairs = await RepairRequest.find({ customer: req.user?.id });
    const stats = buildRepairStats(repairs);

    // নিজের booking সংখ্যা + শেষ হওয়া কাজ কয়টা
    const bookings = await Booking.find({ customer: req.user?.id });
    const completedJobs = bookings.filter(
      (b) => b.status === "completed"
    ).length;

    res.status(200).json({
      ...stats,
      totalBookings: bookings.length,
      completedJobs,
    });
  } catch (error) {
    console.error("Customer analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// admin পুরো platform-এর সারাংশ পায় (সব repair, সব user)
export const getAdminAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const repairs = await RepairRequest.find();
    const stats = buildRepairStats(repairs);

    // user-দের ভূমিকা অনুযায়ী গুনি
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalTechnicians = await User.countDocuments({ role: "technician" });
    const totalBookings = await Booking.countDocuments();
    // verify হওয়া technician profile কয়টা
    const verifiedTechnicians = await Technician.countDocuments({
      verified: true,
    });

    res.status(200).json({
      ...stats,
      totalUsers,
      totalCustomers,
      totalTechnicians,
      verifiedTechnicians,
      totalBookings,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
