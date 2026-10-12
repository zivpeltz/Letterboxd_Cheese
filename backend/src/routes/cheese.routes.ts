import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { optionalAuth, requireAuth, AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { fetchWikipediaCheeseSummary } from "../services/wikipedia.service.js";

export const cheeseRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 1. GET /api/cheeses - List & Search Cheeses
cheeseRouter.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const maker = typeof req.query.maker === "string" ? req.query.maker.trim() : undefined;
    const type = typeof req.query.type === "string" ? req.query.type.trim() : undefined;
    const minFat = req.query.minFat ? parseFloat(req.query.minFat as string) : undefined;
    const maxFat = req.query.maxFat ? parseFloat(req.query.maxFat as string) : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : "popular";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { maker: { contains: q, mode: "insensitive" } },
        { type: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (maker) {
      where.maker = { equals: maker, mode: "insensitive" };
    }

    if (type) {
      where.type = {
        OR: [
          { slug: { equals: type.toLowerCase() } },
          { name: { equals: type, mode: "insensitive" } },
        ],
      };
    }

    if (minFat !== undefined || maxFat !== undefined) {
      where.fatPercentage = {};
      if (minFat !== undefined) where.fatPercentage.gte = minFat;
      if (maxFat !== undefined) where.fatPercentage.lte = maxFat;
    }

    const [total, cheeses] = await Promise.all([
      prisma.cheese.count({ where }),
      prisma.cheese.findMany({
        where,
        include: {
          type: {
            select: { id: true, name: true, slug: true, description: true, thumbnailUrl: true },
          },
          logs: {
            select: { rating: true, isLiked: true, userId: true },
          },
          wishlistedBy: req.user ? { where: { userId: req.user.userId } } : false,
        },
      }),
    ]);

    // Format & calculate aggregate stats
    let formatted = cheeses.map((cheese) => {
      const totalLogs = cheese.logs.length;
      const avgRating =
        totalLogs > 0
          ? Number((cheese.logs.reduce((acc, l) => acc + l.rating, 0) / totalLogs).toFixed(1))
          : null;
      const totalLikes = cheese.logs.filter((l) => l.isLiked).length;

      const userLog = req.user
        ? cheese.logs.find((l) => l.userId === req.user!.userId)
        : null;

      const isWishlisted = req.user
        ? Boolean((cheese.wishlistedBy as any[])?.length > 0)
        : false;

      return {
        id: cheese.id,
        name: cheese.name,
        slug: cheese.slug,
        maker: cheese.maker,
        fatPercentage: cheese.fatPercentage,
        description: cheese.description || cheese.type?.description || null,
        imageUrl: cheese.imageUrl || cheese.type?.thumbnailUrl || null,
        type: cheese.type,
        stats: {
          logsCount: totalLogs,
          avgRating,
          likesCount: totalLikes,
        },
        userState: req.user
          ? {
              hasLogged: Boolean(userLog),
              userRating: userLog?.rating ?? null,
              isLiked: userLog?.isLiked ?? false,
              isWishlisted,
            }
          : null,
      };
    });

    // In-memory sorting for aggregate stats (or Prisma order for simple fields)
    if (sort === "popular") {
      formatted.sort((a, b) => b.stats.logsCount - a.stats.logsCount);
    } else if (sort === "rating") {
      formatted.sort((a, b) => (b.stats.avgRating || 0) - (a.stats.avgRating || 0));
    } else if (sort === "name") {
      formatted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "newest") {
      // already ordered by creation in db if needed
    }

    const paginated = formatted.slice(skip, skip + limit);

    res.json({
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cheeses:", error);
    res.status(500).json({ error: "Failed to fetch cheeses." });
  }
});

// 2. GET /api/cheeses/types - Get all cheese types with Wikipedia info
cheeseRouter.get("/types", async (_req: Request, res: Response): Promise<void> => {
  try {
    const types = await prisma.cheeseType.findMany({
      include: {
        _count: {
          select: { cheeses: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      types: types.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        wikipediaUrl: t.wikipediaUrl,
        thumbnailUrl: t.thumbnailUrl,
        cheeseCount: t._count.cheeses,
      })),
    });
  } catch (error) {
    console.error("Error fetching cheese types:", error);
    res.status(500).json({ error: "Failed to fetch cheese types." });
  }
});

// 3. GET /api/cheeses/makers - Get all distinct makers
cheeseRouter.get("/makers", async (_req: Request, res: Response): Promise<void> => {
  try {
    const makers = await prisma.cheese.groupBy({
      by: ["maker"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    res.json({
      makers: makers.map((m) => ({
        name: m.maker,
        cheeseCount: m._count.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching makers:", error);
    res.status(500).json({ error: "Failed to fetch makers." });
  }
});

// 4. GET /api/cheeses/:idOrSlug - Single Cheese Profile (Letterboxd Style)
cheeseRouter.get("/:idOrSlug", optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { idOrSlug } = req.params;

    const cheese = await prisma.cheese.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        type: true,
        logs: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { consumedAt: "desc" },
        },
        wishlistedBy: req.user ? { where: { userId: req.user.userId } } : false,
      },
    });

    if (!cheese) {
      res.status(404).json({ error: "Cheese not found." });
      return;
    }

    const totalLogs = cheese.logs.length;
    const avgRating =
      totalLogs > 0
        ? Number((cheese.logs.reduce((acc, l) => acc + l.rating, 0) / totalLogs).toFixed(1))
        : null;
    const likesCount = cheese.logs.filter((l) => l.isLiked).length;

    // Build Letterboxd 10-bucket rating distribution histogram (0.5 to 5.0)
    const ratingHistogram: Record<string, number> = {
      "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0,
      "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0,
    };

    for (const log of cheese.logs) {
      const key = log.rating.toFixed(1);
      if (ratingHistogram[key] !== undefined) {
        ratingHistogram[key]++;
      }
    }

    const currentUserLog = req.user
      ? cheese.logs.find((l) => l.userId === req.user!.userId)
      : null;

    const isWishlisted = req.user
      ? Boolean((cheese.wishlistedBy as any[])?.length > 0)
      : false;

    res.json({
      id: cheese.id,
      name: cheese.name,
      slug: cheese.slug,
      maker: cheese.maker,
      fatPercentage: cheese.fatPercentage,
      description: cheese.description || cheese.type?.description || null,
      imageUrl: cheese.imageUrl || cheese.type?.thumbnailUrl || null,
      type: cheese.type,
      stats: {
        logsCount: totalLogs,
        avgRating,
        likesCount,
        ratingHistogram,
      },
      recentReviews: cheese.logs
        .filter((l) => l.reviewText && l.reviewText.trim().length > 0)
        .slice(0, 10)
        .map((l) => ({
          id: l.id,
          user: l.user,
          rating: l.rating,
          isLiked: l.isLiked,
          reviewText: l.reviewText,
          photoUrl: l.photoUrl,
          consumedAt: l.consumedAt,
        })),
      userState: req.user
        ? {
            hasLogged: Boolean(currentUserLog),
            userRating: currentUserLog?.rating ?? null,
            userReview: currentUserLog?.reviewText ?? null,
            isLiked: currentUserLog?.isLiked ?? false,
            isWishlisted,
            logId: currentUserLog?.id ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching single cheese:", error);
    res.status(500).json({ error: "Failed to fetch cheese." });
  }
});

// 5. POST /api/cheeses - Create / Quick-Add a Cheese
const createCheeseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  maker: z.string().min(1, "Maker/Brand is required").max(150),
  typeName: z.string().min(1, "Type is required").max(100),
  fatPercentage: z.number().min(0).max(100).nullable().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

cheeseRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parse = createCheeseSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { name, maker, typeName, fatPercentage, description, imageUrl } = parse.data;

    // Check if Type exists, or create it automatically and fetch Wikipedia summary
    let type = await prisma.cheeseType.findFirst({
      where: {
        OR: [
          { name: { equals: typeName, mode: "insensitive" } },
          { slug: { equals: slugify(typeName) } },
        ],
      },
    });

    if (!type) {
      const wikiSummary = await fetchWikipediaCheeseSummary(typeName);
      type = await prisma.cheeseType.create({
        data: {
          name: typeName.trim(),
          slug: slugify(typeName),
          description: wikiSummary?.extract || null,
          wikipediaUrl: wikiSummary?.wikipediaUrl || null,
          thumbnailUrl: wikiSummary?.thumbnailUrl || null,
        },
      });
    }

    let slug = slugify(`${maker}-${name}`);
    // Handle slug collision if identical maker + name exists
    const existing = await prisma.cheese.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const cheese = await prisma.cheese.create({
      data: {
        name,
        slug,
        maker,
        typeId: type.id,
        fatPercentage: fatPercentage ?? null,
        description: description || null,
        imageUrl: imageUrl || type.thumbnailUrl || null,
        createdByUserId: req.user!.userId,
      },
      include: {
        type: true,
      },
    });

    res.status(201).json({ cheese });
  } catch (error) {
    console.error("Error creating cheese:", error);
    res.status(500).json({ error: "Failed to create cheese." });
  }
});
