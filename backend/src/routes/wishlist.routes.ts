import { Router, Response } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, optionalAuth, AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const wishlistRouter = Router();

// 1. GET /api/wishlist - Get Wishlist (User's "Want to Taste" list)
wishlistRouter.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUsername = typeof req.query.username === "string" ? req.query.username.toLowerCase() : undefined;
    let targetUserId = req.user?.userId;

    if (targetUsername) {
      const u = await prisma.user.findUnique({ where: { username: targetUsername } });
      if (!u) {
        res.status(404).json({ error: "User not found." });
        return;
      }
      targetUserId = u.id;
    }

    if (!targetUserId) {
      res.status(400).json({ error: "Please log in or provide a username query parameter." });
      return;
    }

    const items = await prisma.wishlist.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      include: {
        cheese: {
          include: {
            type: true,
            logs: { select: { rating: true } },
          },
        },
      },
    });

    const formatted = items.map((item) => {
      const c = item.cheese;
      const totalRatings = c.logs.length;
      const avgRating =
        totalRatings > 0
          ? Number((c.logs.reduce((acc, l) => acc + l.rating, 0) / totalRatings).toFixed(1))
          : null;

      return {
        addedAt: item.createdAt,
        cheese: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          maker: c.maker,
          fatPercentage: c.fatPercentage,
          imageUrl: c.imageUrl || c.type?.thumbnailUrl || null,
          type: c.type,
          avgRating,
          logsCount: totalRatings,
        },
      };
    });

    res.json({ items: formatted });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist." });
  }
});

// 2. POST /api/wishlist/:cheeseId - Toggle in/out of Wishlist
wishlistRouter.post("/:cheeseId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cheeseId } = req.params;
    const userId = req.user!.userId;

    const cheese = await prisma.cheese.findUnique({ where: { id: cheeseId } });
    if (!cheese) {
      res.status(404).json({ error: "Cheese not found." });
      return;
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_cheeseId: { userId, cheeseId },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: {
          userId_cheeseId: { userId, cheeseId },
        },
      });
      res.json({ isWishlisted: false, message: "Removed from wishlist." });
      return;
    }

    await prisma.wishlist.create({
      data: { userId, cheeseId },
    });

    res.json({ isWishlisted: true, message: "Added to wishlist." });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ error: "Failed to update wishlist." });
  }
});
