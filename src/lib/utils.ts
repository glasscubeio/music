import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: number) {
  if (!time) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface Track {
  title: string;
  artist: string;
  src: string;
  cover: string;
}

export interface Collection {
  name: string;
  cover: string;
  tracks: Track[];
}
