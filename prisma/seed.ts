import { PrismaClient, Gender, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type Shape = "sneaker" | "runner" | "slipon" | "boot" | "flat" | "tee" | "hoodie" | "shorts" | "sock" | "insole" | "kit" | "bag";

const TREE: Record<string, { name: string; subs: [slug: string, name: string][] }> = {
  "mens-footwear": { name: "Men's Footwear", subs: [["mens-everyday", "Everyday Sneakers"], ["mens-running", "Running Shoes"], ["mens-slip-ons", "Slip-ons"], ["mens-all-weather", "All-Weather"]] },
  "womens-footwear": { name: "Women's Footwear", subs: [["womens-everyday", "Everyday Sneakers"], ["womens-running", "Running Shoes"], ["womens-flats", "Flats"], ["womens-all-weather", "All-Weather"]] },
  apparel: { name: "Apparel & Basics", subs: [["merino-tees", "Merino Wool Tees"], ["hoodies", "Hoodies"], ["active-shorts", "Active Shorts"], ["socks", "Socks"]] },
  accessories: { name: "Accessories & Care", subs: [["insoles", "Insoles"], ["care-kits", "Shoe Care Kits"], ["travel-bags", "Travel Bags"]] },
};

const COLORWAYS = {
  slate: ["Basalt", "#2B3136"], forest: ["Fern", "#3E5641"], stone: ["Chalk", "#E9E4DA"], ember: ["Ember", "#B4532A"],
  fog: ["Fog", "#9AA3A6"], moss: ["Moss", "#6B7A4B"], ink: ["Ink", "#1B2230"], sand: ["Dune", "#C8B08A"],
} as const;
type ColorKey = keyof typeof COLORWAYS;

const MENS = ["8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"];
const WOMENS = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "9", "10"];
const APPAREL = ["XS", "S", "M", "L", "XL"];
const SOCKS = ["S", "M", "L"];
const OS = ["One Size"];

interface Seed {
  name: string; tagline: string; cat: string; gender: Gender; price: number; shape: Shape;
  materials: string[]; eco: number; carbon: number; colors: ColorKey[]; sizes: string[];
}

const P: Seed[] = [
  { name: "Ridgeline Trainer", tagline: "The everyday shoe, re-engineered.", cat: "mens-everyday", gender: "MEN", price: 11500, shape: "sneaker", materials: ["Merino Wool", "Sugarcane EVA"], eco: 82, carbon: 7.4, colors: ["slate", "stone", "forest"], sizes: MENS },
  { name: "Ridgeline Trainer", tagline: "The everyday shoe, re-engineered.", cat: "womens-everyday", gender: "WOMEN", price: 11500, shape: "sneaker", materials: ["Merino Wool", "Sugarcane EVA"], eco: 82, carbon: 7.4, colors: ["stone", "fog", "ember"], sizes: WOMENS },
  { name: "Canopy Knit Low", tagline: "Breathable eucalyptus knit for warm days.", cat: "mens-everyday", gender: "MEN", price: 10500, shape: "sneaker", materials: ["Eucalyptus Fiber", "Natural Rubber"], eco: 88, carbon: 5.9, colors: ["fog", "moss", "ink"], sizes: MENS },
  { name: "Canopy Knit Low", tagline: "Breathable eucalyptus knit for warm days.", cat: "womens-everyday", gender: "WOMEN", price: 10500, shape: "sneaker", materials: ["Eucalyptus Fiber", "Natural Rubber"], eco: 88, carbon: 5.9, colors: ["stone", "sand", "forest"], sizes: WOMENS },
  { name: "Tempo Runner 2", tagline: "Light, bouncy, built for daily miles.", cat: "mens-running", gender: "MEN", price: 14500, shape: "runner", materials: ["Recycled Polyester", "Sugarcane EVA"], eco: 71, carbon: 9.8, colors: ["ink", "ember", "fog"], sizes: MENS },
  { name: "Tempo Runner 2", tagline: "Light, bouncy, built for daily miles.", cat: "womens-running", gender: "WOMEN", price: 14500, shape: "runner", materials: ["Recycled Polyester", "Sugarcane EVA"], eco: 71, carbon: 9.8, colors: ["stone", "ember", "moss"], sizes: WOMENS },
  { name: "Switchback Trail", tagline: "Grippy lugs for rock, root and mud.", cat: "mens-running", gender: "MEN", price: 15500, shape: "runner", materials: ["Recycled Polyester", "Natural Rubber"], eco: 68, carbon: 10.6, colors: ["forest", "slate"], sizes: MENS },
  { name: "Drift Slip-On", tagline: "Zero laces. Zero fuss.", cat: "mens-slip-ons", gender: "MEN", price: 9500, shape: "slipon", materials: ["Merino Wool", "Castor Bean Oil"], eco: 85, carbon: 6.1, colors: ["slate", "sand", "fog"], sizes: MENS },
  { name: "Harbor Loafer", tagline: "Smart enough for dinner, easy enough for travel.", cat: "mens-slip-ons", gender: "MEN", price: 11000, shape: "slipon", materials: ["Eucalyptus Fiber", "Sugarcane EVA"], eco: 84, carbon: 6.5, colors: ["ink", "stone"], sizes: MENS },
  { name: "Stormline Mid", tagline: "Water-repellent, fleece-lined, trail-ready.", cat: "mens-all-weather", gender: "MEN", price: 16500, shape: "boot", materials: ["Merino Wool", "Bio-based Water Repellent", "Natural Rubber"], eco: 74, carbon: 11.2, colors: ["slate", "forest", "sand"], sizes: MENS },
  { name: "Stormline Mid", tagline: "Water-repellent, fleece-lined, trail-ready.", cat: "womens-all-weather", gender: "WOMEN", price: 16500, shape: "boot", materials: ["Merino Wool", "Bio-based Water Repellent", "Natural Rubber"], eco: 74, carbon: 11.2, colors: ["stone", "moss"], sizes: WOMENS },
  { name: "Luna Flat", tagline: "A ballet flat that finally fits like a sneaker.", cat: "womens-flats", gender: "WOMEN", price: 9800, shape: "flat", materials: ["Recycled Polyester", "Merino Wool"], eco: 80, carbon: 5.2, colors: ["ink", "ember", "stone"], sizes: WOMENS },
  { name: "Alder Mary Jane", tagline: "Strap-secure comfort for all-day wear.", cat: "womens-flats", gender: "WOMEN", price: 10500, shape: "flat", materials: ["Eucalyptus Fiber", "Castor Bean Oil"], eco: 83, carbon: 5.6, colors: ["slate", "sand"], sizes: WOMENS },
  { name: "Merino Base Tee", tagline: "Odor-resistant. Temperature-smart.", cat: "merino-tees", gender: "UNISEX", price: 6800, shape: "tee", materials: ["Merino Wool"], eco: 86, carbon: 3.1, colors: ["slate", "stone", "forest", "ink"], sizes: APPAREL },
  { name: "Trailhead Hoodie", tagline: "Heavyweight comfort from recycled fibers.", cat: "hoodies", gender: "UNISEX", price: 11800, shape: "hoodie", materials: ["Organic Cotton", "Recycled Polyester"], eco: 72, carbon: 8.4, colors: ["fog", "moss", "ink"], sizes: APPAREL },
  { name: "Stride Active Short", tagline: '7" liner short with a secure phone pocket.', cat: "active-shorts", gender: "UNISEX", price: 6200, shape: "shorts", materials: ["Recycled Polyester", "Eucalyptus Fiber"], eco: 70, carbon: 4.3, colors: ["slate", "ember"], sizes: APPAREL },
  { name: "Everyday Crew Sock (3-Pack)", tagline: "Cushioned where it counts.", cat: "socks", gender: "UNISEX", price: 2400, shape: "sock", materials: ["Merino Wool", "Eucalyptus Fiber"], eco: 87, carbon: 1.2, colors: ["stone", "slate", "moss"], sizes: SOCKS },
  { name: "Contour Insole", tagline: "Arch support from castor-bean foam.", cat: "insoles", gender: "UNISEX", price: 3500, shape: "insole", materials: ["Castor Bean Oil", "Merino Wool"], eco: 81, carbon: 1.9, colors: ["fog"], sizes: ["S", "M", "L"] },
  { name: "Field Care Kit", tagline: "Plant-based cleaner, brush and repeller.", cat: "care-kits", gender: "UNISEX", price: 2800, shape: "kit", materials: ["Plant-based Cleaner"], eco: 90, carbon: 0.8, colors: ["forest"], sizes: OS },
  { name: "Transit Weekender", tagline: "40L carry-on with a ventilated shoe bay.", cat: "travel-bags", gender: "UNISEX", price: 18500, shape: "bag", materials: ["Recycled Polyester", "Natural Rubber"], eco: 69, carbon: 12.4, colors: ["slate", "sand"], sizes: OS },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Deterministic PRNG so the seed is reproducible across machines.
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);

async function main() {
  await db.$transaction([db.review.deleteMany(), db.orderItem.deleteMany(), db.order.deleteMany(), db.productVariant.deleteMany(), db.product.deleteMany(), db.category.deleteMany()]);

  const catIds = new Map<string, string>();
  let order = 0;
  for (const [slug, { name, subs }] of Object.entries(TREE)) {
    const parent = await db.category.create({ data: { slug, name, sortOrder: order++ } });
    catIds.set(slug, parent.id);
    for (const [i, [subSlug, subName]] of subs.entries()) {
      const c = await db.category.create({ data: { slug: subSlug, name: subName, parentId: parent.id, sortOrder: i } });
      catIds.set(subSlug, c.id);
    }
  }

  const passwordHash = await bcrypt.hash("flybirds-demo", 12);
  const admin = await db.user.upsert({ where: { email: "admin@flybirds.dev" }, update: {}, create: { email: "admin@flybirds.dev", name: "Ops Admin", role: Role.ADMIN, passwordHash } });
  const shoppers = await Promise.all(["ada", "linus", "grace", "ken"].map((n) => db.user.upsert({ where: { email: `${n}@example.com` }, update: {}, create: { email: `${n}@example.com`, name: n[0]!.toUpperCase() + n.slice(1), passwordHash } })));
  void admin;

  for (const p of P) {
    const genderPrefix = p.gender === "UNISEX" ? "" : p.gender === "MEN" ? "mens-" : "womens-";
    const slug = `${genderPrefix}${slugify(p.name)}`;
    const product = await db.product.create({
      data: {
        name: p.name, slug, tagline: p.tagline, basePrice: p.price, gender: p.gender, categoryId: catIds.get(p.cat)!,
        description: `${p.tagline} Designed in-house and tested across 1,000+ km of real-world use, the ${p.name} pairs ${p.materials.join(" and ").toLowerCase()} with a precision-tuned fit.`,
        materials: p.materials, sustainabilityRating: p.eco, carbonKg: p.carbon,
        careInstructions: ["Remove insoles and laces", "Machine wash cold on gentle cycle", "Air dry away from direct heat", "Do not bleach or tumble dry"],
        specs: { Weight: p.shape === "boot" ? "412 g" : p.shape === "runner" ? "248 g" : "290 g", Drop: p.shape === "runner" ? "8 mm" : "6 mm", Fit: "True to size", Origin: "Designed in Portland, OR" },
        variants: {
          create: p.colors.flatMap((ck, ci) => {
            const [color, hex] = COLORWAYS[ck];
            const images = [0, 1, 2, 3].map((angle) => `/api/visual/${p.shape}?hex=${encodeURIComponent(hex)}&angle=${angle}`);
            return p.sizes.map((size) => ({
              sku: `FB-${slug.toUpperCase().slice(0, 18)}-${ck.toUpperCase()}-${size.replace(/\W/g, "")}`,
              size, color, colorHex: hex, images,
              // Mix of healthy, low (1–3) and sold-out stock to exercise the UI.
              stockQuantity: rand() < 0.12 ? 0 : rand() < 0.2 ? 1 + Math.floor(rand() * 3) : 5 + Math.floor(rand() * 40),
              priceOverride: ci === 2 && p.price > 10000 ? p.price - 1500 : null,
            }));
          }),
        },
      },
    });

    const reviewers = shoppers.filter(() => rand() > 0.35);
    for (const u of reviewers) {
      await db.review.create({ data: { productId: product.id, userId: u.id, rating: 3 + Math.floor(rand() * 3), comment: "Comfortable out of the box and held up well on long days.", verifiedPurchase: rand() > 0.3 } });
    }
  }

  console.log(`Seeded ${P.length} products. Admin: admin@flybirds.dev / flybirds-demo`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
