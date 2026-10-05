import { PrismaClient, Role } from "@prisma/client";
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

  console.log(`Seeded ${catalog.length} products. Admin: admin@flybirds.dev / flybirds-demo`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
