import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { signToken } from "../config/jwt.js";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, dashes and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required").max(50),
});

authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { username, email, password, displayName } = parse.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        res.status(409).json({ error: "Username is already taken." });
        return;
      }
      res.status(409).json({ error: "Email is already registered." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        displayName,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, username: user.username });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { usernameOrEmail, password } = parse.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase() },
          { email: usernameOrEmail.toLowerCase() },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const token = signToken({ userId: user.id, username: user.username });
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        location: user.location,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
