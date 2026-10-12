import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const profileRouter = Router();

// GET /api/users - List real community members
profileRouter.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
        favorites: {
          orderBy: { position: "asc" },
          include: {
            cheese: {
              select: { id: true, name: true, maker: true, imageUrl: true },
            },
          },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        location: u.location,
        createdAt: u.createdAt,
        stats: {
          totalLogs: u._count.logs,
        },
        top4: u.favorites.map((fav) => ({
          position: fav.position,
          cheese: fav.cheese,
        })),
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});


// 1. GET /api/users/:username - Full Letterboxd-Style Profile
profileRouter.get("/:username", async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.params.username.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
        favorites: {
          orderBy: { position: "asc" },
          include: {
            cheese: {
              include: {
                type: true,
                logs: { select: { rating: true } },
              },
            },
          },
        },
        _count: {
          select: {
            logs: true,
            wishlists: true,
            lists: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Fetch user logs to build stats & distribution
    const allLogs = await prisma.cheeseLog.findMany({
      where: { userId: user.id },
      include: {
        cheese: {
          include: { type: true },
        },
      },
      orderBy: { consumedAt: "desc" },
    });

    // 10-bucket Letterboxd rating histogram (0.5 to 5.0)
    const ratingHistogram: Record<string, number> = {
      "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0,
      "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0,
    };

    const uniqueCheeseSet = new Set<string>();
    let totalReviews = 0;
    let totalLikes = 0;
    const typeCountMap: Record<string, number> = {};
    const makerCountMap: Record<string, number> = {};

    for (const log of allLogs) {
      const key = log.rating.toFixed(1);
      if (ratingHistogram[key] !== undefined) {
        ratingHistogram[key]++;
      }

      uniqueCheeseSet.add(log.cheeseId);

      if (log.reviewText && log.reviewText.trim().length > 0) {
        totalReviews++;
      }

      if (log.isLiked) {
        totalLikes++;
      }

      if (log.cheese.type?.name) {
        typeCountMap[log.cheese.type.name] = (typeCountMap[log.cheese.type.name] || 0) + 1;
      }

      if (log.cheese.maker) {
        makerCountMap[log.cheese.maker] = (makerCountMap[log.cheese.maker] || 0) + 1;
      }
    }

    const topTypes = Object.entries(typeCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topMakers = Object.entries(makerCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Format Top 4 Favorites
    const top4 = user.favorites.map((fav) => {
      const c = fav.cheese;
      const totalRatings = c.logs.length;
      const avgRating =
        totalRatings > 0
          ? Number((c.logs.reduce((acc, l) => acc + l.rating, 0) / totalRatings).toFixed(1))
          : null;

      return {
        position: fav.position,
        cheese: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          maker: c.maker,
          fatPercentage: c.fatPercentage,
          imageUrl: c.imageUrl || c.type?.thumbnailUrl || null,
          type: c.type,
          avgRating,
        },
      };
    });

    // Recent 5 diary logs
    const recentLogs = allLogs.slice(0, 5).map((l) => ({
      id: l.id,
      consumedAt: l.consumedAt,
      rating: l.rating,
      isLiked: l.isLiked,
      reviewText: l.reviewText,
      photoUrl: l.photoUrl,
      cheese: {
        id: l.cheese.id,
        name: l.cheese.name,
        slug: l.cheese.slug,
        maker: l.cheese.maker,
        fatPercentage: l.cheese.fatPercentage,
        imageUrl: l.cheese.imageUrl || l.cheese.type?.thumbnailUrl || null,
        type: l.cheese.type,
      },
    }));

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        location: user.location,
        createdAt: user.createdAt,
      },
      top4,
      stats: {
        totalLogs: user._count.logs,
        uniqueCheeses: uniqueCheeseSet.size,
        totalReviews,
        totalLikes,
        totalWishlist: user._count.wishlists,
        totalLists: user._count.lists,
        ratingHistogram,
        topTypes,
        topMakers,
      },
      recentLogs,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// 2. PUT /api/users/favorites - Set Top 4 Favorites
const setFavoritesSchema = z.object({
  cheeseIds: z
    .array(z.string().uuid("Invalid cheese ID"))
    .max(4, "You can select up to 4 favorite cheeses"),
});

profileRouter.put("/favorites", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parse = setFavoritesSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { cheeseIds } = parse.data;
    const userId = req.user!.userId;

    // Remove existing favorites
    await prisma.userFavorite.deleteMany({ where: { userId } });

    // Create new favorites in ordered positions 1..4
    const newFavorites = [];
    for (let i = 0; i < cheeseIds.length; i++) {
      const fav = await prisma.userFavorite.create({
        data: {
          userId,
          cheeseId: cheeseIds[i],
          position: i + 1,
        },
        include: {
          cheese: { include: { type: true } },
        },
      });
      newFavorites.push(fav);
    }

    res.json({ favorites: newFavorites });
  } catch (error) {
    console.error("Error setting top 4 favorites:", error);
    res.status(500).json({ error: "Failed to update top 4 favorites." });
  }
});

// 3. PATCH /api/users/profile - Edit Profile
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  location: z.string().max(100).optional().nullable(),
});

profileRouter.patch("/profile", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const userId = req.user!.userId;
    const { displayName, bio, avatarUrl, location } = parse.data;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
      },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
});
