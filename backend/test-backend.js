const BASE_URL = "http://localhost:4000/api";

async function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log("🧀 Starting End-to-End Backend Verification...\n");

  // 1. Test Healthcheck
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  assert(health.status === "ok", "Healthcheck endpoint is OK");

  // 2. Test Cheese Types with Wikipedia descriptions
  const typesRes = await fetch(`${BASE_URL}/cheeses/types`);
  const typesData = await typesRes.json();
  assert(typesData.types.length >= 10, `Found ${typesData.types.length} cheese types`);
  const cottageType = typesData.types.find((t) => t.name === "Cottage");
  assert(cottageType && cottageType.description.length > 20, "Cottage cheese has Wikipedia description");
  console.log(`   Sample Wikipedia Summary for Cottage: "${cottageType.description.slice(0, 85)}..."`);

  // 3. Test Cheese Catalog Search by Maker & Type
  // 3a. Search by Maker
  const tnuvaRes = await fetch(`${BASE_URL}/cheeses?maker=Tnuva`);
  const tnuvaData = await tnuvaRes.json();
  assert(tnuvaData.items.length >= 2, `Found ${tnuvaData.items.length} Tnuva cheeses by Maker filter`);
  assert(tnuvaData.items.every((c) => c.maker === "Tnuva"), "All returned cheeses are made by Tnuva");

  // 3b. Search by Type
  const cottageCheesesRes = await fetch(`${BASE_URL}/cheeses?type=Cottage`);
  const cottageData = await cottageCheesesRes.json();
  assert(cottageData.items.length >= 4, `Found ${cottageData.items.length} cottage cheeses across multiple brands`);
  console.log(`   Makers with cottage cheese in DB: ${[...new Set(cottageData.items.map(c => c.maker))].join(", ")}`);

  // 3c. Filter by Fat Percentage (4% to 9%)
  const fatRes = await fetch(`${BASE_URL}/cheeses?minFat=4&maxFat=9`);
  const fatData = await fatRes.json();
  assert(fatData.items.length >= 3, `Found ${fatData.items.length} cheeses between 4% and 9% fat`);
  assert(fatData.items.every((c) => c.fatPercentage >= 4 && c.fatPercentage <= 9), "Fat percentages strictly within 4-9%");

  // 4. Test Single Cheese Profile with Letterboxd Rating Histogram
  const singleCheeseRes = await fetch(`${BASE_URL}/cheeses/tnuva-classic-5-cottage-cheese`);
  const singleCheese = await singleCheeseRes.json();
  assert(singleCheese.name === "Classic 5% Cottage Cheese", "Retrieved single cheese by slug");
  assert(singleCheese.maker === "Tnuva", "Cheese maker is correct");
  assert(singleCheese.fatPercentage === 5, "Fat percentage is 5.0%");
  assert(singleCheese.stats.ratingHistogram !== undefined, "Contains Letterboxd 10-bucket rating histogram");
  assert(typeof singleCheese.stats.avgRating === "number", `Average rating computed: ${singleCheese.stats.avgRating} stars`);

  // 5. Test Auth: Login with Demo User
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernameOrEmail: "curdlover",
      password: "password123",
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok && loginData.token, "Logged in successfully and received JWT");
  const token = loginData.token;

  // 6. Test Logging a Cheese (0-5 stars, review, photo, like)
  const cabotCheese = (await (await fetch(`${BASE_URL}/cheeses?q=Cabot`)).json()).items[0];
  const newLogRes = await fetch(`${BASE_URL}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      cheeseId: cabotCheese.id,
      rating: 4.5,
      isLiked: true,
      reviewText: "Testing fresh log entry: incredible sharp cheddar crunch!",
      consumedAt: new Date().toISOString(),
    }),
  });
  const newLog = await newLogRes.json();
  assert(newLogRes.status === 201 && newLog.log.rating === 4.5, "Created new cheese log with 4.5 stars and review");

  // 7. Test User Profile Behavior (Top 4 favorites, rating distribution, stats)
  const profileRes = await fetch(`${BASE_URL}/users/curdlover`);
  const profile = await profileRes.json();
  assert(profile.user.username === "curdlover", "Retrieved user profile");
  assert(profile.top4.length === 4, `Top 4 cheeses display populated (count: ${profile.top4.length})`);
  console.log(`   Top 4 Cheeses: ${profile.top4.map(f => `#${f.position} ${f.cheese.maker} ${f.cheese.name}`).join(" | ")}`);
  assert(profile.stats.ratingHistogram["4.5"] >= 1, "Rating histogram dynamically updated with 4.5 star log");
  assert(profile.stats.totalLogs >= 6, `Total logs count: ${profile.stats.totalLogs}`);
  console.log(`   Top styles by user: ${profile.stats.topTypes.map(t => `${t.name} (${t.count})`).join(", ")}`);
  console.log(`   Top makers by user: ${profile.stats.topMakers.map(m => `${m.name} (${m.count})`).join(", ")}`);

  // 8. Test Wishlist ("Want to Taste")
  const roquefortCheese = (await (await fetch(`${BASE_URL}/cheeses?q=Roquefort`)).json()).items[0];
  const wishToggleRes = await fetch(`${BASE_URL}/wishlist/${roquefortCheese.id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const wishToggle = await wishToggleRes.json();
  assert(wishToggle.isWishlisted === true, "Added cheese to Wishlist");

  const wishListRes = await fetch(`${BASE_URL}/wishlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const wishlist = await wishListRes.json();
  assert(wishlist.items.some((w) => w.cheese.id === roquefortCheese.id), "Cheese confirmed in user wishlist");

  // 9. Test Quick-Add a New Cheese with Auto-Wikipedia Type Extraction
  const quickAddRes = await fetch(`${BASE_URL}/cheeses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Truffle Infused Gouda Wheel",
      maker: "Landana",
      typeName: "Gouda",
      fatPercentage: null,
      description: "Creamy Dutch Gouda packed with real black summer truffles.",
      imageUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=600&q=80",
    }),
  });
  const quickAdd = await quickAddRes.json();
  assert(quickAddRes.status === 201 && quickAdd.cheese.maker === "Landana", "Quick-added new cheese (Maker + Type + Description)");

  console.log("\n🧀 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
