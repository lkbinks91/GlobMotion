"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type MockDestination } from "@/data/mockDestinations";

// ─────────────────────────────────────────────────────────────────────────────
// Shape
// ─────────────────────────────────────────────────────────────────────────────

export interface FavoriteDestination {
  id: string;
  city: string;
  country: string;
  moodTags: string[];
  matchScore: number;
  savedAt: string;
  prompt: string;
  /** Full destination snapshot — lets "Revoir ce match" restore the card */
  destinationData?: MockDestination;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "globmotion_favorites";

function loadFromStorage(): FavoriteDestination[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteDestination[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(favorites: FavoriteDestination[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Quota exceeded — fail silently
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface FavoritesContextValue {
  favorites: FavoriteDestination[];
  addFavorite: (dest: Omit<FavoriteDestination, "savedAt">) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getFavorites: () => FavoriteDestination[];
  clearAll: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteDestination[]>([]);

  // Hydrate once from localStorage
  useEffect(() => {
    setFavorites(loadFromStorage());
  }, []);

  // Persist on every change
  useEffect(() => {
    saveToStorage(favorites);
  }, [favorites]);

  const addFavorite = useCallback((dest: Omit<FavoriteDestination, "savedAt">) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === dest.id)) return prev;
      return [{ ...dest, savedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const getFavorites = useCallback(() => favorites, [favorites]);

  const clearAll = useCallback(() => setFavorites([]), []);

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite, getFavorites, clearAll }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within <FavoritesProvider>");
  return ctx;
}
