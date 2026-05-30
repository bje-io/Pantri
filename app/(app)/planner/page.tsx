"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  WEEK_DAYS,
  buildDefaultWeekPlan,
  ALL_RECIPES,
  type WeekPlan,
  type MealType,
  type Recipe,
} from "@/lib/meal-data";

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

// ── AI result type ────────────────────────────────────────────────

type AIRecipeResult = {
  name: string;
  description: string;
  cuisine: string;
  cookTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
};

function convertAIToRecipe(gen: AIRecipeResult, mealType: MealType): Recipe {
  return {
    id: `ai-${Date.now()}`,
    title: gen.name,
    cuisine: gen.cuisine,
    mealType: [mealType],
    cookTime: gen.cookTime,
    prepTime: 0,
    servings: gen.servings,
    macros: {
      calories: gen.calories,
      protein: gen.protein,
      carbs: gen.carbs,
      fat: gen.fat,
    },
    ingredients: gen.ingredients.map((ing) => ({ amount: "", item: ing })),
    steps: gen.instructions,
    tags: gen.tags,
    source: "ai",
  };
}

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
  onRegenerate,
}: {
  recipe: Recipe;
  isRegenerating: boolean;
  onClose: () => void;
  onSwap: () => void;
  onRegenerate: () => void;
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

          {/* Macros bar */}
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
                    <span>
                      {ing.amount ? `${ing.amount} ${ing.item}` : ing.item}
                    </span>
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
            onClick={() => { onRegenerate(); onClose(); }}
            disabled={isRegenerating}
            className={cn(
              buttonVariants({ size: "sm" }),
              "flex-1 justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-60"
            )}
          >
            {isRegenerating ? (
              <><span className="animate-spin inline-block">⟳</span> Generating...</>
            ) : (
              "✨ Regenerate"
            )}
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
  isCheatDay,
  currentRecipe,
  onSelect,
  onRemove,
  onClose,
}: {
  mealType: MealType;
  isCheatDay: boolean;
  currentRecipe: Recipe | null;
  onSelect: (recipe: Recipe) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const pool = ALL_RECIPES.filter((r) => {
    if (isCheatDay) return true;
    if (r.isCheatDay) return false;
    return r.mealType.includes(mealType);
  });

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
              {isCheatDay ? "🍕 Pick a cheat meal" : `Pick a ${mealType}`}
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
                    {recipe.isCheatDay && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 rounded-full shrink-0">
                        🍕 Cheat
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recipe.cuisine} · {totalTime} min
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    {recipe.macros.calories}
                  </p>
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
            ✨ Generate a new recipe with Sage
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Meal Slot Card ────────────────────────────────────────────────

function MealSlotCard({
  recipe,
  mealType,
  isCheatDay,
  isRegenerating,
  onOpen,
  onPreview,
  onRegenerate,
}: {
  recipe: Recipe | null;
  mealType: MealType;
  isCheatDay: boolean;
  isRegenerating: boolean;
  onOpen: () => void;
  onPreview: (recipe: Recipe) => void;
  onRegenerate: () => void;
}) {
  if (isRegenerating) {
    return (
      <div
        className={cn(
          "w-full min-h-[84px] rounded-xl border flex flex-col items-center justify-center gap-1.5 animate-pulse",
          isCheatDay
            ? "border-accent/30 bg-accent/5"
            : "border-primary/20 bg-primary/5"
        )}
      >
        <span className="text-lg animate-spin inline-block">✨</span>
        <span className="text-[10px] text-muted-foreground font-medium">
          Sage is cooking…
        </span>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="relative w-full min-h-[84px]">
        <button
          onClick={onOpen}
          className={cn(
            "w-full h-full min-h-[84px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-foreground group",
            isCheatDay
              ? "border-accent/30 hover:border-accent/60 hover:bg-accent/5"
              : "border-border hover:border-primary/40 hover:bg-primary/5"
          )}
        >
          <span
            className={cn(
              "text-xl transition-transform group-hover:scale-110",
              isCheatDay ? "text-accent/70" : ""
            )}
          >
            {isCheatDay ? "🍕" : "+"}
          </span>
          <span className="text-[10px] font-medium">
            {isCheatDay ? "Cheat meal" : "Add meal"}
          </span>
        </button>
        {/* Regenerate with Sage for empty slot */}
        <button
          onClick={onRegenerate}
          title="Generate with Sage"
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center text-[11px] transition-all"
        >
          ✨
        </button>
      </div>
    );
  }

  return (
    <div className="relative group w-full min-h-[84px]">
      {/* Main card body — click to preview */}
      <button
        onClick={() => onPreview(recipe)}
        className={cn(
          "w-full rounded-xl border p-2.5 text-left relative overflow-hidden transition-all hover:shadow-sm min-h-[84px]",
          isCheatDay
            ? "border-accent/40 bg-accent/5 hover:border-accent/70"
            : "border-border bg-card hover:border-primary/30"
        )}
      >
        {isCheatDay && (
          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full border border-accent/20">
            CHEAT
          </span>
        )}
        <p
          className={cn(
            "text-[11px] font-semibold text-foreground leading-tight line-clamp-2",
            isCheatDay ? "mt-4" : "pr-10"
          )}
        >
          {recipe.title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{recipe.cuisine}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-muted-foreground">
            {recipe.macros.calories} cal
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            {recipe.macros.protein}g pro
          </span>
        </div>
        {recipe.source === "ai" && (
          <span className="absolute bottom-1.5 left-1.5 text-[8px] font-medium text-primary/60 bg-primary/5 px-1 py-0.5 rounded-full">
            ✨ Sage
          </span>
        )}
      </button>

      {/* Hover action buttons */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          title="Regenerate with Sage"
          className="w-6 h-6 rounded-full bg-background/95 border border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center text-[11px] shadow-sm transition-all"
        >
          ✨
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          title="Swap recipe"
          className="w-6 h-6 rounded-full bg-background/95 border border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center text-[11px] shadow-sm transition-all"
        >
          ↔
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStartISO(weekOffset);
  const [plan, setPlan] = useState<WeekPlan>(buildDefaultWeekPlan(weekStart));
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PickerTarget | null>(null);
  const [regeneratingSlot, setRegeneratingSlot] = useState<PickerTarget | null>(null);

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

  function closePicker() {
    setPickerTarget(null);
  }

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
    setPlan((prev) => {
      const days = prev.days.map((day, i) => {
        const shouldUpdate = sameForAll[mealType] ? true : i === dayIndex;
        if (!shouldUpdate) return day;
        return { ...day, meals: { ...day.meals, [mealType]: { recipe } } };
      });
      return { ...prev, days };
    });
    closePicker();
  }

  function removeRecipe() {
    if (!pickerTarget) return;
    const { dayIndex, mealType } = pickerTarget;
    setPlan((prev) => {
      const days = prev.days.map((day, i) => {
        if (i !== dayIndex) return day;
        return { ...day, meals: { ...day.meals, [mealType]: { recipe: null } } };
      });
      return { ...prev, days };
    });
    closePicker();
  }

  async function regenerateMeal(dayIndex: number, mealType: MealType) {
    setRegeneratingSlot({ dayIndex, mealType });
    const CUISINES = [
      "Mediterranean", "Thai", "Japanese", "Mexican", "Indian",
      "Italian", "Korean", "Middle Eastern", "Greek", "Vietnamese",
      "American", "French", "Moroccan", "Chinese", "Spanish",
    ];
    try {
      const day = plan.days[dayIndex];
      const currentRecipe = day.meals[mealType].recipe;
      const cuisine = CUISINES[Math.floor(Math.random() * CUISINES.length)];
      const avoidNote = currentRecipe
        ? ` Do NOT make "${currentRecipe.title}" — create something completely different.`
        : "";
      const prompt = `A creative ${cuisine} ${mealType} recipe${
        day.isCheatDay
          ? " (indulgent cheat day, comfort food is great)"
          : " (healthy and nutritious)"
      }.${avoidNote}`;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "single", prompt }),
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.recipe) {
        const recipe = convertAIToRecipe(data.recipe, mealType);
        setPlan((prev) => {
          const days = prev.days.map((d, i) => {
            if (i !== dayIndex) return d;
            return { ...d, meals: { ...d.meals, [mealType]: { recipe } } };
          });
          return { ...prev, days };
        });
      }
    } catch (e) {
      console.error("Regenerate failed", e);
    } finally {
      setRegeneratingSlot(null);
    }
  }

  function toggleCheatDay(dayIndex: number) {
    setPlan((prev) => {
      const days = [...prev.days];
      days[dayIndex] = {
        ...days[dayIndex],
        isCheatDay: !days[dayIndex].isCheatDay,
      };
      return { ...prev, days };
    });
  }

  function toggleSameForAll(mealType: MealType) {
    setSameForAll((prev) => ({ ...prev, [mealType]: !prev[mealType] }));
  }

  const pickerDay = pickerTarget ? plan.days[pickerTarget.dayIndex] : null;
  const pickerCurrentRecipe =
    pickerTarget && pickerDay
      ? pickerDay.meals[pickerTarget.mealType].recipe
      : null;

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
    plan.days.reduce((sum, d) => {
      return (
        sum +
        (d.meals.breakfast.recipe?.macros.calories ?? 0) +
        (d.meals.lunch.recipe?.macros.calories ?? 0) +
        (d.meals.dinner.recipe?.macros.calories ?? 0)
      );
    }, 0) / 7
  );
  const cheatDayCount = plan.days.filter((d) => d.isCheatDay).length;

  return (
    <>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Meal Planner
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tap any slot to preview · hover for ✨ regenerate or ↔ swap
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/kitchen"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              ⚙️ My Goals
            </Link>
            <Link
              href="/grocery"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              🛒 Grocery list
            </Link>
            <Link
              href="/planner/generate"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-accent hover:bg-accent/90 text-accent-foreground"
              )}
            >
              ✨ AI Generate
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
            <span className="text-sm font-semibold text-foreground">
              {weekLabel}
            </span>
            {isCurrentWeek && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                This week
              </span>
            )}
            {weekOffset === 1 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Next week
              </span>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            Next →
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary hover:underline"
            >
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
              {sameForAll[type]
                ? `Same ${label} all week ✓`
                : `Same ${label} weekly`}
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
                    <div
                      className={cn(
                        "rounded-xl p-2 mb-1.5 border transition-all",
                        day.isCheatDay
                          ? "bg-accent/10 border-accent/30"
                          : isToday
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/30 border-transparent"
                      )}
                    >
                      <p
                        className={cn(
                          "text-xs font-bold",
                          isToday ? "text-primary" : "text-foreground"
                        )}
                      >
                        {day.day.slice(0, 3).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleCheatDay(i)}
                      className={cn(
                        "w-full text-[10px] font-medium px-1 py-1 rounded-lg border transition-all",
                        day.isCheatDay
                          ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
                          : "bg-background text-muted-foreground border-border hover:border-accent/40 hover:text-accent"
                      )}
                      title={
                        day.isCheatDay ? "Remove cheat day" : "Mark as cheat day"
                      }
                    >
                      {day.isCheatDay ? "🍕 Cheat" : "Cheat day?"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Meal rows */}
            {MEAL_LABELS.map(({ type, emoji, label }) => (
              <div
                key={type}
                className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 mb-2"
              >
                <div className="flex flex-col items-center justify-center gap-1 py-1">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </span>
                  {sameForAll[type] && (
                    <span className="text-[9px] text-primary font-medium bg-primary/10 px-1 rounded-full">
                      Linked
                    </span>
                  )}
                </div>

                {plan.days.map((day, di) => {
                  const effectiveRecipe = sameForAll[type]
                    ? plan.days[0].meals[type].recipe
                    : day.meals[type].recipe;
                  const slotRegenerating =
                    regeneratingSlot?.dayIndex === di &&
                    regeneratingSlot?.mealType === type;
                  return (
                    <div key={day.day} className="min-h-[84px]">
                      <MealSlotCard
                        recipe={effectiveRecipe}
                        mealType={type}
                        isCheatDay={day.isCheatDay}
                        isRegenerating={slotRegenerating}
                        onOpen={() =>
                          openPicker(sameForAll[type] ? 0 : di, type)
                        }
                        onPreview={(recipe) =>
                          openPreview(
                            recipe,
                            sameForAll[type] ? 0 : di,
                            type
                          )
                        }
                        onRegenerate={() =>
                          regenerateMeal(sameForAll[type] ? 0 : di, type)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {filledSlots}
              <span className="text-base font-normal text-muted-foreground">
                /{totalSlots}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Meals planned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {avgCalories > 0 ? avgCalories : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg cal / day</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-accent">{cheatDayCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cheat days</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
            <Link
              href="/grocery"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-primary hover:bg-primary/90 text-xs w-full justify-center"
              )}
            >
              🛒 Grocery list
            </Link>
          </div>
        </div>

        {/* AI fill CTA */}
        {filledSlots < totalSlots && (
          <div className="mt-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">
                {totalSlots - filledSlots} empty slot
                {totalSlots - filledSlots !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                Let Sage fill them in based on your Kitchen Goals.
              </p>
            </div>
            <Link
              href="/planner/generate"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
              )}
            >
              ✨ Fill with Sage
            </Link>
          </div>
        )}
      </main>

      {/* Recipe preview modal */}
      {previewRecipe && previewTarget && (
        <RecipePreviewModal
          recipe={previewRecipe}
          isRegenerating={
            regeneratingSlot?.dayIndex === previewTarget.dayIndex &&
            regeneratingSlot?.mealType === previewTarget.mealType
          }
          onClose={closePreview}
          onSwap={() => {
            closePreview();
            openPicker(previewTarget.dayIndex, previewTarget.mealType);
          }}
          onRegenerate={() => {
            regenerateMeal(previewTarget.dayIndex, previewTarget.mealType);
          }}
        />
      )}

      {/* Recipe picker modal */}
      {pickerTarget && pickerDay && (
        <RecipePickerModal
          mealType={pickerTarget.mealType}
          isCheatDay={pickerDay.isCheatDay}
          currentRecipe={pickerCurrentRecipe}
          onSelect={assignRecipe}
          onRemove={removeRecipe}
          onClose={closePicker}
        />
      )}
    </>
  );
}
