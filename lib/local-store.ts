/**
 * Simple localStorage persistence layer.
 * Handles week plans, AI-generated recipes, recipe meal-type tags, and kitchen goals.
 */

import type { MealType, Recipe, WeekPlan } from "./meal-data";

// ── Kitchen goals ─────────────────────────────────────────────────

export type KitchenGoals = {
  dailyCalories: number;
  macros: { protein: number; carbs: number; fat: number }; // percentages 0–100
};

export const DEFAULT_KITCHEN_GOALS: KitchenGoals = {
  dailyCalories: 2000,
  macros: { protein: 30, carbs: 40, fat: 30 },
};

const KITCHEN_KEY = "pantri-kitchen-profile";

export function loadKitchenGoals(): KitchenGoals {
  if (typeof window === "undefined") return DEFAULT_KITCHEN_GOALS;
  try {
    const stored = localStorage.getItem(KITCHEN_KEY);
    if (!stored) return DEFAULT_KITCHEN_GOALS;
    const p = JSON.parse(stored);
    return {
      dailyCalories: p.dailyCalories ?? DEFAULT_KITCHEN_GOALS.dailyCalories,
      macros: p.macros ?? DEFAULT_KITCHEN_GOALS.macros,
    };
  } catch {
    return DEFAULT_KITCHEN_GOALS;
  }
}

/** Merges the provided fields into the stored kitchen profile (preserves other settings). */
export function saveKitchenProfile(profile: object) {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(KITCHEN_KEY);
    const base = existing ? JSON.parse(existing) : {};
    localStorage.setItem(KITCHEN_KEY, JSON.stringify({ ...base, ...profile }));
  } catch {}
}

// ── Week plans ────────────────────────────────────────────────────

function planKey(weekStart: string) {
  return `pantri-plan-${weekStart}`;
}

export function loadWeekPlan(weekStart: string): WeekPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(planKey(weekStart));
    return stored ? (JSON.parse(stored) as WeekPlan) : null;
  } catch {
    return null;
  }
}

export function saveWeekPlan(plan: WeekPlan) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(planKey(plan.weekStart), JSON.stringify(plan));
  } catch {}
}

// ── AI / custom recipes ───────────────────────────────────────────

const CUSTOM_KEY = "pantri-custom-recipes";

export function loadCustomRecipes(): Recipe[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_KEY);
    return stored ? (JSON.parse(stored) as Recipe[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomRecipe(recipe: Recipe) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadCustomRecipes();
    // Avoid duplicates — replace if same id
    const filtered = existing.filter((r) => r.id !== recipe.id);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify([recipe, ...filtered]));
  } catch {}
}

// ── Recipe meal-type tag overrides ────────────────────────────────
// Lets users tag any recipe (seed or custom) as breakfast/lunch/dinner.

const TAGS_KEY = "pantri-recipe-tags";

export function loadRecipeTags(): Record<string, MealType[]> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(TAGS_KEY);
    return stored ? (JSON.parse(stored) as Record<string, MealType[]>) : {};
  } catch {
    return {};
  }
}

export function saveRecipeTags(id: string, mealTypes: MealType[]) {
  if (typeof window === "undefined") return;
  try {
    const all = loadRecipeTags();
    all[id] = mealTypes;
    localStorage.setItem(TAGS_KEY, JSON.stringify(all));
  } catch {}
}
