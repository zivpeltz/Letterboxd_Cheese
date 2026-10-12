import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const listRouter = Router();

// 1. GET /api/lists - Browse Curated Lists
listRouter.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const lists = await prisma.customList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        items: {
          take: 5,
          orderBy: { position: "asc" },
          include: {
            cheese: {
              select: { id: true, name: true, maker: true, imageUrl: true, type: true },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });

    res.json({
      lists: lists.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        isRanked: l.isRanked,
        user: l.user,
        itemsCount: l._count.items,
        previewItems: l.items.map((i) => ({
          position: i.position,
          notes: i.notes,
          cheese: {
            id: i.cheese.id,
            name: i.cheese.name,
            maker: i.cheese.maker,
            imageUrl: i.cheese.imageUrl || i.cheese.type?.thumbnailUrl,
          },
        })),
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching lists:", error);
    res.status(500).json({ error: "Failed to fetch lists." });
  }
});

// 2. GET /api/lists/:id - Get Single List with all cheeses
listRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const list = await prisma.customList.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        items: {
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
      },
    });

    if (!list) {
      res.status(404).json({ error: "List not found." });
      return;
    }

    res.json({
      list: {
        id: list.id,
        title: list.title,
        description: list.description,
        isRanked: list.isRanked,
        user: list.user,
        createdAt: list.createdAt,
        items: list.items.map((item) => {
          const c = item.cheese;
          const totalRatings = c.logs.length;
          const avgRating =
            totalRatings > 0
              ? Number((c.logs.reduce((acc, l) => acc + l.rating, 0) / totalRatings).toFixed(1))
              : null;

          return {
            id: item.id,
            position: item.position,
            notes: item.notes,
            cheese: {
              id: c.id,
              name: c.name,
              slug: c.slug,
              maker: c.maker,
              fatPercentage: c.fatPercentage,
              imageUrl: c.imageUrl || c.type?.thumbnailUrl,
              type: c.type,
              avgRating,
            },
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching single list:", error);
    res.status(500).json({ error: "Failed to fetch list." });
  }
});

// 3. POST /api/lists - Create Custom List
const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().max(1000).optional(),
  isRanked: z.boolean().optional().default(false),
  cheeseIds: z.array(z.string().uuid()).optional(),
});

listRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parse = createListSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.errors[0].message });
      return;
    }

    const { title, description, isRanked, cheeseIds = [] } = parse.data;

    const list = await prisma.customList.create({
      data: {
        userId: req.user!.userId,
        title,
        description: description || null,
        isRanked,
        items: {
          create: cheeseIds.map((cheeseId, idx) => ({
            cheeseId,
            position: idx + 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            cheese: { include: { type: true } },
          },
        },
      },
    });

    res.status(201).json({ list });
  } catch (error) {
    console.error("Error creating list:", error);
    res.status(500).json({ error: "Failed to create list." });
  }
});

// 4. POST /api/lists/:id/items - Add item to list
listRouter.post("/:id/items", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cheeseId, notes } = req.body;

    if (!cheeseId) {
      res.status(400).json({ error: "cheeseId is required" });
      return;
    }

    const list = await prisma.customList.findUnique({ where: { id } });
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }

    if (list.userId !== req.user!.userId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const count = await prisma.listItem.count({ where: { listId: id } });

    const item = await prisma.listItem.create({
      data: {
        listId: id,
        cheeseId,
        position: count + 1,
        notes: notes || null,
      },
      include: {
        cheese: { include: { type: true } },
      },
    });

    res.status(201).json({ item });
  } catch (error) {
    console.error("Error adding item to list:", error);
    res.status(500).json({ error: "Failed to add item to list." });
  }
});
