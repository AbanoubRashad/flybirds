import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Money is stored as integer cents end-to-end; format only at the edge. */
export type Cents = number;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const formatPrice = (cents: Cents) => usd.format(cents / 100);

export const FREE_SHIPPING_THRESHOLD: Cents = 7500;
export const EXPRESS_SHIPPING_THRESHOLD: Cents = 15000;
