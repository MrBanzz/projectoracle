import clsx, { type ClassValue } from "clsx";

/**
 * Composes Tailwind class names safely.
 *
 * Use for conditional class composition only. For complex merges or
 * conditional class objects, prefer inline ternaries or component-local
 * className strings.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
