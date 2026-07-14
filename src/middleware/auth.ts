import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// TypeScript-কে বলে দিচ্ছি req-এ আমরা একটা user যোগ করব
export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// ১. token যাচাই করে — logged in কিনা
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // token সাধারণত এভাবে আসে: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authorized, no token" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // token-এর সিল যাচাই করি
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };

    // যাচাই সফল — req-এ user বসিয়ে দিই, যাতে পরের controller ব্যবহার করতে পারে
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ২. role যাচাই করে — এই কাজের অনুমতি আছে কিনা
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: insufficient permission" });
      return;
    }
    next();
  };
};