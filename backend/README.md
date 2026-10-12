# Cheeseboxd Backend API Documentation

The backend powers **Cheeseboxd** (a Letterboxd-style platform for cheese logging, rating, and discovery).

## Tech Stack
* **Runtime**: Node.js v22 (TypeScript)
* **Framework**: Express + CORS + Zod
* **Database**: PostgreSQL 16 (via Docker Compose)
* **ORM**: Prisma ORM v5
* **External Integrations**: Wikipedia REST API for automatic cheese style descriptions

---

## Running the Backend

### 1. Start Database
```bash
docker compose up -d
```

### 2. Install & Sync Schema
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed   # Seeds 15 types from Wikipedia + 13 cheeses + demo user
```

### 3. Start Development Server
```bash
npm run dev           # Runs on http://localhost:4000
```

### 4. Run Automated End-to-End Verification
```bash
node test-backend.js
```

---

## API Endpoints Reference

### 1. Authentication (`/api/auth`)
* `POST /api/auth/register`: Create account (`username`, `email`, `password`, `displayName`).
* `POST /api/auth/login`: Login (`usernameOrEmail`, `password`) $\rightarrow$ returns `{ user, token }`.
* `GET /api/auth/me`: Get currently logged-in user profile (Requires `Authorization: Bearer <token>`).

### 2. Cheese Catalog & Search (`/api/cheeses`)
* `GET /api/cheeses`: List and search cheeses.
  * Query parameters:
    * `q`: Text search across cheese name, maker, and type.
    * `maker`: Filter by brand (e.g. `?maker=Tnuva` or `?maker=Cabot`).
    * `type`: Filter by type (e.g. `?type=Cottage` or `?type=Cheddar`).
    * `minFat` & `maxFat`: Filter by fat percentage (e.g. `?minFat=4&maxFat=9`).
    * `sort`: `popular` (default), `rating`, `name`, `newest`.
    * `page`, `limit`: Pagination.
* `GET /api/cheeses/:idOrSlug`: Retrieve full cheese page including:
  * Cheese metadata, maker, optional fat %.
  * Type metadata with full Wikipedia description and thumbnail.
  * Letterboxd-style 10-bucket rating distribution histogram (`0.5` through `5.0`).
  * Average rating and total logs count.
  * Recent community reviews.
  * Authenticated user state (whether logged, user's rating, liked, wishlisted).
* `POST /api/cheeses`: Quick-add a new cheese (`name`, `maker`, `typeName`, optional `fatPercentage`, `description`, `imageUrl`). Automatically fetches Wikipedia summary if the type is new.
* `GET /api/cheeses/types`: List all cheese types with their Wikipedia descriptions and cheese count.
* `GET /api/cheeses/makers`: List all makers with their cheese counts.

### 3. Diary & Logging (`/api/logs`)
* `POST /api/logs`: Log a cheese (Requires Bearer token):
  * `cheeseId`: UUID
  * `rating`: `0.0` to `5.0` in `0.5` increments (e.g. `4.5`)
  * `reviewText`: Optional text review
  * `photoUrl`: Optional picture URL
  * `isLiked`: Boolean (heart toggle)
  * `isFirstTaste`: Boolean
  * `consumedAt`: Optional date string (defaults to today)
* `GET /api/logs`: Query diary logs (supports `?username=...`, `?cheeseId=...`, `?page=...`).
* `GET /api/logs/:id`: Get single log entry.
* `PATCH /api/logs/:id`: Edit log (rating, review, photo, like, date).
* `DELETE /api/logs/:id`: Delete log entry.

### 4. Profiles & Behavior (`/api/users`)
* `GET /api/users/:username`: Full profile dashboard:
  * **Top 4 Favorites**: Pinned cheeses in slots 1–4.
  * **Rating Histogram**: Letterboxd 10-bar chart (`0.5` through `5.0` stars).
  * **Stats**: Total logs count, unique cheeses tasted, total reviews written, wishlist count.
  * **Top Tastes**: Most-logged cheese styles and makers.
  * **Recent Diary Entries**: Latest 5 logs with reviews and thumbnails.
* `PUT /api/users/favorites`: Set Top 4 favorites (`cheeseIds: [id1, id2, id3, id4]`).
* `PATCH /api/users/profile`: Update `displayName`, `bio`, `avatarUrl`, `location`.

### 5. Wishlists & Lists (`/api/wishlist`, `/api/lists`)
* `POST /api/wishlist/:cheeseId`: Toggle cheese in/out of "Want to Taste" list.
* `GET /api/wishlist`: Retrieve wishlist items.
* `GET /api/lists`: Browse community curated lists.
* `GET /api/lists/:id`: View list with ranked or unranked cheeses.
* `POST /api/lists`: Create new list.
