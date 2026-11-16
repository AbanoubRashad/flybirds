import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED", "REFUNDED"] as const satisfies readonly OrderStatus[];
export const ORDERS_PER_PAGE = 20;

/** Orders that count as revenue. */
const EARNING: OrderStatus[] = ["PAID", "SHIPPED"];

export type RevenuePoint = { day: string; revenue: number; orders: number };

/** Revenue and order count per day for the last `days` days (UTC), with empty days filled in. */
export async function getRevenueSeries(days = 30, now = new Date()): Promise<RevenuePoint[]> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
  const rows = await db.$queryRaw<{ day: Date; revenue: bigint; orders: bigint }[]>(Prisma.sql`
    SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, SUM("totalAmount") AS revenue, COUNT(*) AS orders
    FROM "Order"
    WHERE status IN ('PAID', 'SHIPPED') AND "createdAt" >= ${start}
    GROUP BY 1 ORDER BY 1
  `);
  const byDay = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r]));
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    const hit = byDay.get(day);
    return { day, revenue: Number(hit?.revenue ?? 0), orders: Number(hit?.orders ?? 0) };
  });
}

export async function getOverview(days = 30, now = new Date()) {
  const since = new Date(now.getTime() - days * 86_400_000);
  const [earned, toShip, refunded, lowStock, soldOut, variants] = await Promise.all([
    db.order.aggregate({ where: { status: { in: EARNING }, createdAt: { gte: since } }, _sum: { totalAmount: true }, _count: true }),
    db.order.count({ where: { status: "PAID" } }),
    db.order.count({ where: { status: "REFUNDED", createdAt: { gte: since } } }),
    db.productVariant.findMany({
      where: { stockQuantity: { lte: 3 }, product: { isActive: true } },
      orderBy: [{ stockQuantity: "asc" }, { sku: "asc" }],
      take: 25,
      select: { sku: true, size: true, color: true, colorHex: true, stockQuantity: true, product: { select: { name: true, slug: true } } },
    }),
    db.productVariant.count({ where: { stockQuantity: 0 } }),
    db.productVariant.count(),
  ]);
  const revenue = earned._sum.totalAmount ?? 0;
  return {
    revenue,
    orders: earned._count,
    averageOrder: earned._count ? Math.round(revenue / earned._count) : 0,
    toShip,
    refunded,
    lowStock,
    soldOut,
    variants,
  };
}

export async function listOrders({ status, page = 1 }: { status?: OrderStatus; page?: number }) {
  const where: Prisma.OrderWhereInput = status ? { status } : {};
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PER_PAGE,
      take: ORDERS_PER_PAGE,
      select: {
        id: true, status: true, email: true, totalAmount: true, createdAt: true, stripePaymentIntentId: true,
        user: { select: { name: true } },
        items: { select: { id: true, productName: true, size: true, color: true, quantity: true } },
      },
    }),
    db.order.count({ where }),
  ]);
  return { orders, total, pages: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)) };
}

export type AdminOrder = Awaited<ReturnType<typeof listOrders>>["orders"][number];

export async function listProducts() {
  const products = await db.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, basePrice: true, gender: true, isActive: true,
      category: { select: { name: true } },
      variants: { orderBy: [{ color: "asc" }, { sku: "asc" }], select: { id: true, sku: true, size: true, color: true, colorHex: true, stockQuantity: true, priceOverride: true } },
    },
  });
  return products.map((p) => ({
    ...p,
    stock: p.variants.reduce((n, v) => n + v.stockQuantity, 0),
    soldOut: p.variants.filter((v) => v.stockQuantity === 0).length,
  }));
}

export type AdminProduct = Awaited<ReturnType<typeof listProducts>>[number];
