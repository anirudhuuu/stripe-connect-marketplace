import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
};
