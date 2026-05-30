/**
 * Simple localStorage persistence layer.
 * Handles week plans, AI-generated recipes, recipe meal-type tags, and kitchen goals.
 */

import type { MealType, Recipe, WeekPlan } from "./meal-data";

// ── Kitchen goals ─────────────────────────────────────────────────
// macros are stored in GRAMS. Calories are always derived:
//   calories = protein_g * 4 + carbs_g * 4 + fat_g * 9

export type KitchenGoals = {
  dailyCalories: number; // derived — protein*4 + carbs*4 + fat*9
  macros: { protein: number; carbs: number; fat: number }; // GRAMS
};

// Defaults ≈ 1,949 cal: 150g pro (600) + 200g carbs (800) + 61g fat (549)
export const DEFAULT_KITCHEN_GOALS: KitchenGoals = {
  dailyCalories: 1949,
  macros: { protein: 150, carbs: 200, fat: 61 },
};

const KITCHEN_KEY = "pantri-kitchen-profile";
const KITCHEN_FORMAT = "grams-v1"; // version flag — old % data is ignored

export function derivedCalories(macros: { protein: number; carbs: number; fat: number }): number {
  return Math.round(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9);
}

export function loadKitchenGoals(): KitchenGoals {
  if (typeof window === "undefined") return DEFAULT_KITCHEN_GOALS;
  try {
    const stored = localStorage.getItem(KITCHEN_KEY);
    if (!stored) return DEFAULT_KITCHEN_GOALS;
    const p = JSON.parse(stored);
    // Ignore old percentage-based data
    if (p._fmt !== KITCHEN_FORMAT) return DEFAULT_KITCHEN_GOALS;
    const macros = p.macros ?? DEFAULT_KITCHEN_GOALS.macros;
    return { dailyCalories: derivedCalories(macros), macros };
  } catch {
    return DEFAULT_KITCHEN_GOALS;
  }
}

/** Loads the full persisted kitchen profile (for the Kitchen page). Returns null if none saved. */
export function loadKitchenProfile(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(KITCHEN_KEY);
    if (!stored) return null;
    const p = JSON.parse(stored);
    if (p._fmt !== KITCHEN_FORMAT) return null; // ignore old format
    return p;
  } catch {
    return null;
  }
}

/** Saves the full kitchen profile, tagging it with the current format version. */
export function saveKitchenProfile(profile: object) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KITCHEN_KEY, JSON.stringify({ ...profile, _fmt: KITCHEN_FORMAT }));
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
