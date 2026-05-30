"use client";

import { useState, useEffect } from "react";
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
import { loadWeekPlan, saveWeekPlan, loadCustomRecipes } from "@/lib/local-store";

// ── Helpers ───────────────────────────────────────────────────────

function getWeekStartISO(offset = 0): string {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay() + offset * 7);
  return sunday.toISOString().split("T")[0];
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
  onSelect,
  onRemove,
  onClose,
}: {
  mealType: MealType;
  currentRecipe: Recipe | null;
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
  const [weekOffset, setWeekOffset] = useState(0);
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

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PickerTarget | null>(null);

  const [sameForAll, setSameForAll] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  const weekLabel = formatWeekRange(weekStart);
  const isCurrentWeek = weekOffset === 0;

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

  function assignRandomRecipe(dayIndex: number, mealType: MealType) {
    const effectiveIdx = sameForAll[mealType] ? 0 : dayIndex;
    const day = plan.days[effectiveIdx];

    // Build pool from custom (AI) + seeded recipes — healthy meals only
    const custom = loadCustomRecipes();
    const seedIds = new Set(ALL_RECIPES.map((r) => r.id));
    const combined = [
      ...custom.filter((r) => !seedIds.has(r.id)),
      ...ALL_RECIPES,
    ];

    const pool = combined.filter((r) => !r.isCheatDay && r.mealType.includes(mealType));
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

    // Build pool — cheat-flagged recipes only
    const custom = loadCustomRecipes();
    const seedIds = new Set(ALL_RECIPES.map((r) => r.id));
    const combined = [
      ...custom.filter((r) => !seedIds.has(r.id)),
      ...ALL_RECIPES,
    ];

    const pool = combined.filter((r) => r.isCheatDay === true);
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

  function toggleSameForAll(mealType: MealType) {
    setSameForAll((prev) => ({ ...prev, [mealType]: !prev[mealType] }));
  }

  const pickerDay = pickerTarget ? plan.days[pickerTarget.dayIndex] : null;
  const pickerCurrentRecipe =
    pickerTarget && pickerDay ? pickerDay.meals[pickerTarget.mealType].recipe : null;

  const filledSlots = plan.days.reduce(
    (sum, d) =>
      sum +
      (d.meals.breakfast.recipe ? 1 : 0) +
      (d.meals.lunch.recipe ? 1 : 0) +
      (d.meals.dinner.recipe ? 1 : 0),
    0
  );
  const totalSlots = 7 * 3;
  const avgCalories = Math.round(
    plan.days.reduce((sum, d) => (
      sum +
      (d.meals.breakfast.recipe?.macros.calories ?? 0) +
      (d.meals.lunch.recipe?.macros.calories ?? 0) +
      (d.meals.dinner.recipe?.macros.calories ?? 0)
    ), 0) / 7
  );
  const cheatMealCount = plan.days.reduce(
    (sum, d) =>
      sum +
      (d.meals.breakfast.recipe?.isCheatDay ? 1 : 0) +
      (d.meals.lunch.recipe?.isCheatDay ? 1 : 0) +
      (d.meals.dinner.recipe?.isCheatDay ? 1 : 0),
    0
  );

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
            <Link
              href="/planner/generate"
              className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground")}
            >
              ✨ Create with Sage
            </Link>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
            {isCurrentWeek && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">This week</span>
            )}
            {weekOffset === 1 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Next week</span>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            Next →
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">
              Today
            </button>
          )}
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
                      isToday ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-transparent"
                    )}>
                      <p className={cn("text-xs font-bold", isToday ? "text-primary" : "text-foreground")}>
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
                  return (
                    <div key={day.day} className="min-h-[130px]">
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
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filledSlots}<span className="text-base font-normal text-muted-foreground">/{totalSlots}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Meals planned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{avgCalories > 0 ? avgCalories : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg cal / day</p>
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
          onSelect={assignRecipe}
          onRemove={removeRecipe}
          onClose={closePicker}
        />
      )}
    </>
  );
}
