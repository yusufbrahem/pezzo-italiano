import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  if (typeof price === "string") return price;
  return `${price.toFixed(price % 1 === 0 ? 0 : 1)} DT`;
}
