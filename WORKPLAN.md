# Cheeseboxd: Project Blueprint & Implementation Workplan
*A streamlined, Letterboxd-style platform to log, rate, and review cheese.*

---

## 1. Executive Summary & Core Philosophy

The goal is to create a clean, addictive, and frictionless social platform for logging and ranking cheeses—bringing the best parts of **Letterboxd** to cheese lovers without unnecessary bloat.

### Guiding Principles
1. **Zero-Bloat Logging**: A log entry should be as fast and familiar as Letterboxd: a simple **0 to 5 star rating**, an optional **review**, and an optional **photo**.
2. **Pragmatic Cheese Data (Maker + Type)**: Avoid over-engineered scientific metrics. Cheeses are identified simply by **Maker (Brand/Producer)**, **Type (Variety)**, optional **Fat Percentage**, and a concise **Wikipedia-sourced description**.
3. **Effortless Discovery**: Finding cheese should work naturally whether searching by brand (*"Cabot"*, *"Kerrygold"*), by style (*"Cheddar"*, *"Cottage"*, *"Brie"*), or both (*"Cabot Cheddar"*).
4. **API-First Architecture**: Built with a dedicated PostgreSQL database and backend API server to power the web application first, while remaining ready for a future mobile companion app.

---

## 2. Cheese Entity & Cataloging Strategy

### 2.1. The Streamlined Cheese Model
Instead of requiring dozens of obscure technical attributes that are difficult to track down for every commercial brand, each cheese record contains:

* **Maker / Brand / Producer**: Who makes it (e.g., *Cabot*, *President*, *Kerrygold*, *Tnuva*, *Old Amsterdam*, or *Artisanal / Farmstead*).
* **Type**: The style/variety of cheese (e.g., *Cheddar*, *Brie*, *Gouda*, *Cottage*, *Parmesan*, *Mozzarella*, *Feta*, *Blue*).
* **Fat Percentage (Optional)**: Crucial for fresh cheeses and cottage cheese (e.g., *0.5%*, *5%*, *9%*), while optional for hard/aged cheeses where it isn't standard consumer information.
* **Short Description**: A clear 2–3 sentence overview of the cheese style lifted directly from Wikipedia or food reference sources.
* **Image URL**: A clean product shot or wedge photo.

```
┌─────────────────────────────────────────────────────────────┐
│  CHEESE RECORD EXAMPLE                                      │
├─────────────────────────────────────────────────────────────┤
│  Name: Cabot Extra Sharp Cheddar                            │
│  Maker: Cabot Creamery                                      │
│  Type: Cheddar                                              │
│  Fat %: NULL (optional)                                     │
│  Description: "Cheddar is a relatively hard, off-white      │
│  natural cheese originated in the English village of        │
│  Cheddar in Somerset..." [Wikipedia]                        │
│  Image: https://.../cabot_cheddar.jpg                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. How Users Find Cheeses
* **Search by Maker**: Searching *"Cabot"* lists all cheeses produced by Cabot.
* **Search by Type**: Searching *"Brie"* or *"Cottage"* lists all brands and expressions of that type.
* **Combined Search**: Searching *"Kerrygold Cheddar"* surfaces the exact match instantly.
* **Filtering**: Simple dropdown filters for **Type** (Cheddar, Gouda, Brie, Cottage, etc.) and **Maker**.

---

## 3. The Log / Review Functionality (Letterboxd Mechanics)

Logging a cheese is fast, intuitive, and focused strictly on the user's impressions:

* **Rating**: **0 to 5 Stars** (standard 0.5-star increments: 0, 0.5, 1.0, ... 5.0).
* **Review Text**: Optional written thoughts, tasting impressions, or pairings.
* **Photo**: Optional photo upload (the cheese wedge, plate, packaging, or cheese board).
* **Consumed Date**: Date consumed (defaults to today; customizable).
* **Like Toggle**: Quick heart / favorite toggle.
* **First Taste Toggle**: Indicates if this is the first time trying this cheese or a repeat taste.

---

## 4. User Profile Architecture: What is Saved & Displayed

The profile page focuses on identity and tasting history without over-complicated radar graphs:

### 4.1. Core Profile Details
* **Profile Info**: Username, Display Name, Bio, Avatar, Header Banner, Location.
* **The Iconic "Top 4"**: Four pinned favorite cheeses chosen by the user to showcase their personal palate.

### 4.2. Tasting Stats & Diary
* **Rating Distribution Histogram**: The classic Letterboxd bar chart showing how many cheeses have been rated 0.5 through 5 stars.
* **Total Counts**: Total Cheeses Logged, Total Reviews Written, Wishlist Count.
* **Diary Timeline**: A chronological feed of all logged cheeses with date, star rating, like flag, review snippet, and photo thumbnail.
* **Favorite Makers & Types**: Auto-calculated top 3 most-logged cheese types and makers (e.g., *"Favorite style: Aged Cheddars"*, *"Most logged maker: Kerrygold"*).

### 4.3. Lists & Wishlist
* **Wishlist ("Want to Taste")**: Cheeses bookmarked to try next.
* **Custom Lists**: User-created public or private lists (e.g., *"Best Cheeses for Grilled Cheese"*, *"Supermarket Cottage Cheeses Ranked"*).

---

## 5. Simplified Database Schema (PostgreSQL)

The database schema is streamlined to eliminate bloat while keeping relational integrity rock-solid.

### 5.1. `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2. `cheese_types` (Reference Table for Wikipedia Summaries)
```sql
CREATE TABLE cheese_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'Cheddar', 'Cottage', 'Brie', 'Gouda', 'Mozzarella'
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT, -- Extracted from Wikipedia
    wikipedia_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3. `cheeses` (The Core Catalog)
```sql
CREATE TABLE cheeses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL, -- e.g., 'Extra Sharp White Cheddar'
    slug VARCHAR(200) UNIQUE NOT NULL,
    maker VARCHAR(150) NOT NULL, -- e.g., 'Cabot', 'Kerrygold', 'Tnuva'
    type_id UUID REFERENCES cheese_types(id) ON DELETE SET NULL, -- Type reference
    fat_percentage NUMERIC(4, 1), -- Optional! e.g., 5.0, 9.0 (very relevant for cottage cheese)
    description TEXT, -- Optional specific notes or fallback to type description
    image_url TEXT,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigram indexing for fast, typo-tolerant search across name, maker, and type
CREATE INDEX idx_cheeses_search ON cheeses USING gin (name gin_trgm_ops, maker gin_trgm_ops);
```

### 5.4. `cheese_logs` (The Letterboxd Diary Entry)
```sql
CREATE TABLE cheese_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cheese_id UUID NOT NULL REFERENCES cheeses(id) ON DELETE CASCADE,
    consumed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 0.0 AND rating <= 5.0), -- 0 to 5 stars
    is_liked BOOLEAN DEFAULT FALSE,
    is_first_taste BOOLEAN DEFAULT TRUE,
    review_text TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5. `user_favorites` (The Top 4)
```sql
CREATE TABLE user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position INT CHECK (position BETWEEN 1 AND 4),
    cheese_id UUID REFERENCES cheeses(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, position)
);
```

### 5.6. `wishlists` (Want to Taste)
```sql
CREATE TABLE wishlists (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cheese_id UUID REFERENCES cheeses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, cheese_id)
);
```

### 5.7. `lists` & `list_items` (Custom Lists)
```sql
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    is_ranked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    cheese_id UUID NOT NULL REFERENCES cheeses(id) ON DELETE CASCADE,
    position INT NOT NULL,
    UNIQUE (list_id, cheese_id)
);
```

---

## 6. Sourcing Wikipedia Descriptions & Seed Data

### 6.1. Wikipedia Description Ingestion
A small utility script queries the official Wikipedia REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`) to pull clean, concise summaries for all major cheese types:
* **Cheddar**: `"Cheddar cheese is a relatively hard, off-white natural cheese that originated in the English village of Cheddar in Somerset..."`
* **Cottage cheese**: `"Cottage cheese is a fresh curd cheese product with a mild flavor and a creamy, soupy texture..."`
* **Brie**: `"Brie is a soft cow's-milk cheese named after Brie, the French region from which it originated..."`
* **Gouda**: `"Gouda is a sweet, creamy, yellow cow's milk cheese originating from the Netherlands..."`

### 6.2. Baseline Seed Catalog
* Pre-populate 50+ common cheese types with their Wikipedia descriptions.
* Pre-populate common commercial and artisan makers (e.g., *Cabot, Kerrygold, President, Tillamook, Sargento, Organic Valley, Fage, Tnuva, Kraft, etc.*).
* Provide a clean **"Add a Cheese"** modal so any user can add a missing cheese in 10 seconds:
  - Maker name
  - Cheese name
  - Select Type (or add a new one)
  - Optional Fat %
  - Optional photo upload

---

## 7. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT APPS                          │
│                                                        │
│   Web App (Next.js / React)   Future Mobile App        │
│   [Tailored to your design]   [React Native / Expo]    │
└───────────────────────────▲────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────┴────────────────────────────┐
│                    API SERVER                          │
│                                                        │
│   Node.js (TypeScript) + Fastify (or Express) + Prisma │
│   - Auth Controller (JWT / Session)                    │
│   - Cheese Catalog & Search (Fuzzy search by maker/type│
│   - Log & Review Controller (0-5 stars, text, photos)  │
│   - User Profile & Stats (Top 4, histogram)            │
│   - Image Upload (Local or Cloudflare R2 / S3)         │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                    DATABASE                            │
│                                                        │
│   PostgreSQL 16 (Relational integrity, pg_trgm search) │
└────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Roadmap

### Phase 1: Database & Seed Engine (In Progress)
1. Initialize backend project with PostgreSQL & Prisma ORM.
2. Run database migrations for the lean schema.
3. Build the Wikipedia description fetcher for cheese types.
4. Seed baseline types and popular commercial/artisan cheeses.

### Phase 2: Core Backend REST API
1. **Auth Endpoints**: Register, Login, Current User (`/api/auth`).
2. **Catalog & Search Endpoints**:
   - `GET /api/cheeses`: Search by query, filter by maker or type.
   - `POST /api/cheeses`: Quick-add missing cheese (Maker + Type + optional Fat % + Photo).
   - `GET /api/types`: List cheese types with Wikipedia descriptions.
3. **Diary & Logging Endpoints**:
   - `POST /api/logs`: Log cheese (0–5 stars, review, photo, date, like).
   - `GET /api/logs`: User diary feed.
   - `DELETE /api/logs/:id`, `PATCH /api/logs/:id`.
4. **Profile & Stats Endpoints**:
   - `GET /api/users/:username`: Top 4 cheeses, rating distribution histogram, log counts.
   - `POST /api/users/favorites`: Update Top 4.
5. **Wishlist & Lists Endpoints**: Want-to-taste toggle, custom list CRUD.

### Phase 3: Web Application (Design Dictated by You)
1. Integrate your desired visual layout, color palette, and styling.
2. Build the Search & Discovery view (clean cards by Maker and Type).
3. Build the Cheese Details view (Wikipedia summary, average rating, community reviews).
4. Build the Log Modal (simple 0–5 stars, review box, photo upload).
5. Build the Profile Dashboard (Top 4 showcase, rating histogram, diary feed).

### Phase 4: Social Feeds & Lists
1. Follow other users, friend activity feed.
2. Curated community lists.

### Phase 5: Mobile Companion App
1. Standalone React Native (Expo) app connected to the same API server.
2. Camera barcode scanner and quick on-the-go logging.
