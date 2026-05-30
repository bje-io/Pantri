/**
 * Simple localStorage persistence layer.
 * Handles week plans and AI-generated recipes across page navigations.
 */

import type { Recipe, WeekPlan } from "./meal-data";

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
