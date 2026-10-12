import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fetchWikipediaCheeseSummary } from "../src/services/wikipedia.service.js";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🧀 Starting Cheeseboxd database seeding...");

  // 1. Seed Cheese Types with Wikipedia descriptions
  const typesToSeed = [
    { name: "Cheddar", wikiTitle: "Cheddar cheese" },
    { name: "Cottage", wikiTitle: "Cottage cheese" },
    { name: "Brie", wikiTitle: "Brie" },
    { name: "Gouda", wikiTitle: "Gouda cheese" },
    { name: "Parmesan", wikiTitle: "Parmigiano Reggiano" },
    { name: "Mozzarella", wikiTitle: "Mozzarella" },
    { name: "Feta", wikiTitle: "Feta" },
    { name: "Blue", wikiTitle: "Blue cheese" },
    { name: "Ricotta", wikiTitle: "Ricotta" },
    { name: "Gruyère", wikiTitle: "Gruyère cheese" },
    { name: "Manchego", wikiTitle: "Manchego" },
    { name: "Camembert", wikiTitle: "Camembert" },
    { name: "Halloumi", wikiTitle: "Halloumi" },
    { name: "Gorgonzola", wikiTitle: "Gorgonzola" },
    { name: "Roquefort", wikiTitle: "Roquefort" },
  ];

  const typeMap = new Map<string, string>();

  for (const item of typesToSeed) {
    const slug = slugify(item.name);
    console.log(`Fetching Wikipedia summary for type: ${item.name}...`);
    const wikiData = await fetchWikipediaCheeseSummary(item.wikiTitle);

    const record = await prisma.cheeseType.upsert({
      where: { name: item.name },
      update: {
        description: wikiData?.extract || null,
        wikipediaUrl: wikiData?.wikipediaUrl || null,
        thumbnailUrl: wikiData?.thumbnailUrl || null,
      },
      create: {
        name: item.name,
        slug,
        description: wikiData?.extract || null,
        wikipediaUrl: wikiData?.wikipediaUrl || null,
        thumbnailUrl: wikiData?.thumbnailUrl || null,
      },
    });

    typeMap.set(item.name, record.id);
  }

  console.log(`✅ Seeded ${typeMap.size} cheese types with Wikipedia descriptions.`);

  // 2. Seed Cheeses (Maker + Type + optional Fat %)
  const cheesesToSeed = [
    {
      name: "Classic 5% Cottage Cheese",
      maker: "Tnuva",
      typeName: "Cottage",
      fatPercentage: 5.0,
      description: "Israel's iconic curd cheese. Perfect balance of creamy moisture and distinct firm curds.",
      imageUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Rich 9% Cottage Cheese",
      maker: "Tnuva",
      typeName: "Cottage",
      fatPercentage: 9.0,
      description: "Heavy cream, rich and luxurious texture with large soft curds.",
      imageUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Organic Whole Milk 4% Cottage Cheese",
      maker: "Good Culture",
      typeName: "Cottage",
      fatPercentage: 4.0,
      description: "Thick, probiotic-rich cultured cottage cheese with no gums or chemical stabilizers.",
      imageUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Lowfat 2% Small Curd Cottage",
      maker: "Breakstone's",
      typeName: "Cottage",
      fatPercentage: 2.0,
      description: "Classic American supermarket staple, tangy and light small curd.",
      imageUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Extra Sharp White Cheddar (Naturally Aged)",
      maker: "Cabot",
      typeName: "Cheddar",
      fatPercentage: null,
      description: "Aged for a minimum of 1 year, intensely tangy with pleasant calcium lactate crystal crunches.",
      imageUrl: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Aged Pure Irish Cheddar",
      maker: "Kerrygold",
      typeName: "Cheddar",
      fatPercentage: null,
      description: "Grass-fed cow's milk cheddar from Ireland. Rich golden hue, buttery and sharp.",
      imageUrl: "https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Double Cream Brie",
      maker: "President",
      typeName: "Brie",
      fatPercentage: null,
      description: "Silky, buttery French-style soft cheese with an edible bloomy white rind.",
      imageUrl: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Harbison (Spruce Bark-Wrapped)",
      maker: "Jasper Hill Farm",
      typeName: "Brie",
      fatPercentage: null,
      description: "Bloomy-rind cheese wrapped in spruce bark cambium. Spoonable, woodsy, mustardy.",
      imageUrl: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Classic Aged Gouda (8 Months)",
      maker: "Old Amsterdam",
      typeName: "Gouda",
      fatPercentage: null,
      description: "Smooth caramel notes with fine ripening crystals and a firm, crumbly bite.",
      imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "XO 26-Month Extra Aged Gouda",
      maker: "Beemster",
      typeName: "Gouda",
      fatPercentage: null,
      description: "Deep butterscotch sweetness, whiskey undertones, and crunchy umami crystals.",
      imageUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Authentic Parmigiano-Reggiano 24-Month",
      maker: "Consorzio Parmigiano",
      typeName: "Parmesan",
      fatPercentage: null,
      description: "DOP certified from Emilia-Romagna. Intense umami, crumbly texture, crystalline crunch.",
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Traditional Greek Feta (P.D.O)",
      maker: "Dodoni",
      typeName: "Feta",
      fatPercentage: null,
      description: "Authentic Greek sheep and goat milk feta. Tangy, salty, creamy crumbly brine.",
      imageUrl: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Roquefort Black Label",
      maker: "Papillon",
      typeName: "Roquefort",
      fatPercentage: null,
      description: "Cave-aged raw sheep's milk blue cheese. Intensely mineral, salty, creamy, and pungent.",
      imageUrl: "https://images.unsplash.com/photo-1625085576340-9a8c0817e4f1?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const cheeseRecords = [];
  for (const c of cheesesToSeed) {
    const slug = slugify(`${c.maker}-${c.name}`);
    const typeId = typeMap.get(c.typeName) || null;

    const record = await prisma.cheese.upsert({
      where: { slug },
      update: {
        name: c.name,
        maker: c.maker,
        typeId,
        fatPercentage: c.fatPercentage,
        description: c.description,
        imageUrl: c.imageUrl,
      },
      create: {
        name: c.name,
        slug,
        maker: c.maker,
        typeId,
        fatPercentage: c.fatPercentage,
        description: c.description,
        imageUrl: c.imageUrl,
      },
    });
    cheeseRecords.push(record);
  }

  console.log(`✅ Seeded ${cheeseRecords.length} curated cheeses.`);

  // 3. Seed a Demo User
  const passwordHash = await bcrypt.hash("password123", 10);
  const demoUser = await prisma.user.upsert({
    where: { username: "curdlover" },
    update: {
      passwordHash,
      displayName: "Gouda Guy",
      bio: "Rating every cottage cheese and aged cheddar on earth. 🧀",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      location: "Amsterdam / Tel Aviv",
    },
    create: {
      username: "curdlover",
      email: "cheese@cheeseboxd.com",
      passwordHash,
      displayName: "Gouda Guy",
      bio: "Rating every cottage cheese and aged cheddar on earth. 🧀",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      location: "Amsterdam / Tel Aviv",
    },
  });

  console.log(`✅ Seeded demo user: ${demoUser.username} (${demoUser.email})`);

  // 4. Seed User's Top 4 Favorites
  const top4Cheeses = [
    cheeseRecords.find((c) => c.slug.includes("harbison")) || cheeseRecords[0],
    cheeseRecords.find((c) => c.slug.includes("tnuva-classic-5")) || cheeseRecords[1],
    cheeseRecords.find((c) => c.slug.includes("beemster")) || cheeseRecords[2],
    cheeseRecords.find((c) => c.slug.includes("parmigiano")) || cheeseRecords[3],
  ];

  for (let i = 0; i < 4; i++) {
    if (top4Cheeses[i]) {
      await prisma.userFavorite.upsert({
        where: {
          userId_position: {
            userId: demoUser.id,
            position: i + 1,
          },
        },
        update: { cheeseId: top4Cheeses[i].id },
        create: {
          userId: demoUser.id,
          position: i + 1,
          cheeseId: top4Cheeses[i].id,
        },
      });
    }
  }

  console.log("✅ Seeded Top 4 Favorites.");

  // 5. Seed Logs (Letterboxd Style: 0-5 stars, reviews, photos, dates, likes)
  const sampleLogs = [
    {
      cheeseSlug: "jasper-hill-farm-harbison-spruce-bark-wrapped",
      rating: 5.0,
      isLiked: true,
      reviewText: "An absolute masterpiece. Cut the top rind off and dip crusty sourdough straight into it. Woodsy, bacon-y, buttery heaven.",
      consumedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Yesterday
    },
    {
      cheeseSlug: "tnuva-classic-5-cottage-cheese",
      rating: 4.5,
      isLiked: true,
      reviewText: "The gold standard of cottage cheese. Salt level is dialed in and the curds retain great firmness.",
      consumedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      cheeseSlug: "beemster-xo-26-month-extra-aged-gouda",
      rating: 5.0,
      isLiked: true,
      reviewText: "Those crunchy tyrosine crystals are addictive. Rich butterscotch sweetness paired with a stout.",
      consumedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      cheeseSlug: "cabot-extra-sharp-white-cheddar-naturally-aged",
      rating: 4.0,
      isLiked: true,
      reviewText: "Reliable, sharp punch. Best bang for buck snacking cheddar.",
      consumedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
    {
      cheeseSlug: "breakstones-lowfat-2-small-curd-cottage",
      rating: 2.5,
      isLiked: false,
      reviewText: "A bit watery compared to Good Culture or Tnuva. Curds are somewhat mushy.",
      consumedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    },
    {
      cheeseSlug: "president-double-cream-brie",
      rating: 3.5,
      isLiked: false,
      reviewText: "Decent supermarket brie, nice melt when baked with honey, but lacks farmhouse complexity.",
      consumedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    },
  ];

  for (const log of sampleLogs) {
    const cheese = cheeseRecords.find((c) => c.slug === log.cheeseSlug);
    if (cheese) {
      // Delete any existing log for this specific demo pairing to avoid duplicates
      await prisma.cheeseLog.create({
        data: {
          userId: demoUser.id,
          cheeseId: cheese.id,
          rating: log.rating,
          isLiked: log.isLiked,
          reviewText: log.reviewText,
          consumedAt: log.consumedAt,
          photoUrl: cheese.imageUrl,
        },
      });
    }
  }

  console.log(`✅ Seeded ${sampleLogs.length} cheese logs.`);

  // 6. Seed a Custom List
  const list = await prisma.customList.create({
    data: {
      userId: demoUser.id,
      title: "Top Supermarket Cheeses That Punch Above Their Weight",
      description: "My favorite accessible cheeses you can grab at any grocery store.",
      isRanked: true,
      items: {
        create: [
          { cheeseId: cheeseRecords[0].id, position: 1, notes: "Unbeatable cottage staple" },
          { cheeseId: cheeseRecords[4].id, position: 2, notes: "The sharpest fridge block" },
          { cheeseId: cheeseRecords[8].id, position: 3, notes: "Always reliable aged gouda" },
        ],
      },
    },
  });

  console.log(`✅ Seeded custom list: "${list.title}"`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
