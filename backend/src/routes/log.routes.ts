import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, optionalAuth, AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const logRouter = Router();

const createLogSchema = z.object({
  cheeseId: z.string().uuid("Invalid cheese ID"),
  rating: z
    .number()
    .min(0.0, "Rating cannot be less than 0")
    .max(5.0, "Rating cannot exceed 5 stars")
    .refine((val) => Math.round(val * 2) === val * 2, {
      message: "Rating must be in 0.5 increments (e.g. 3.0, 3.5, 4.0)",
    }),
  isLiked: z.boolean().optional().default(false),
  isFirstTaste: z.boolean().optional().default(true),
  reviewText: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  consumedAt: z.string().optional(), // ISO date or YYYY-MM-DD
});

// 1. POST /api/logs - Log a Cheese (Letterboxd Style)
logRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parse = createLogSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { cheeseId, rating, isLiked, isFirstTaste, reviewText, photoUrl, consumedAt } = parse.data;

    const cheese = await prisma.cheese.findUnique({
      where: { id: cheeseId },
    });

    if (!cheese) {
      res.status(404).json({ error: "Cheese not found." });
      return;
    }

    const parsedDate = consumedAt ? new Date(consumedAt) : new Date();

    const log = await prisma.cheeseLog.create({
      data: {
        userId: req.user!.userId,
        cheeseId,
        rating,
        isLiked,
        isFirstTaste,
        reviewText: reviewText?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        consumedAt: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      },
      include: {
        cheese: {
          include: { type: true },
        },
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({ log });
  } catch (error) {
    console.error("Error creating log:", error);
    res.status(500).json({ error: "Failed to create cheese log." });
  }
});

// 2. GET /api/logs - Activity Feed / User Diary / Cheese Logs
logRouter.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const username = typeof req.query.username === "string" ? req.query.username.toLowerCase() : undefined;
    const cheeseId = typeof req.query.cheeseId === "string" ? req.query.cheeseId : undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    } else if (username) {
      where.user = { username };
    }

    if (cheeseId) {
      where.cheeseId = cheeseId;
    }

    const [total, logs] = await Promise.all([
      prisma.cheeseLog.count({ where }),
      prisma.cheeseLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consumedAt: "desc" },
        include: {
          cheese: {
            include: { type: true },
          },
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
    ]);

    res.json({
      items: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs." });
  }
});

// 3. GET /api/logs/:id - Get Single Log
logRouter.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await prisma.cheeseLog.findUnique({
      where: { id },
      include: {
        cheese: { include: { type: true } },
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    if (!log) {
      res.status(404).json({ error: "Log entry not found." });
      return;
    }

    res.json({ log });
  } catch (error) {
    console.error("Error fetching single log:", error);
    res.status(500).json({ error: "Failed to fetch log entry." });
  }
});

// 4. PATCH /api/logs/:id - Update Log
const updateLogSchema = z.object({
  rating: z
    .number()
    .min(0.0)
    .max(5.0)
    .refine((val) => Math.round(val * 2) === val * 2, {
      message: "Rating must be in 0.5 increments",
    })
    .optional(),
  isLiked: z.boolean().optional(),
  isFirstTaste: z.boolean().optional(),
  reviewText: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  consumedAt: z.string().optional(),
});

logRouter.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parse = updateLogSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const existing = await prisma.cheeseLog.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Log entry not found." });
      return;
    }

    if (existing.userId !== req.user!.userId) {
      res.status(403).json({ error: "You are not authorized to edit this log." });
      return;
    }

    const { rating, isLiked, isFirstTaste, reviewText, photoUrl, consumedAt } = parse.data;

    const data: any = {};
    if (rating !== undefined) data.rating = rating;
    if (isLiked !== undefined) data.isLiked = isLiked;
    if (isFirstTaste !== undefined) data.isFirstTaste = isFirstTaste;
    if (reviewText !== undefined) data.reviewText = reviewText?.trim() || null;
    if (photoUrl !== undefined) data.photoUrl = photoUrl?.trim() || null;
    if (consumedAt !== undefined) {
      const d = new Date(consumedAt);
      if (!isNaN(d.getTime())) data.consumedAt = d;
    }

    const updated = await prisma.cheeseLog.update({
      where: { id },
      data,
      include: {
        cheese: { include: { type: true } },
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    res.json({ log: updated });
  } catch (error) {
    console.error("Error updating log:", error);
    res.status(500).json({ error: "Failed to update log." });
  }
});

// 5. DELETE /api/logs/:id - Delete Log
logRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.cheeseLog.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Log entry not found." });
      return;
    }

    if (existing.userId !== req.user!.userId) {
      res.status(403).json({ error: "You are not authorized to delete this log." });
      return;
    }

    await prisma.cheeseLog.delete({ where: { id } });
    res.json({ message: "Log successfully deleted." });
  } catch (error) {
    console.error("Error deleting log:", error);
    res.status(500).json({ error: "Failed to delete log." });
  }
});
