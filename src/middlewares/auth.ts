import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../prisma/db";

export const V_JW = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token not found",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    );

    // Ensure decoded is an object containing the expected _id
    if (typeof decoded === "string" || !decoded.id) {
      res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
      return;
    }

   const user = await db.orm.public.User.where({ email: decoded.email }).first();

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
