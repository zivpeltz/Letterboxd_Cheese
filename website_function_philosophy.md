# Website Function & Philosophy Specification: Cheeseboxd
*The definitive blueprint for the frontend design, layout, component hierarchy, and dynamic behavior—modeled after Letterboxd.*

---

## 1. Executive Vision & Core Philosophy

### 1.1. The Letterboxd Paradigm Translated to Cheese
Letterboxd achieved cult status because it is not just a database; it is a **visual journal and personal taste identity platform**. Users don't visit Letterboxd just to look up a movie—they visit to:
1. Show off their **curated Top 4**.
2. Keep an intimate, chronological **diary** of their experiences.
3. Compare their personal rating against the **community rating histogram**.
4. Browse aesthetically pleasing **posters** with minimal, high-contrast typography.

**Cheeseboxd** applies this exact sensory addiction to cheese. Every wedge, block, and tub of cheese is treated with the same visual reverence that Letterboxd grants to cinema.

### 1.2. Explicit Architectural Directives
* **Strictly Dynamic (No Static HTML)**: The frontend is built as a reactive, modern Single-Page Application (SPA) using **React + TypeScript + Vite**. All interactions (rating stars, liking, wishlisting, modal opens, filtering, searching) happen smoothly on the client side with optimistic UI updates and live API connectivity to the local data server.
* **Exclusion of the Journal Tab**: As ordered, the editorial/magazine/blog "Journal" section from Letterboxd is **completely omitted**. The focus remains 100% on cataloging, logging, profiles, lists, and community discovery.

---

## 2. Visual Design System: Exact Letterboxd DNA

### 2.1. Color Palette (Dark Mode Mastery)
Letterboxd is famous for its dark, low-fatigue slate canvas that lets poster artwork shine. Cheeseboxd adopts this exact matte charcoal system, paired with warm cheese-gold and wine accents:

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#14181c` | The foundational dark matte canvas of the entire site. |
| `--bg-surface` | `#1b2228` | Cards, navigation bars, dropdown panels, and modal backdrops. |
| `--bg-elevated` | `#242c34` | Hover states, active tabs, input fields, and pill badges. |
| `--border-subtle` | `#2c3440` | 1px clean dividers, card borders, and table borders. |
| `--border-focus` | `#445566` | Active input borders, highlighted card outlines on hover. |
| `--text-primary` | `#ffffff` | Pure white for headers, cheese names, and active states. |
| `--text-secondary` | `#9ab0c4` | Cool slate for descriptions, metadata, and labels. |
| `--text-muted` | `#678096` | Dimmed text for timestamps, secondary labels, and footers. |
| `--accent-gold` | `#e5a93b` | Primary cheese rating stars, average score badge, primary buttons. |
| `--accent-green` | `#00e054` | Classic Letterboxd logged indicator and review confirmation. |
| `--accent-orange` | `#ff8000` | High-energy highlights, interactive heart likes, and tags. |
| `--accent-blue` | `#40bcf4` | Hyperlinks, member profile badges, and active filter states. |

### 2.2. Typography & Micro-Layout Rules
* **Font Family**: Modern, geometric sans-serif (`Inter`, system-ui, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`).
* **Letterboxd Section Headers**: All section titles (e.g. `POPULAR THIS WEEK`, `JUST REVIEWED`, `RATINGS`, `TOP FOUR`) must follow Letterboxd's signature uppercase styling:
  * `font-size: 0.75rem (12px)`
  * `font-weight: 700`
  * `letter-spacing: 0.08em`
  * `text-transform: uppercase`
  * `color: var(--text-secondary)`
  * `border-bottom: 1px solid var(--border-subtle)` with bottom padding.
* **Spacing & Container**: Centered container with max-width `1024px` to `1180px`, giving that cozy, focused desktop presentation characteristic of Letterboxd.

### 2.3. The Cheese "Poster" Card
In Letterboxd, the movie poster is sacred. In Cheeseboxd, every cheese is represented by a **vertical portrait poster card**:
* **Aspect Ratio**: `2:3` or `3:4` portrait ratio.
* **Border & Corners**: `border-radius: 4px`, `border: 1px solid rgba(255, 255, 255, 0.1)`.
* **Hover Micro-Interactions**:
  * Scale transformation: `transform: translateY(-3px)`.
  * Glowing border: Border transitions to `--accent-gold` or `--border-focus`.
  * **Overlay Action Shroud**: Hovering reveals a translucent dark overlay displaying:
    * Quick-action icons: 👁️ (Log), ❤️ (Like), 🕒 (Wishlist).
    * Average community rating (e.g., `★ 4.2`).
* **Fallback Placard**: If no image exists, render an artisanal typographic badge displaying the Cheese Type and Maker on a brushed slate gradient.

---

## 3. Global Navigation Anatomy

The navigation bar is fixed at the top, dark, semi-translucent (`backdrop-filter: blur(12px)`), with a slim `60px` height.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  🧀 CHEESEBOXD     CHEESES    LISTS    MEMBERS      [🔍 Search]   + LOG   (Avatar)│
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Logo**: Stylized icon + wordmark `"CHEESEBOXD"` (clean, modern bold lettering).
2. **Main Navigation**:
   * **`CHEESES`**: Browse catalog by popularity, type, maker, or fat %.
   * **`LISTS`**: Curated ranked and unranked lists by members.
   * **`MEMBERS`**: Discover users and community activity.
   * *(Note: `JOURNAL` is excluded as requested).*
3. **Right-Side Controls**:
   * **Instant Search Bar**: Debounced dynamic search input. Typing immediately opens a floating flyout dropdown showing matches partitioned by **Cheeses**, **Makers**, and **Types**.
   * **`+ LOG` Action Button**: A vibrant green/gold pill button (`+ LOG`) accessible on every single page. Clicking it opens the universal Quick-Log Modal without leaving the current view.
   * **User Avatar / Profile Dropdown**:
     * If logged in: User avatar with dropdown menu: *Profile, Diary, Reviews, Wishlist, Lists, Settings, Log Out*.
     * If logged out: `Sign In` / `Create Account` buttons that trigger dynamic modal overlays.

---

## 4. Comprehensive Page-by-Page Specifications

### 4.1. The Homepage (`/`)
The homepage balances high-aesthetic discovery with active community discourse.

1. **Hero Welcome Shroud (For Guests)**:
   * Atmospheric dark background with subtle warm lighting.
   * Headline: *"Track cheeses you've tasted. Save those you want to try. Tell your friends what's good."*
   * Call to action: `Get Started — It's Free` + showcase of the Top 4 of the Week.
2. **Popular This Week (Poster Ribbon)**:
   * Horizontal row of 6 cheese poster cards showing the most-logged cheeses of the past 7 days.
   * Letterboxd-style hover cards showing community score.
3. **Just Reviewed (The Activity Stream)**:
   * Two-column feed of the latest written reviews:
     * Reviewer avatar + username.
     * Star rating (`★ ★ ★ ★ ½`) + Heart if liked.
     * Review excerpt with link to full review.
     * Cheese poster thumbnail + Maker + Type on the right.
4. **Popular Curated Lists**:
   * Grid of 3–4 custom lists featuring Letterboxd’s iconic **5-poster fanned stack** visual treatment (e.g., *"Top Supermarket Cottage Cheeses Ranked"*, *"Sharpest Aged Cheddars"*).
5. **Types Showcase Grid**:
   * Quick filter chips for major cheese varieties: *Cottage, Cheddar, Brie, Gouda, Parmesan, Feta, Blue, Mozzarella*.

---

### 4.2. Cheeses Catalog & Discovery Page (`/cheeses`)

Modeled directly on Letterboxd’s `/films` browsing hub.

1. **Sub-Navigation Filter Bar**:
   * Sort by: `Popular`, `Rating`, `Alphabetical`, `Newest Added`.
   * **Type Selector**: Dropdown to filter by *Cottage, Cheddar, Brie, Gouda, etc.*
   * **Maker Selector**: Dropdown to filter by creamery/brand (*Tnuva, Cabot, Kerrygold, Good Culture, President*).
   * **Fat % Range Filter**: Sliders or quick pill filters (*Under 4%*, *4%–9%*, *Full Fat*).
2. **Poster Grid**:
   * High-density responsive grid (4–6 columns on desktop, 2–3 on mobile).
   * Under each poster: Cheese Name, Maker, and Star Rating.
3. **Quick-View Hover Modal**:
   * Holding hover opens a mini-popover with the Wikipedia excerpt for that cheese's style.

---

### 4.3. Single Cheese Profile Page (`/cheeses/:slug`)

This is the centerpiece of the application—Letterboxd's movie page translated to cheese.

```
┌────────────────────────────────────────────────────────────────────────┐
│  [ CHEESE POSTER ]     CABOT EXTRA SHARP WHITE CHEDDAR                 │
│  [                ]     Maker: Cabot Creamery • Type: Cheddar          │
│                         ★ ★ ★ ★ ☆  4.2  (1,420 logs)                    │
│  ┌───────────────┐     ─────────────────────────────────────────────── │
│  │  + LOG CHEESE │     "Cheddar cheese is a relatively hard, off-white │
│  │  ❤️ Liked     │     natural cheese originated in the village..."    │
│  │  🕒 Wishlist  │     — Wikipedia                                     │
│  │  📋 Add to List│                                                    │
│  └───────────────┘     RATINGS (Histogram)                             │
│                         █ █ █ █ █ █ █ █ █ █                            │
│                        0.5               5.0                           │
│                                                                        │
│                        RECENT REVIEWS BY MEMBERS                       │
│                        [Avatar] CurdLover: "Insane crunch crystals!"   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Left Action Column**:
   * **Cheese Poster / Packaging Card**: Large, crisp image with subtle shadow.
   * **Action Panel**:
     * Large green/gold `+ Log Cheese` button.
     * Interactive `❤️ Like` toggle button.
     * Interactive `🕒 Want to Taste` (Wishlist) toggle button.
     * `📋 Add to List` button.
     * **Interactive Personal Rating Widget**: 5 empty star slots that fill on hover with 0.5-star precision.
2. **Center / Main Details Column**:
   * **Title & Subheading**: Cheese Name in large bold serif/sans, with Maker and Type clearly indicated.
   * **Specs Line**: Maker: `Cabot Creamery` | Type: `Cheddar` | Fat: `Optional %` (e.g. `5.0%`).
   * **Wikipedia Summary Card**: Concise 2–3 sentence encyclopedic description with *"Read more on Wikipedia"* link.
   * **The Letterboxd Rating Distribution Histogram**:
     * The iconic **10-bar vertical histogram** showing community distribution from `0.5` to `5.0` stars. Hovering any bar reveals the exact vote count.
   * **Community Reviews Stream**:
     * Member avatar, username, star rating, like flag, review text, and timestamp.
     * Like button on reviews.

---

### 4.4. The Universal "+ LOG" Modal Overlay

A floating, backdrop-blurred modal window accessible anywhere on the site with zero page reloads.

1. **Cheese Identification**:
   * If opened from a cheese page: Pre-populates the cheese poster and title.
   * If opened globally: Includes an instant search input to pick which cheese was eaten.
2. **Log Fields**:
   * **Date Consumed**: Defaults to "Today" with an inline date-picker.
   * **0 to 5 Star Rating**: Interactive star selector with half-star hover states.
   * **Like Toggle**: Heart icon that illuminates in vibrant orange/red.
   * **First Taste Checkbox**: *"I've tasted this cheese before"* toggle.
   * **Review Textarea**: *"Add a review..."* (supports multiline text).
   * **Photo URL / Upload**: Optional picture of the cheese cut or packaging.
3. **Buttons**:
   * `Save Log`: Submits instantly to `/api/logs`, closes modal, and immediately updates the cheese histogram and user diary with optimistic rendering.
   * `Cancel`: Closes modal without saving.

---

### 4.5. User Profile Dashboard (`/users/:username`)

The personal shrine of cheese taste.

1. **Profile Banner & Identity**:
   * Large avatar, Display Name, `@username`, Location, and Bio (*"Rating every cottage cheese and aged cheddar on earth"*).
   * **Stats Counter Bar**:
     * Total Cheeses Logged
     * Unique Varieties Tasted
     * Total Reviews
     * Wishlist Count
     * Lists Count
2. **The Iconic "Top 4" (Favorite Cheeses)**:
   * Four large, framed poster slots displayed prominently side-by-side.
   * If viewing own profile: Interactive "Edit Favorites" button opens a search modal allowing the user to select and reorder their Top 4.
3. **Personal Rating Distribution Histogram**:
   * The user's own 10-bucket rating curve (`0.5` through `5.0` stars).
4. **Palate Insights**:
   * *"Favorite Styles"*: Auto-calculated badges (e.g. `1. Cottage (8)`, `2. Cheddar (5)`, `3. Gouda (4)`).
   * *"Favorite Makers"*: (e.g. `1. Tnuva (6)`, `2. Cabot (4)`, `3. Good Culture (3)`).
5. **Profile Sub-Tabs**:
   * **Profile**: Overview described above.
   * **Diary**: Chronological table view.
   * **Reviews**: All written text reviews.
   * **Wishlist**: Grid of cheeses marked "Want to Taste".
   * **Lists**: Custom lists created by this member.

---

### 4.6. The Diary Tab (`/users/:username/diary`)

A faithful recreation of Letterboxd's chronological film diary:
* Organized into **Year** and **Month** headers (e.g., `OCTOBER 2026`).
* Clean tabular layout:
  * **Day**: Calendar day number (e.g., `12`).
  * **Cheese Thumbnail**: Mini-poster thumbnail.
  * **Cheese Name & Maker**: Clickable link to cheese page.
  * **Type Badge**: E.g., `Cottage 5%`.
  * **Rating**: Rendered stars (`★ ★ ★ ★ ½`).
  * **Like**: Orange heart if liked.
  * **Review**: Pen icon if a text review was written (clicking opens review popover).

---

### 4.7. Wishlist / "Want to Taste" (`/users/:username/wishlist`)

* Clean poster grid of all bookmarked cheeses.
* Allows quick-logging straight from the wishlist (logging automatically prompts to keep or remove from wishlist).

---

### 4.8. Lists & List Builder (`/lists`)

* Browse curated ranked and unranked lists.
* **List Builder Modal**:
  * Title and description.
  * `Ranked List` toggle (adds numbered 1, 2, 3 badges).
  * Live search to add cheeses.
  * Drag-and-drop or position ordering.

---

## 5. Dynamic State & Client-Side Behavior (No Static HTML)

To fulfill the dynamic web app requirement:
1. **React State & Query Layer**:
   * Fast client-side routing (React Router) with zero full-page browser reloads.
   * Centralized Auth Context maintaining JWT tokens, current user session, and Top 4 state.
2. **Optimistic UI Updates**:
   * Clicking the **Like** heart toggles state in `<50ms` and updates backend asynchronously.
   * Rating a cheese immediately redraws the user's stars and increments the histogram.
3. **Interactive Star Rating Component**:
   * Tracks mouse position over 5 star SVGs to split each star into left-half (0.5) and right-half (1.0).
   * Hover preview highlights stars in glowing gold; clicking locks the score.
4. **Live Debounced Global Search**:
   * As the user types in the navigation bar search input, an animated dropdown appears after 200ms showing instant categorized results without navigating away.
5. **Modals with Focus Trapping & URL Syncing**:
   * The `+ LOG` modal and `Sign In` modal run via React Portals with smooth CSS transitions (`opacity`, `scale`).

---

## 6. Frontend Tech Stack & Implementation Plan

* **Framework**: React 18+ with TypeScript
* **Tooling / Bundler**: Vite (lightning fast, modern ES modules, zero bloat)
* **Styling**: Vanilla CSS with comprehensive CSS Design Tokens (`src/index.css`) for ultimate flexibility, rich dark mode aesthetics, and 100% control over Letterboxd visual parity.
* **Icons**: Feather / Lucide icons (Star, Heart, Clock, Search, Plus, User, List, Menu).
* **API Connector**: Typed fetch client targeting `http://localhost:4000/api`.

---

## 7. Compliance Checklist

- [x] Exact Letterboxd visual aesthetic (matte charcoal slate `#14181c`, orange/gold accents, poster cards).
- [x] 10-bar Letterboxd rating distribution histogram.
- [x] Iconic Top 4 favorite cheeses showcase on profiles.
- [x] Global fixed navigation with `+ LOG` quick action.
- [x] Fully dynamic client-side architecture (React + TypeScript).
- [x] Seamless search by Maker, Type, and combined queries.
- [x] Cheese model strictly adheres to **Maker + Type + optional Fat % + Wikipedia summary**.
- [x] **Journal tab explicitly excluded**.
