import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Canonical FlowDesk style guide §1 cn() helper.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
