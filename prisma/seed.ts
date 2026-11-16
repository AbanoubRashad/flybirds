import { OrderStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { buildCatalog, SHOPPERS, TREE } from "./catalog";

const db = new PrismaClient();

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
  await db.user.upsert({ where: { email: "admin@flybirds.dev" }, update: {}, create: { email: "admin@flybirds.dev", name: "Ops Admin", role: Role.ADMIN, passwordHash } });
  const shoppers = await Promise.all(SHOPPERS.map((n) => db.user.upsert({ where: { email: `${n}@example.com` }, update: {}, create: { email: `${n}@example.com`, name: n[0]!.toUpperCase() + n.slice(1), passwordHash } })));

  const catalog = buildCatalog();
  for (const { category, variants, reviews, ...p } of catalog) {
    const product = await db.product.create({
      data: { ...p, categoryId: catIds.get(category)!, variants: { create: variants } },
    });
    for (const r of reviews) {
      await db.review.create({ data: { productId: product.id, userId: shoppers[r.shopper]!.id, rating: r.rating, comment: r.comment, verifiedPurchase: r.verifiedPurchase } });
    }
  }

  // Sample orders over the last 30 days, so the ops dashboard has something to chart.
  // A fixed generator keeps every seed run identical apart from the dates.
  let state = 20260917;
  const rand = () => (state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const sellable = await db.productVariant.findMany({ where: { stockQuantity: { gt: 0 } }, select: { id: true, size: true, color: true, priceOverride: true, product: { select: { name: true, basePrice: true } } }, orderBy: { sku: "asc" } });
  const now = Date.now();
  for (let i = 0; i < 46; i++) {
    const shopper = shoppers[Math.floor(rand() * shoppers.length)]!;
    const lines = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => ({ v: sellable[Math.floor(rand() * sellable.length)]!, quantity: 1 + Math.floor(rand() * 2) }));
    const subtotal = lines.reduce((n, l) => n + (l.v.priceOverride ?? l.v.product.basePrice) * l.quantity, 0);
    const shipping = subtotal >= 7500 ? 0 : 800;
    const daysAgo = Math.floor(rand() * 30);
    const roll = rand();
    await db.order.create({
      data: {
        userId: shopper.id,
        email: shopper.email,
        status: roll < 0.08 ? OrderStatus.REFUNDED : roll < 0.14 ? OrderStatus.CANCELLED : daysAgo > 3 ? OrderStatus.SHIPPED : OrderStatus.PAID,
        subtotalAmount: subtotal,
        shippingAmount: shipping,
        totalAmount: subtotal + shipping,
        stripeCheckoutId: `cs_seed_${i}`,
        stripePaymentIntentId: `pi_seed_${i}`,
        shippingAddress: { name: shopper.name, line1: `${100 + i} Market Street`, city: "San Francisco", postalCode: "94105", country: "US" },
        createdAt: new Date(now - daysAgo * 86_400_000 - Math.floor(rand() * 80_000_000)),
        items: { create: lines.map((l) => ({ variantId: l.v.id, productName: l.v.product.name, size: l.v.size, color: l.v.color, unitPrice: l.v.priceOverride ?? l.v.product.basePrice, quantity: l.quantity })) },
      },
    });
  }

  console.log(`Seeded ${catalog.length} products and 46 sample orders. Admin: admin@flybirds.dev / flybirds-demo`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
