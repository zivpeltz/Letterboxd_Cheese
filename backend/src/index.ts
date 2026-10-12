import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes.js";
import { cheeseRouter } from "./routes/cheese.routes.js";
import { logRouter } from "./routes/log.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { wishlistRouter } from "./routes/wishlist.routes.js";
import { listRouter } from "./routes/list.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", app: "Cheeseboxd API", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/cheeses", cheeseRouter);
app.use("/api/logs", logRouter);
app.use("/api/users", profileRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/lists", listRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected internal server error occurred." });
});

app.listen(PORT, () => {
  console.log(`🧀 Cheeseboxd API Server running on http://localhost:${PORT}`);
  console.log(`🚀 Healthcheck: http://localhost:${PORT}/api/health`);
});
