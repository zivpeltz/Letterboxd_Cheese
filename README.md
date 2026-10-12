# 🧀 Cheeseboxd (Letterboxd for Cheese)

> A streamlined, social platform to log, rate, and review cheeses—bringing the best of Letterboxd's diary, ratings, and profile showcase to cheese lovers.

---

## 🌟 Features

* **Letterboxd-Style Logging**: Rate cheeses from **0 to 5 stars** (in 0.5-star increments), add an optional review, attach a picture, like/heart, and track diary dates.
* **Lean Cheese Catalog**: Cheeses are organized by **Maker (Brand/Creamery)**, **Type (Variety)**, optional **Fat Percentage** (especially for cottage cheese), and an image.
* **Wikipedia Integration**: Cheese type descriptions are automatically retrieved and kept up to date via the Wikipedia REST API.
* **User Profile Showcase**:
  * Pinned **Top 4 Favorite Cheeses**.
  * Dynamic **10-bucket rating distribution histogram** (0.5 to 5.0 stars).
  * Diary timeline, review counts, and palate insights (most-logged styles and makers).
* **Search & Discovery**:
  * Search by **Maker** (e.g. *Cabot*, *Tnuva*, *Kerrygold*).
  * Search by **Type** (e.g. *Cottage*, *Cheddar*, *Brie*, *Gouda*).
  * Filter by fat percentage range (e.g. *4% to 9%*).
* **Wishlist & Custom Lists**: Bookmark cheeses to taste next, or create ranked lists (e.g. *"Top Supermarket Cottage Cheeses"*).

---

## 🏗️ Architecture & Tech Stack

* **Database**: PostgreSQL 16 (running via Docker Compose) with `pg_trgm` extension for fast text matching.
* **Backend API**: Node.js v22 (TypeScript), Express, Prisma ORM v5, Zod validation, JWT authentication.
* **Frontend** (in progress): Web application tailored to your custom design and layout.
* **Roadmap**: See [WORKPLAN.md](./WORKPLAN.md) for the detailed architectural blueprint.

---

## 🚀 Quickstart (Local Development)

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* [Docker & Docker Compose](https://www.docker.com/)

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```

### 3. Setup and Run the Backend API
```bash
cd backend
cp .env.example .env
npm install

# Push Prisma schema to local database
npx prisma db push

# Seed 15 styles with Wikipedia summaries + 13 curated cheeses + demo user
npm run prisma:seed

# Start development server
npm run dev
```

The API server runs at `http://localhost:4000`.  
Check health status: `http://localhost:4000/api/health`.

### 4. Run Automated End-to-End Tests
```bash
cd backend
node test-backend.js
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/me` | Fetch currently logged-in user |
| `GET` | `/api/cheeses` | List/search cheeses by `q`, `maker`, `type`, `minFat`, `maxFat` |
| `GET` | `/api/cheeses/:idOrSlug` | Detailed cheese page with rating histogram and reviews |
| `POST` | `/api/cheeses` | Quick-add a new cheese (Maker + Type + Fat % + Photo) |
| `GET` | `/api/cheeses/types` | List all cheese types with Wikipedia descriptions |
| `POST` | `/api/logs` | Log a cheese (0–5 stars, review, photo, like) |
| `GET` | `/api/logs` | User diary and community activity feed |
| `GET` | `/api/users/:username` | User profile with Top 4 favorites, rating histogram, and stats |
| `PUT` | `/api/users/favorites` | Update user's pinned Top 4 cheeses |
| `POST` | `/api/wishlist/:cheeseId`| Toggle cheese in/out of "Want to Taste" list |
| `GET` | `/api/lists` | Browse custom curated lists |

---

## 📄 License
MIT
