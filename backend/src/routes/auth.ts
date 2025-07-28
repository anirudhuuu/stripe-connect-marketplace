import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.post("/login", authMiddleware, async (req: AuthRequest, res) => {
  const { uid, email, name } = req.user!;

  try {
    let user = await prisma.user.findUnique({
      where: { email: email! },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          email: email!,
          name: name || "",
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
