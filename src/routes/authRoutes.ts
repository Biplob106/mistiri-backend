import { Router } from "express";
import { register, login, googleLogin, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";


const router = Router();

router.post("/register", register);
router.post("/login", login);   // ← নতুন
router.post("/google", googleLogin); // Google Sign-In
router.get("/me", protect, getMe);

export default router;