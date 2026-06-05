"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  buildDefaultWeekPlan,
  ALL_RECIPES,
  type WeekPlan,
  type MealType,
  type Recipe,
} from "@/lib/meal-data";
import {
  loadWeekPlan, saveWeekPlan, loadCustomRecipes,
  loadKitchenGoals, loadKitchenProfile, derivedCalories, type KitchenGoals,
} from "@/lib/local-store";

// ── Helpers ───────────────────────────────────────────────────────

function getWeekStartISO(offset = 0): string {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay() + offset * 7);
  return sunday.toISOString().split("T")[0];
}

// Always expose exactly 4 weeks: current + 3 upcoming
const WEEK_OFFSETS = [0, 1, 2, 3] as const;
type WeekOffset = (typeof WEEK_OFFSETS)[number];

function weekTabLabel(offset: WeekOffset): string {
  if (offset === 0) return "This week";
  if (offset === 1) return "Next week";
  return `+${offset} weeks`;
}

function formatWeekRange(iso: string): string {
  const start = new Date(iso);
  const end = new Date(iso);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

const MEAL_LABELS: { type: MealType; emoji: string; label: string }[] = [
  { type: "breakfast", emoji: "🌅", label: "Breakfast" },
  { type: "lunch", emoji: "☀️", label: "Lunch" },
  { type: "dinner", emoji: "🌙", label: "Dinner" },
];

// ── Picker state type ─────────────────────────────────────────────

type PickerTarget = {
  dayIndex: number;
  mealType: MealType;
};

// ── Recipe Preview Modal ──────────────────────────────────────────

function RecipePreviewModal({
  recipe,
  isRegenerating,
  onClose,
  onSwap,
  onRandom,
}: {
  recipe: Recipe;
  isRegenerating: boolean;
  onClose: () => void;
  onSwap: () => void;
  onRandom: () => void;
}) {
  const total = recipe.macros.protein + recipe.macros.carbs + recipe.macros.fat;
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl font-bold text-foreground leading-tight">
                {recipe.title}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
                <span>{recipe.cuisine}</span>
                {totalTime > 0 && <span>· ⏱️ {totalTime}m</span>}
                <span>· 👥 {recipe.servings} servings</span>
                <span>· 🔥 {recipe.macros.calories} cal</span>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {recipe.source === "ai" && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    ✨ Sage
                  </span>
                )}
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground shrink-0"
            >
              ✕
            </button>
          </div>

          {total > 0 && (
            <div className="mt-3">
              <div className="flex rounded-full overflow-hidden h-1.5 mb-2">
                <div
                  className="bg-primary"
                  style={{ width: `${(recipe.macros.protein / total) * 100}%` }}
                />
                <div
                  className="bg-accent"
                  style={{ width: `${(recipe.macros.carbs / total) * 100}%` }}
                />
                <div
                  className="bg-yellow-400"
                  style={{ width: `${(recipe.macros.fat / total) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1" />
                  Protein {recipe.macros.protein}g
                </span>
                <span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1" />
                  Carbs {recipe.macros.carbs}g
                </span>
                <span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1" />
                  Fat {recipe.macros.fat}g
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {recipe.ingredients.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Ingredients</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{ing.amount ? `${ing.amount} ${ing.item}` : ing.item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recipe.steps.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Instructions</p>
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          <button
            onClick={() => { onRandom(); onClose(); }}
            className={cn(
              buttonVariants({ size: "sm" }),
              "flex-1 justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            🎲 Surprise me
          </button>
          <button
            onClick={onSwap}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex-1 justify-center"
            )}
          >
            ↔ Swap recipe
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recipe Picker Modal ───────────────────────────────────────────

function RecipePickerModal({
  mealType,
  currentRecipe,
  allWeek,
  onSelect,
  onRemove,
  onClose,
}: {
  mealType: MealType;
  currentRecipe: Recipe | null;
  allWeek: boolean;
  onSelect: (recipe: Recipe) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  // Combine custom (AI) + seeded recipes, no duplicates
  const custom = loadCustomRecipes();
  const seedIds = new Set(ALL_RECIPES.map((r) => r.id));
  const allAvailable = [
    ...custom.filter((r) => !seedIds.has(r.id)),
    ...ALL_RECIPES,
  ];

  // Show all recipes (including cheat meals) — cheat meals are just another option
  const pool = allAvailable.filter(
    (r) => r.isCheatDay || r.mealType.includes(mealType)
  );

  const filtered = pool.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground">
              Pick a {mealType}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} recipe{filtered.length !== 1 ? "s" : ""} available
              {allWeek && (
                <span className="ml-1.5 text-primary font-medium">· applies to all 7 days</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border shrink-0">
          <input
            autoFocus
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes..."
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {currentRecipe && (
            <button
              onClick={onRemove}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors text-sm font-medium"
            >
              <span>✕</span> Remove meal
            </button>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No recipes found — try a different search.
            </div>
          )}
          {filtered.map((recipe) => {
            const isCurrent = currentRecipe?.id === recipe.id;
            const totalTime = recipe.prepTime + recipe.cookTime;
            return (
              <button
                key={recipe.id}
                onClick={() => onSelect(recipe)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                  isCurrent
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : recipe.isCheatDay
                    ? "border-accent/30 hover:border-accent/60 hover:bg-accent/5"
                    : "border-border hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {recipe.title}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded-full shrink-0">
                        Current
                      </span>
                    )}
                    {recipe.source === "ai" && (
                      <span className="text-[10px] font-bold text-primary/70 bg-primary/10 px-1.5 rounded-full shrink-0">
                        ✨ Sage
                      </span>
                    )}
                    {recipe.isCheatDay && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 rounded-full shrink-0">
                        🍕
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recipe.cuisine} · {totalTime} min
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">{recipe.macros.calories}</p>
                  <p className="text-[10px] text-muted-foreground">cal</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-border shrink-0">
          <Link
            href="/planner/generate"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-center gap-2"
            )}
            onClick={onClose}
          >
            ✨ Create a new recipe with Sage
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Day Totals Cell ───────────────────────────────────────────────

type DayMacros = { cal: number; pro: number; carbs: number; fat: number };

function computeGoalTargets(goals: KitchenGoals) {
  // macros are in grams — calories are derived
  return {
    cal:   Math.round(goals.macros.protein * 4 + goals.macros.carbs * 4 + goals.macros.fat * 9),
    pro:   goals.macros.protein,
    carbs: goals.macros.carbs,
    fat:   goals.macros.fat,
  };
}

function macroStatus(actual: number, target: number): "empty" | "low" | "ok" | "warn" | "over" {
  if (target === 0 || actual === 0) return "empty";
  const r = actual / target;
  if (r > 1.2) return "over";
  if (r > 1.1) return "warn";
  if (r >= 0.9) return "ok";
  return "low";
}

const STATUS_COLOR: Record<string, string> = {
  empty: "text-muted-foreground",
  low:   "text-destructive",
  ok:    "text-green-600",
  warn:  "text-yellow-500",
  over:  "text-destructive",
};

function DayTotalsCell({
  actual,
  goals,
  onRebalance,
}: {
  actual: DayMacros;
  goals: KitchenGoals;
  onRebalance: () => void;
}) {
  const targets = computeGoalTargets(goals);
  const hasData = actual.cal > 0;

  const rows = [
    { label: "cal",  val: actual.cal,   target: targets.cal,  unit: "" },
    { label: "pro",  val: actual.pro,   target: targets.pro,  unit: "g" },
    { label: "carb", val: actual.carbs, target: targets.carbs, unit: "g" },
    { label: "fat",  val: actual.fat,   target: targets.fat,  unit: "g" },
  ];

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 p-2 flex flex-col items-center justify-between min-h-[88px] gap-1">
        <span className="text-[9px] text-muted-foreground flex-1 flex items-center">—</span>
        <button
          onClick={onRebalance}
          className="w-full text-[9px] font-medium text-primary/60 hover:text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-1 transition-all"
        >
          🎯 Balance
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2 space-y-1 min-h-[88px]">
      {rows.map(({ label, val, target, unit }) => {
        const st = macroStatus(val, target);
        const barPct = Math.min((val / target) * 100, 130);
        return (
          <div key={label} className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground w-5 shrink-0">{label}</span>
            <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all",
                  st === "ok" ? "bg-green-500" :
                  st === "empty" ? "bg-muted" : "bg-destructive/70"
                )}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <span className={cn("text-[9px] font-semibold shrink-0 w-10 text-right", STATUS_COLOR[st])}>
              {val}{unit}
            </span>
          </div>
        );
      })}
      <button
        onClick={onRebalance}
        className="w-full text-[9px] font-medium text-primary/60 hover:text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-1 transition-all mt-0.5"
      >
        🎯 Balance
      </button>
    </div>
  );
}

// ── Meal Slot Card ────────────────────────────────────────────────

function MealSlotCard({
  recipe,
  onOpen,
  onPreview,
  onRandom,
  onCheatMeal,
}: {
  recipe: Recipe | null;
  onOpen: () => void;
  onPreview: (recipe: Recipe) => void;
  onRandom: () => void;
  onCheatMeal: () => void;
}) {
  if (!recipe) {
    return (
      <div className="relative w-full min-h-[130px]">
        <button
          onClick={onOpen}
          className="w-full h-full min-h-[130px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-foreground border-border hover:border-primary/40 hover:bg-primary/5 group"
        >
          <span className="text-xl transition-transform group-hover:scale-110">+</span>
          <span className="text-[10px] font-medium">Add meal</span>
        </button>
        <button
          onClick={onRandom}
          title="Surprise me — random recipe"
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center text-[11px] transition-all"
        >
          🎲
        </button>
      </div>
    );
  }

  return (
    <div className="relative group w-full min-h-[130px]">
      <button
        onClick={() => onPreview(recipe)}
        className={cn(
          "w-full rounded-xl border p-3 text-left relative overflow-hidden transition-all hover:shadow-sm min-h-[130px] flex flex-col",
          recipe.isCheatDay
            ? "border-accent/40 bg-accent/5 hover:border-accent/70"
            : "border-border bg-card hover:border-primary/30"
        )}
      >
        {/* Title row */}
        <div className={cn("pr-14", recipe.isCheatDay && "pt-5")}>
          {recipe.isCheatDay && (
            <span className="absolute top-2 left-2 text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full border border-accent/20">
              🍕 CHEAT
            </span>
          )}
          <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
            {recipe.title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{recipe.cuisine}</p>
        </div>

        {/* Macro grid — per serving */}
        <div className="grid grid-cols-4 gap-1 mt-auto pt-2.5">
          {[
            { label: "cal",  val: recipe.macros.calories },
            { label: "pro",  val: `${recipe.macros.protein}g` },
            { label: "carb", val: `${recipe.macros.carbs}g` },
            { label: "fat",  val: `${recipe.macros.fat}g` },
          ].map((m) => (
            <div key={m.label} className="text-center rounded-lg bg-muted/50 py-1">
              <p className="text-[11px] font-bold text-foreground leading-none">{m.val}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </button>

      {/* Hover actions — top right */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onRandom(); }}
          title="Random healthy meal"
          className="w-6 h-6 rounded-full bg-background/95 border border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center text-[11px] shadow-sm transition-all"
        >
          🎲
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCheatMeal(); }}
          title="Random cheat meal"
          className="w-6 h-6 rounded-full bg-background/95 border border-accent/40 hover:border-accent/70 hover:bg-accent/5 flex items-center justify-center text-[11px] shadow-sm transition-all"
        >
          🍕
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          title="Pick a recipe"
          className="w-6 h-6 rounded-full bg-background/95 border border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center text-[11px] shadow-sm transition-all"
        >
          ↔
        </button>
      </div>

      {/* Pop-out button — hover only */}
      <button
        onClick={(e) => { e.stopPropagation(); window.open(`/recipes/${recipe.id}`, "_blank"); }}
        title="Open full recipe in new tab"
        className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-md bg-background/95 border border-border hover:border-primary/50 hover:bg-primary/5 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground hover:text-primary shadow-sm transition-all z-10 opacity-0 group-hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        Open
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState<WeekOffset>(0);
  const weekStart = getWeekStartISO(weekOffset);

  // Always start with default; load from localStorage after hydration
  const [plan, setPlan] = useState<WeekPlan>(() =>
    buildDefaultWeekPlan(getWeekStartISO(0))
  );

  // Load correct week from localStorage after mount / when week changes
  // No save-on-change effect — we save explicitly via updatePlan()
  useEffect(() => {
    const stored = loadWeekPlan(weekStart);
    setPlan(stored ?? buildDefaultWeekPlan(weekStart));
  }, [weekStart]);

  // ── Helper: update state + save to localStorage atomically ──────
  function updatePlan(updater: (prev: WeekPlan) => WeekPlan) {
    setPlan((prev) => {
      const next = updater(prev);
      saveWeekPlan(next); // save right here, no separate effect
      return next;
    });
  }

  const [kitchenGoals, setKitchenGoals] = useState<KitchenGoals>(() => loadKitchenGoals());
  // Full kitchen profile — used for dietary/allergy filtering on the dice
  const [kitchenProfile, setKitchenProfile] = useState<Record<string, unknown>>({});

  /**
   * Global cycle counter for both day and week Balance buttons.
   * Each press increments this so the next click picks the next-ranked recipe
   * for every slot instead of always returning the same "best" option.
   * Stored in a ref so increments are synchronous and don't cause re-renders
   * mid-function, but the value is also mirrored to state so the button can
   * show a visual "cycling" indicator if desired.
   */
  const rebalanceStepRef = React.useRef(0);

  // Refresh goals + profile whenever planner is focused (in case kitchen was updated)
  useEffect(() => {
    setKitchenGoals(loadKitchenGoals());
    const p = loadKitchenProfile();
    if (p) setKitchenProfile(p);
  }, []);

  const [confirmReset, setConfirmReset] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PickerTarget | null>(null);

  const [sameForAll, setSameForAll] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  const weekLabel = formatWeekRange(weekStart);

  function openPicker(dayIndex: number, mealType: MealType) {
    setPickerTarget({ dayIndex, mealType });
  }
  function closePicker() { setPickerTarget(null); }

  function openPreview(recipe: Recipe, dayIndex: number, mealType: MealType) {
    setPreviewRecipe(recipe);
    setPreviewTarget({ dayIndex, mealType });
  }
  function closePreview() {
    setPreviewRecipe(null);
    setPreviewTarget(null);
  }

  function assignRecipe(recipe: Recipe) {
    if (!pickerTarget) return;
    const { dayIndex, mealType } = pickerTarget;
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (!(sameForAll[mealType] ? true : i === dayIndex)) return day;
        return { ...day, meals: { ...day.meals, [mealType]: { recipe } } };
      }),
    }));
    closePicker();
  }

  function removeRecipe() {
    if (!pickerTarget) return;
    const { dayIndex, mealType } = pickerTarget;
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== dayIndex) return day;
        return { ...day, meals: { ...day.meals, [mealType]: { recipe: null } } };
      }),
    }));
    closePicker();
  }

  function buildCombinedPool() {
    const custom = loadCustomRecipes();
    const seedIds = new Set(ALL_RECIPES.map((r) => r.id));
    return [...custom.filter((r) => !seedIds.has(r.id)), ...ALL_RECIPES];
  }

  function applyKitchenFilters(pool: Recipe[]): Recipe[] {
    const dietaryPrefs = (kitchenProfile.dietaryPrefs as string[] | undefined) ?? [];
    const allergies    = (kitchenProfile.allergies    as string[] | undefined) ?? [];

    // Map dietary preference IDs → recipe tag keywords
    const DIET_TAG_MAP: Record<string, string[]> = {
      vegetarian:   ["vegetarian"],
      vegan:        ["vegan"],
      "gluten-free":["gluten-free"],
      "dairy-free": ["dairy-free"],
      "low-carb":   ["low-carb"],
      keto:         ["keto"],
      paleo:        ["paleo"],
      halal:        ["halal"],
    };

    // Allergy → ingredient keywords to block
    const ALLERGY_KEYWORDS: Record<string, string[]> = {
      nuts:     ["almonds", "cashews", "walnuts", "pecans", "pine nuts", "tree nut"],
      peanuts:  ["peanut"],
      shellfish:["shrimp", "crab", "lobster", "scallop", "clam", "oyster", "prawn"],
      fish:     ["salmon", "tuna", "cod", "tilapia", "halibut", "fish"],
      eggs:     ["egg"],
      soy:      ["soy sauce", "tofu", "edamame", "miso", "tempeh", "soy"],
      sesame:   ["sesame", "tahini"],
    };

    let filtered = pool;

    // Dietary preference filter: keep recipes that include at least one matching tag
    // (only applied when the recipe pool actually has tagged items — soft filter)
    if (dietaryPrefs.length > 0) {
      const requiredTags = dietaryPrefs.flatMap((p) => DIET_TAG_MAP[p] ?? []);
      if (requiredTags.length > 0) {
        const dietFiltered = filtered.filter((r) =>
          requiredTags.some((tag) => r.tags.map((t) => t.toLowerCase()).includes(tag))
        );
        // Only apply if it doesn't wipe out the pool entirely
        if (dietFiltered.length > 0) filtered = dietFiltered;
      }
    }

    // Allergy filter: hard block — exclude recipes with blocked ingredient keywords
    if (allergies.length > 0) {
      const blockedKeywords = allergies.flatMap((a) => ALLERGY_KEYWORDS[a] ?? []);
      if (blockedKeywords.length > 0) {
        const allergyFiltered = filtered.filter((r) => {
          const ingredientText = r.ingredients.map((i) => i.item.toLowerCase()).join(" ");
          return !blockedKeywords.some((kw) => ingredientText.includes(kw));
        });
        if (allergyFiltered.length > 0) filtered = allergyFiltered;
      }
    }

    return filtered;
  }

  function assignRandomRecipe(dayIndex: number, mealType: MealType) {
    const effectiveIdx = sameForAll[mealType] ? 0 : dayIndex;
    const day = plan.days[effectiveIdx];
    const combined = buildCombinedPool();

    // Start with meal-type filtered pool, then apply kitchen profile filters
    const typePool = applyKitchenFilters(
      combined.filter((r) => !r.isCheatDay && r.mealType.includes(mealType))
    );

    // Goal-aware: prefer recipes within ±10% of per-meal calorie target
    const perMealTarget = derivedCalories(kitchenGoals.macros) / 3;
    const lo = perMealTarget * 0.9;
    const hi = perMealTarget * 1.1;
    const goalPool = typePool.filter((r) => r.macros.calories >= lo && r.macros.calories <= hi);
    const pool = goalPool.length > 0 ? goalPool : typePool;
    if (pool.length === 0) return;

    const currentId = day.meals[mealType].recipe?.id;
    const choices = pool.filter((r) => r.id !== currentId);
    const finalPool = choices.length > 0 ? choices : pool;
    const recipe = finalPool[Math.floor(Math.random() * finalPool.length)];

    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (!(sameForAll[mealType] ? true : i === effectiveIdx)) return day;
        return { ...day, meals: { ...day.meals, [mealType]: { recipe } } };
      }),
    }));
  }

  function assignCheatMeal(dayIndex: number, mealType: MealType) {
    const effectiveIdx = sameForAll[mealType] ? 0 : dayIndex;
    const day = plan.days[effectiveIdx];
    const combined = buildCombinedPool();

    // Only pick cheat meals that match this specific meal type — never cross-place
    const pool = combined.filter(
      (r) => r.isCheatDay === true && Array.isArray(r.mealType) && r.mealType.includes(mealType)
    );
    if (pool.length === 0) return; // no cheat meal exists for this meal type, do nothing

    const currentId = day.meals[mealType].recipe?.id;
    const choices = pool.filter((r) => r.id !== currentId);
    const finalPool = choices.length > 0 ? choices : pool;
    const recipe = finalPool[Math.floor(Math.random() * finalPool.length)];

    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (!(sameForAll[mealType] ? true : i === effectiveIdx)) return day;
        return { ...day, meals: { ...day.meals, [mealType]: { recipe } } };
      }),
    }));
  }

  function toggleSameForAll(mealType: MealType) {
    const turningOn = !sameForAll[mealType];
    setSameForAll((prev) => ({ ...prev, [mealType]: !prev[mealType] }));
    // When enabling, immediately open the picker so the user can choose
    // which recipe to use for all 7 days in one step.
    if (turningOn) {
      setPickerTarget({ dayIndex: 0, mealType });
    }
  }

  /** Fill every slot in the current week with goal-aware, kitchen-filtered recipes. */
  function randomizeAllMeals() {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto-cancel the confirm state after 3 s if user doesn't click again
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);

    const combined = buildCombinedPool();
    const perMealTarget = derivedCalories(kitchenGoals.macros) / 3;
    const lo = perMealTarget * 0.9;
    const hi = perMealTarget * 1.1;

    // Build a shuffled pool per meal type (kitchen-filtered + goal-aware)
    const pools = {} as Record<MealType, Recipe[]>;
    for (const { type } of MEAL_LABELS) {
      const base = applyKitchenFilters(
        combined.filter((r) => !r.isCheatDay && r.mealType.includes(type))
      );
      const goal = base.filter((r) => r.macros.calories >= lo && r.macros.calories <= hi);
      const src  = goal.length > 0 ? goal : base;
      // Fisher-Yates shuffle for maximum variety
      const arr = [...src];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      pools[type] = arr;
    }

    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, di) => {
        const newMeals = { ...day.meals };
        for (const { type } of MEAL_LABELS) {
          // sameForAll: only assign day 0; other days will mirror it via display logic
          if (sameForAll[type] && di > 0) continue;
          const pool = pools[type];
          if (pool.length === 0) continue;
          // Cycle through shuffled pool so all 7 days get variety
          newMeals[type] = { recipe: pool[di % pool.length] };
        }
        return { ...day, meals: newMeals };
      }),
    }));
  }

  /**
   * Rebalance the ENTIRE week to get as close as possible to the weekly
   * calorie/macro goals.
   *
   * Algorithm:
   *  1. Start with a "remaining weekly budget" = daily goal × 7.
   *  2. Handle "sameForAll" meal types first — each repeats 7 days, so its
   *     recipe is chosen to match (weeklyBudget × mealShare) / 7 per day,
   *     then 7× its macros are deducted from the remaining budget.
   *  3. For the remaining (non-pinned) meal slots, iterate day by day.
   *     After each day is assigned, subtract its actual macros so the next
   *     day's target recalculates from what's left — this means early
   *     over-target days automatically shift later days lighter, and vice versa.
   *  4. Variety: already-used recipe IDs receive a 0.25 score penalty so the
   *     algorithm prefers fresh options across the 7 days.
   *
   * Scoring: |actual − target| / target, weighted cal×2, pro×1, carb×0.5, fat×0.5.
   * Meal-share split: breakfast 25%, lunch 35%, dinner 40% of daily target.
   */
  function rebalanceMeals() {
    const combined  = buildCombinedPool();
    const dailyCal  = derivedCalories(kitchenGoals.macros);

    // Meal-weighted split: breakfast 25%, lunch 35%, dinner 40%
    const MEAL_SHARES: Record<MealType, number> = {
      breakfast: 0.25,
      lunch:     0.35,
      dinner:    0.40,
    };

    // Build kitchen-filtered pools per meal type (cheat meals excluded)
    const pools: Record<MealType, Recipe[]> = {} as Record<MealType, Recipe[]>;
    for (const { type } of MEAL_LABELS) {
      pools[type] = applyKitchenFilters(
        combined.filter((r) => !r.isCheatDay && r.mealType.includes(type))
      );
    }

    // Scoring fn: how close is recipe r to a given macro target?
    // Capture the current step once so the whole run is consistent.
    // After building the plan we'll advance the counter so the next press
    // yields a different (next-ranked) combination.
    const step = rebalanceStepRef.current;

    function score(r: Recipe, target: { cal: number; pro: number; carb: number; fat: number }, usedIds: Set<string>): number {
      const d = (a: number, t: number) => t > 0 ? Math.abs(a - t) / t : 0;
      const varietyPenalty = usedIds.has(r.id) ? 0.25 : 0;
      return d(r.macros.calories, target.cal)  * 2
           + d(r.macros.protein,  target.pro)
           + d(r.macros.carbs,    target.carb) * 0.5
           + d(r.macros.fat,      target.fat)  * 0.5
           + varietyPenalty;
    }

    /**
     * Sort pool by score, then pick at offset (step + slotIndex) % length.
     * slotIndex is a per-run counter so each meal slot within one click
     * pulls from a different rank position — preventing all 21 slots from
     * selecting the exact same recipe when the pool is small.
     */
    function pickAtStep(
      pool: Recipe[],
      target: { cal: number; pro: number; carb: number; fat: number },
      usedIds: Set<string>,
      slotIndex: number
    ): Recipe {
      const sorted = [...pool].sort((a, b) => score(a, target, usedIds) - score(b, target, usedIds));
      return sorted[(step + slotIndex) % sorted.length];
    }

    // ── Phase 1: resolve sameForAll meals ──────────────────────────
    // These repeat all 7 days so their total contribution = recipe × 7.
    // Pick once, deduct 7× from the weekly budget before touching per-day slots.
    const weeklyRemaining = {
      cal:  dailyCal                    * 7,
      pro:  kitchenGoals.macros.protein * 7,
      carb: kitchenGoals.macros.carbs   * 7,
      fat:  kitchenGoals.macros.fat     * 7,
    };

    const usedIds = new Set<string>();
    const pinnedRecipes: Partial<Record<MealType, Recipe>> = {};
    let slotCounter = 0; // advances with every pick so each slot uses a different rank offset

    for (const { type } of MEAL_LABELS) {
      if (!sameForAll[type]) continue;
      const pool = pools[type];
      if (pool.length === 0) continue;

      // Target per day for this meal type
      const perDayTarget = {
        cal:  (dailyCal                    / 7) * MEAL_SHARES[type],
        pro:  (kitchenGoals.macros.protein / 7) * MEAL_SHARES[type],
        carb: (kitchenGoals.macros.carbs   / 7) * MEAL_SHARES[type],
        fat:  (kitchenGoals.macros.fat     / 7) * MEAL_SHARES[type],
      };

      const recipe = pickAtStep(pool, perDayTarget, usedIds, slotCounter++);
      pinnedRecipes[type] = recipe;
      usedIds.add(recipe.id);

      // Deduct 7 days' worth from weekly remaining
      weeklyRemaining.cal  -= recipe.macros.calories * 7;
      weeklyRemaining.pro  -= recipe.macros.protein  * 7;
      weeklyRemaining.carb -= recipe.macros.carbs    * 7;
      weeklyRemaining.fat  -= recipe.macros.fat      * 7;
    }

    // ── Phase 2: assign non-pinned slots day-by-day ────────────────
    const nonPinnedTypes = MEAL_LABELS.filter(({ type }) => !sameForAll[type]);

    const dayBudgetRemaining = { ...weeklyRemaining };
    let daysLeft = 7;

    // Build day assignments
    const dayMealPicks: Record<MealType, Recipe>[] = [];

    for (let di = 0; di < 7; di++) {
      const perDayBudget = {
        cal:  dayBudgetRemaining.cal  / daysLeft,
        pro:  dayBudgetRemaining.pro  / daysLeft,
        carb: dayBudgetRemaining.carb / daysLeft,
        fat:  dayBudgetRemaining.fat  / daysLeft,
      };

      const dayPicks: Partial<Record<MealType, Recipe>> = {};
      let dayActual = { cal: 0, pro: 0, carb: 0, fat: 0 };

      for (const { type } of nonPinnedTypes) {
        const pool = pools[type];
        if (pool.length === 0) continue;

        const mealTarget = {
          cal:  perDayBudget.cal  * MEAL_SHARES[type],
          pro:  perDayBudget.pro  * MEAL_SHARES[type],
          carb: perDayBudget.carb * MEAL_SHARES[type],
          fat:  perDayBudget.fat  * MEAL_SHARES[type],
        };

        const recipe = pickAtStep(pool, mealTarget, usedIds, slotCounter++);
        dayPicks[type] = recipe;
        usedIds.add(recipe.id);

        dayActual.cal  += recipe.macros.calories;
        dayActual.pro  += recipe.macros.protein;
        dayActual.carb += recipe.macros.carbs;
        dayActual.fat  += recipe.macros.fat;
      }

      dayMealPicks.push(dayPicks as Record<MealType, Recipe>);

      // Subtract this day's actuals from the remaining budget
      dayBudgetRemaining.cal  -= dayActual.cal;
      dayBudgetRemaining.pro  -= dayActual.pro;
      dayBudgetRemaining.carb -= dayActual.carb;
      dayBudgetRemaining.fat  -= dayActual.fat;
      daysLeft--;
    }

    // ── Apply to plan ──────────────────────────────────────────────
    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, di) => {
        const newMeals = { ...day.meals };

        // Apply pinned (sameForAll) recipes to day 0 only
        for (const { type } of MEAL_LABELS) {
          if (!sameForAll[type]) continue;
          if (di !== 0) continue;
          const pinned = pinnedRecipes[type];
          if (pinned) newMeals[type] = { recipe: pinned };
        }

        // Apply day-specific picks
        for (const { type } of nonPinnedTypes) {
          const recipe = dayMealPicks[di]?.[type];
          if (recipe) newMeals[type] = { recipe };
        }

        return { ...day, meals: newMeals };
      }),
    }));

    // Advance the cycle counter so the next click picks the next-ranked combo
    rebalanceStepRef.current += 1;
  }

  /**
   * Rebalance a single day: swap each non-locked meal to the recipe whose macros
   * best match per-meal targets (using 25/35/40% breakfast/lunch/dinner split).
   *
   * "Same for all" handling:
   *   - If sameForAll[type] is on, the meal is "pinned" — day 0 holds the master
   *     recipe. We update day 0 here, which updates the display for ALL days of
   *     THIS week. Other weeks are stored independently in localStorage and are
   *     completely unaffected.
   *   - If sameForAll[type] is off, only the clicked day's slot is changed.
   */
  function rebalanceDayMeals(dayIndex: number) {
    const combined = buildCombinedPool();
    const dailyCal = derivedCalories(kitchenGoals.macros);

    // Meal-weighted calorie/macro targets (25% breakfast · 35% lunch · 40% dinner)
    const MEAL_SHARES: Record<MealType, number> = {
      breakfast: 0.25,
      lunch:     0.35,
      dinner:    0.40,
    };

    const step = rebalanceStepRef.current;

    function scoreFn(r: Recipe, type: MealType, usedIds: Set<string>): number {
      const share = MEAL_SHARES[type];
      const t = {
        cal:  dailyCal                    * share,
        pro:  kitchenGoals.macros.protein * share,
        carb: kitchenGoals.macros.carbs   * share,
        fat:  kitchenGoals.macros.fat     * share,
      };
      const d = (a: number, target: number) => target > 0 ? Math.abs(a - target) / target : 0;
      const varietyPenalty = usedIds.has(r.id) ? 0.25 : 0;
      return d(r.macros.calories, t.cal)  * 2
           + d(r.macros.protein,  t.pro)
           + d(r.macros.carbs,    t.carb) * 0.5
           + d(r.macros.fat,      t.fat)  * 0.5
           + varietyPenalty;
    }

    // Pick recipe at (step + slotIndex) rank for each meal type
    const usedIds = new Set<string>();
    const picks = {} as Record<MealType, Recipe | null>;
    let slotCounter = 0;

    for (const { type } of MEAL_LABELS) {
      const base = applyKitchenFilters(
        combined.filter((r) => !r.isCheatDay && r.mealType.includes(type))
      );
      if (base.length === 0) { picks[type] = null; continue; }

      const sorted = [...base].sort((a, b) => scoreFn(a, type, usedIds) - scoreFn(b, type, usedIds));
      const recipe = sorted[(step + slotCounter) % sorted.length];
      picks[type] = recipe;
      usedIds.add(recipe.id);
      slotCounter++;
    }

    updatePlan((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => {
        const newMeals = { ...day.meals };
        for (const { type } of MEAL_LABELS) {
          const targetIdx = sameForAll[type] ? 0 : dayIndex;
          if (i !== targetIdx) continue;
          if (picks[type]) newMeals[type] = { recipe: picks[type]! };
        }
        return { ...day, meals: newMeals };
      }),
    }));

    // Advance the cycle counter so the next press gives a different set
    rebalanceStepRef.current += 1;
  }

  const pickerDay = pickerTarget ? plan.days[pickerTarget.dayIndex] : null;
  const pickerCurrentRecipe =
    pickerTarget && pickerDay ? pickerDay.meals[pickerTarget.mealType].recipe : null;

  // Per-day effective macros (respects sameForAll display logic)
  function getDayMacros(dayIndex: number): DayMacros {
    return MEAL_LABELS.reduce(
      (acc, { type }) => {
        const r = sameForAll[type]
          ? plan.days[0].meals[type].recipe
          : plan.days[dayIndex].meals[type].recipe;
        if (!r) return acc;
        return {
          cal:   acc.cal   + r.macros.calories,
          pro:   acc.pro   + r.macros.protein,
          carbs: acc.carbs + r.macros.carbs,
          fat:   acc.fat   + r.macros.fat,
        };
      },
      { cal: 0, pro: 0, carbs: 0, fat: 0 } as DayMacros
    );
  }

  const filledSlots = plan.days.reduce(
    (sum, d) =>
      sum +
      (d.meals.breakfast.recipe ? 1 : 0) +
      (d.meals.lunch.recipe ? 1 : 0) +
      (d.meals.dinner.recipe ? 1 : 0),
    0
  );
  const totalSlots = 7 * 3;
  const cheatMealCount = plan.days.reduce(
    (sum, d) =>
      sum +
      (d.meals.breakfast.recipe?.isCheatDay ? 1 : 0) +
      (d.meals.lunch.recipe?.isCheatDay ? 1 : 0) +
      (d.meals.dinner.recipe?.isCheatDay ? 1 : 0),
    0
  );

  // Week totals
  const weekTotals = plan.days.reduce(
    (acc, _, i) => {
      const dm = getDayMacros(i);
      return {
        cal:   acc.cal   + dm.cal,
        pro:   acc.pro   + dm.pro,
        carbs: acc.carbs + dm.carbs,
        fat:   acc.fat   + dm.fat,
      };
    },
    { cal: 0, pro: 0, carbs: 0, fat: 0 } as DayMacros
  );
  const weekGoalTargets = computeGoalTargets(kitchenGoals);
  const weekGoals: DayMacros = {
    cal:   weekGoalTargets.cal   * 7,
    pro:   weekGoalTargets.pro   * 7,
    carbs: weekGoalTargets.carbs * 7,
    fat:   weekGoalTargets.fat   * 7,
  };

  return (
    <>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Meal Planner</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Click a slot to preview · hover for 🎲 random · 🍕 cheat · ↔ pick
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/kitchen" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ⚙️ My Goals
            </Link>
            <Link href="/grocery" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              🛒 Grocery list
            </Link>
            <button
              onClick={randomizeAllMeals}
              className={cn(
                buttonVariants({ size: "sm" }),
                "transition-all",
                confirmReset
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse"
                  : "bg-muted hover:bg-muted/80 text-foreground border border-border"
              )}
            >
              {confirmReset ? "⚠️ Confirm reset?" : "🎲 Randomize week"}
            </button>
            <Link
              href="/planner/generate"
              className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground")}
            >
              ✨ Create with Sage
            </Link>
          </div>
        </div>

        {/* Week tabs — current week + 3 upcoming, always 4 visible */}
        <div className="flex gap-1 mb-5 border border-border rounded-xl p-1 bg-muted/20 overflow-x-auto">
          {WEEK_OFFSETS.map((offset) => {
            const ws = getWeekStartISO(offset);
            const range = formatWeekRange(ws);
            const isActive = weekOffset === offset;
            return (
              <button
                key={offset}
                onClick={() => setWeekOffset(offset)}
                className={cn(
                  "flex-1 min-w-[130px] py-2.5 px-3 rounded-lg text-center transition-all",
                  isActive
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("text-xs font-semibold", isActive ? "text-primary" : "")}>
                  {weekTabLabel(offset)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{range}</div>
              </button>
            );
          })}
        </div>

        {/* Same-for-all toggles */}
        <div className="flex flex-wrap gap-2 mb-5">
          {MEAL_LABELS.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => toggleSameForAll(type)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                sameForAll[type]
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              <span>{emoji}</span>
              {sameForAll[type] ? `Same ${label} all week ✓` : `Same ${label} weekly`}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[820px]">
            {/* Day headers */}
            <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 mb-2">
              <div />
              {plan.days.map((day, i) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const isToday = weekOffset === 0 && new Date().getDay() === i;
                return (
                  <div key={day.day} className="text-center">
                    <div className={cn(
                      "rounded-xl p-2 border transition-all",
                      isToday
                        ? "bg-primary/10 border-primary/30"
                        : "border-transparent"
                    )}>
                      <p className={cn("text-xs font-bold", isToday ? "text-primary" : "text-muted-foreground")}>
                        {day.day.slice(0, 3).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meal rows */}
            {MEAL_LABELS.map(({ type, emoji, label }) => (
              <div key={type} className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 mb-2">
                <div className="flex flex-col items-center justify-center gap-1 py-1">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                  {sameForAll[type] && (
                    <span className="text-[9px] text-primary font-medium bg-primary/10 px-1 rounded-full">Linked</span>
                  )}
                </div>
                {plan.days.map((day, di) => {
                  const effectiveRecipe = sameForAll[type]
                    ? plan.days[0].meals[type].recipe
                    : day.meals[type].recipe;
                  const isTodayCol = weekOffset === 0 && new Date().getDay() === di;
                  return (
                    <div key={day.day} className={cn("min-h-[130px] rounded-xl", isTodayCol && "bg-primary/[0.04]")}>
                      <MealSlotCard
                        recipe={effectiveRecipe}
                        onOpen={() => openPicker(sameForAll[type] ? 0 : di, type)}
                        onPreview={(recipe) => openPreview(recipe, sameForAll[type] ? 0 : di, type)}
                        onRandom={() => assignRandomRecipe(sameForAll[type] ? 0 : di, type)}
                        onCheatMeal={() => assignCheatMeal(sameForAll[type] ? 0 : di, type)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Day totals row */}
            <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 mt-1">
              <div className="flex flex-col items-center justify-center gap-0.5 py-1">
                <span className="text-sm">📊</span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Goals</span>
                <span className="text-[8px] text-muted-foreground">/{kitchenGoals.dailyCalories}cal</span>
              </div>
              {plan.days.map((_, di) => (
                <DayTotalsCell
                  key={di}
                  actual={getDayMacros(di)}
                  goals={kitchenGoals}
                  onRebalance={() => rebalanceDayMeals(di)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filledSlots}<span className="text-base font-normal text-muted-foreground">/{totalSlots}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Meals planned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={cn("text-2xl font-bold", macroStatus(weekTotals.cal, weekGoals.cal) === "over" ? "text-destructive" : macroStatus(weekTotals.cal, weekGoals.cal) === "ok" ? "text-green-600" : "text-primary")}>
              {weekTotals.cal > 0 ? weekTotals.cal.toLocaleString() : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Week cal <span className="text-[10px]">/{weekGoals.cal.toLocaleString()}</span></p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-accent">{cheatMealCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cheat meals</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
            <Link href="/grocery" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 text-xs w-full justify-center")}>
              🛒 Grocery list
            </Link>
          </div>
        </div>

        {/* Week macro totals vs goals */}
        {weekTotals.cal > 0 && (
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Weekly totals vs goals</p>
              {(
                macroStatus(weekTotals.cal,   weekGoals.cal)   !== "ok" ||
                macroStatus(weekTotals.pro,   weekGoals.pro)   !== "ok" ||
                macroStatus(weekTotals.carbs, weekGoals.carbs) !== "ok" ||
                macroStatus(weekTotals.fat,   weekGoals.fat)   !== "ok"
              ) && macroStatus(weekTotals.cal, weekGoals.cal) !== "empty" && (
                <button
                  onClick={rebalanceMeals}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                  )}
                >
                  🎯 Rebalance meals
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Calories", val: weekTotals.cal,   goal: weekGoals.cal,   unit: "" },
                { label: "Protein",  val: weekTotals.pro,   goal: weekGoals.pro,   unit: "g" },
                { label: "Carbs",    val: weekTotals.carbs, goal: weekGoals.carbs, unit: "g" },
                { label: "Fat",      val: weekTotals.fat,   goal: weekGoals.fat,   unit: "g" },
              ].map(({ label, val, goal, unit }) => {
                const st = macroStatus(val, goal);
                const barPct = Math.min((val / goal) * 100, 115);
                return (
                  <div key={label}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-medium text-foreground">{label}</span>
                      <span className={cn("text-xs font-bold", STATUS_COLOR[st])}>
                        {val.toLocaleString()}{unit}
                        <span className="text-muted-foreground font-normal">/{goal.toLocaleString()}{unit}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          st === "ok" ? "bg-green-500" :
                          st === "empty" ? "bg-muted" : "bg-destructive/70"
                        )}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {st === "over" && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        +{(val - goal).toLocaleString()}{unit} over goal
                      </p>
                    )}
                    {st === "low" && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        {(goal - val).toLocaleString()}{unit} under goal
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filledSlots < totalSlots && (
          <div className="mt-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">
                {totalSlots - filledSlots} empty slot{totalSlots - filledSlots !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">Create new recipes with Sage or pick from your library.</p>
            </div>
            <Link
              href="/planner/generate"
              className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground shrink-0")}
            >
              ✨ Create with Sage
            </Link>
          </div>
        )}
      </main>

      {/* Preview modal */}
      {previewRecipe && previewTarget && (
        <RecipePreviewModal
          recipe={previewRecipe}
          isRegenerating={false}
          onClose={closePreview}
          onSwap={() => {
            closePreview();
            openPicker(previewTarget.dayIndex, previewTarget.mealType);
          }}
          onRandom={() => {
            assignRandomRecipe(previewTarget.dayIndex, previewTarget.mealType);
            closePreview();
          }}
        />
      )}

      {/* Picker modal */}
      {pickerTarget && pickerDay && (
        <RecipePickerModal
          mealType={pickerTarget.mealType}
          currentRecipe={pickerCurrentRecipe}
          allWeek={sameForAll[pickerTarget.mealType]}
          onSelect={assignRecipe}
          onRemove={removeRecipe}
          onClose={closePicker}
        />
      )}
    </>
  );
}
