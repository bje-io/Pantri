"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    // Cheat day slots show cheat recipes + all types; normal slots hide cheat-only
    if (isCheatDay) return true;
    if (r.isCheatDay) return false;
    return r.mealType.includes(mealType);
  });

  const filtered = pool.filter((r) =>
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
        {/* Header */}
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

        {/* Search */}
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

        {/* Recipe list */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {/* Remove option if slot is filled */}
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
                  <p className="text-sm font-bold text-foreground">{recipe.macros.calories}</p>
                  <p className="text-[10px] text-muted-foreground">cal</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <Link
            href="/planner/generate"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-center gap-2"
            )}
            onClick={onClose}
          >
            ✨ Generate a new recipe with AI
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Mini meal slot card ───────────────────────────────────────────

function MealSlotCard({
  recipe,
  mealType,
  isCheatDay,
  onOpen,
}: {
  recipe: Recipe | null;
  mealType: MealType;
  isCheatDay: boolean;
  onOpen: () => void;
}) {
  if (!recipe) {
    return (
      <button
        onClick={onOpen}
        className={cn(
          "w-full h-full min-h-[84px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-foreground group",
          isCheatDay
            ? "border-accent/30 hover:border-accent/60 hover:bg-accent/5"
            : "border-border hover:border-primary/40 hover:bg-primary/5"
        )}
      >
        <span className={cn("text-xl transition-transform group-hover:scale-110", isCheatDay ? "text-accent/70" : "")}>
          {isCheatDay ? "🍕" : "+"}
        </span>
        <span className="text-[10px] font-medium">
          {isCheatDay ? "Cheat meal" : "Add meal"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border p-2.5 text-left group relative overflow-hidden transition-all hover:shadow-sm min-h-[84px]",
        isCheatDay
          ? "border-accent/40 bg-accent/5 hover:border-accent/70"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      {isCheatDay && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full border border-accent/20">
          CHEAT
        </span>
      )}
      {/* Swap hint */}
      <span className="absolute bottom-1.5 right-1.5 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        tap to swap
      </span>
      <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 pr-6">
        {recipe.title}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{recipe.cuisine}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] text-muted-foreground">{recipe.macros.calories} cal</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <span className="text-[10px] text-muted-foreground">{recipe.macros.protein}g pro</span>
      </div>
    </button>
  );
}

// ── Picker state type ─────────────────────────────────────────────

type PickerTarget = {
  dayIndex: number;
  mealType: MealType;
};

// ── Main page ─────────────────────────────────────────────────────

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStartISO(weekOffset);
  const [plan, setPlan] = useState<WeekPlan>(buildDefaultWeekPlan(weekStart));
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const [sameForAll, setSameForAll] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  const weekLabel = formatWeekRange(weekStart);
  const isCurrentWeek = weekOffset === 0;

  // Open picker for a specific slot
  function openPicker(dayIndex: number, mealType: MealType) {
    setPickerTarget({ dayIndex, mealType });
  }

  function closePicker() {
    setPickerTarget(null);
  }

  // Assign a recipe to a slot (respects same-for-all)
  function assignRecipe(recipe: Recipe) {
    if (!pickerTarget) return;
    const { dayIndex, mealType } = pickerTarget;

    setPlan((prev) => {
      const days = prev.days.map((day, i) => {
        // If same-for-all is on for this meal type, update every day
        const shouldUpdate = sameForAll[mealType] ? true : i === dayIndex;
        if (!shouldUpdate) return day;
        return {
          ...day,
          meals: {
            ...day.meals,
            [mealType]: { ...day.meals[mealType], recipe },
          },
        };
      });
      return { ...prev, days };
    });
    closePicker();
  }

  // Remove a recipe from a slot
  function removeRecipe() {
    if (!pickerTarget) return;
    const { dayIndex, mealType } = pickerTarget;
    setPlan((prev) => {
      const days = prev.days.map((day, i) => {
        if (i !== dayIndex) return day;
        return {
          ...day,
          meals: { ...day.meals, [mealType]: { recipe: null } },
        };
      });
      return { ...prev, days };
    });
    closePicker();
  }

  function toggleCheatDay(dayIndex: number) {
    setPlan((prev) => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], isCheatDay: !days[dayIndex].isCheatDay };
      return { ...prev, days };
    });
  }

  function toggleSameForAll(mealType: MealType) {
    setSameForAll((prev) => ({ ...prev, [mealType]: !prev[mealType] }));
  }

  // Current picker context
  const pickerDay = pickerTarget ? plan.days[pickerTarget.dayIndex] : null;
  const pickerCurrentRecipe = pickerTarget && pickerDay
    ? pickerDay.meals[pickerTarget.mealType].recipe
    : null;

  // Summary stats
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
            <h1 className="font-serif text-3xl font-bold text-foreground">Meal Planner</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tap any slot to add or swap a meal
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
            <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
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
                      title={day.isCheatDay ? "Remove cheat day" : "Mark as cheat day"}
                    >
                      {day.isCheatDay ? "🍕 Cheat" : "Cheat day?"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Meal rows */}
            {MEAL_LABELS.map(({ type, emoji, label }) => (
              <div key={type} className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 mb-2">
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
                  return (
                    <div key={day.day} className="min-h-[84px]">
                      <MealSlotCard
                        recipe={effectiveRecipe}
                        mealType={type}
                        isCheatDay={day.isCheatDay}
                        onOpen={() => openPicker(sameForAll[type] ? 0 : di, type)}
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
            <p className="text-2xl font-bold text-primary">{filledSlots}<span className="text-base font-normal text-muted-foreground">/{totalSlots}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Meals planned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{avgCalories > 0 ? avgCalories : "—"}</p>
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
                {totalSlots - filledSlots} empty slot{totalSlots - filledSlots !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                Let AI fill them in based on your Kitchen Goals.
              </p>
            </div>
            <Link
              href="/planner/generate"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
              )}
            >
              ✨ Fill with AI
            </Link>
          </div>
        )}
      </main>

      {/* Recipe picker modal — rendered outside main so it overlays correctly */}
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
