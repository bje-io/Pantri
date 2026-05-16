"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  WEEK_DAYS,
  buildDefaultWeekPlan,
  type WeekPlan,
  type MealType,
  type Recipe,
} from "@/lib/meal-data";

// ── Helpers ──────────────────────────────────────────────────────

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
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

const MEAL_LABELS: { type: MealType; emoji: string; label: string }[] = [
  { type: "breakfast", emoji: "🌅", label: "Breakfast" },
  { type: "lunch", emoji: "☀️", label: "Lunch" },
  { type: "dinner", emoji: "🌙", label: "Dinner" },
];

const CHEAT_DAY_BG = "bg-[oklch(0.97_0.04_42)] dark:bg-[oklch(0.22_0.04_42)]";
const CHEAT_DAY_BORDER = "border-accent/40";

// ── Mini meal slot card ───────────────────────────────────────────

function MealSlotCard({
  recipe,
  mealType,
  isCheatDay,
  onAdd,
  onSwap,
}: {
  recipe: Recipe | null;
  mealType: MealType;
  isCheatDay: boolean;
  onAdd: () => void;
  onSwap: () => void;
}) {
  if (!recipe) {
    return (
      <button
        onClick={onAdd}
        className={cn(
          "w-full h-full min-h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5",
          isCheatDay ? "border-accent/30 hover:border-accent/60" : "border-border"
        )}
      >
        <span className="text-lg">{isCheatDay ? "🍕" : "+"}</span>
        <span className="text-[10px] font-medium">
          {isCheatDay ? "Add cheat meal" : "Add meal"}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 text-left group relative overflow-hidden transition-all hover:shadow-sm cursor-pointer",
        isCheatDay ? "border-accent/40 bg-accent/5" : "border-border bg-card hover:border-primary/30"
      )}
      onClick={onSwap}
    >
      {isCheatDay && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
          CHEAT
        </span>
      )}
      <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 pr-6">
        {recipe.title}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{recipe.cuisine}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] text-muted-foreground">{recipe.macros.calories} cal</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <span className="text-[10px] text-muted-foreground">{recipe.macros.protein}g protein</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStartISO(weekOffset);
  const [plan, setPlan] = useState<WeekPlan>(buildDefaultWeekPlan(weekStart));

  // "Same for all" state per meal type
  const [sameForAll, setSameForAll] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  const weekLabel = formatWeekRange(weekStart);
  const isCurrentWeek = weekOffset === 0;

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

  // Summary stats
  const filledSlots = plan.days.reduce((sum, d) =>
    sum + (d.meals.breakfast.recipe ? 1 : 0) + (d.meals.lunch.recipe ? 1 : 0) + (d.meals.dinner.recipe ? 1 : 0), 0
  );
  const totalSlots = 7 * 3;
  const avgCalories = Math.round(
    plan.days.reduce((sum, d) => {
      const b = d.meals.breakfast.recipe?.macros.calories ?? 0;
      const l = d.meals.lunch.recipe?.macros.calories ?? 0;
      const dn = d.meals.dinner.recipe?.macros.calories ?? 0;
      return sum + b + l + dn;
    }, 0) / 7
  );
  const cheatDays = plan.days.filter((d) => d.isCheatDay).length;

  return (
    <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Meal Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan breakfast, lunch & dinner for every day of the week</p>
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
            ✨ AI Generate
          </Link>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
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
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Next →
        </button>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-primary hover:underline ml-2"
          >
            Back to today
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
            {sameForAll[type] ? `Same ${label} all week` : `Vary ${label} daily`}
          </button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-1">
          Tap to lock a meal type across all days
        </span>
      </div>

      {/* Grid — days × meals */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[900px]">
          {/* Day headers */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
            <div />
            {plan.days.map((day, i) => {
              const date = new Date(weekStart);
              date.setDate(date.getDate() + i);
              const isToday = weekOffset === 0 && new Date().getDay() === i;
              return (
                <div key={day.day} className="text-center">
                  <div
                    className={cn(
                      "rounded-xl p-2 mb-1 border transition-all",
                      day.isCheatDay
                        ? `${CHEAT_DAY_BG} ${CHEAT_DAY_BORDER}`
                        : isToday
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-transparent"
                    )}
                  >
                    <p className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-foreground")}>
                      {day.day.slice(0, 3).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                    </p>
                  </div>
                  {/* Cheat day toggle */}
                  <button
                    onClick={() => toggleCheatDay(i)}
                    className={cn(
                      "w-full text-[10px] font-medium px-2 py-1 rounded-lg border transition-all",
                      day.isCheatDay
                        ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
                        : "bg-background text-muted-foreground border-border hover:border-accent/40 hover:text-accent"
                    )}
                    title={day.isCheatDay ? "Remove cheat day" : "Mark as cheat day"}
                  >
                    {day.isCheatDay ? "🍕 Cheat day" : "Mark cheat"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Meal rows */}
          {MEAL_LABELS.map(({ type, emoji, label }) => (
            <div key={type} className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
              {/* Meal type label */}
              <div className="flex flex-col items-center justify-center gap-1 py-2">
                <span className="text-lg">{emoji}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {label}
                </span>
                {sameForAll[type] && (
                  <span className="text-[9px] text-primary font-medium bg-primary/10 px-1.5 rounded-full">
                    Locked
                  </span>
                )}
              </div>

              {/* Slots for each day */}
              {plan.days.map((day, di) => {
                const slot = day.meals[type];
                const effectiveRecipe = sameForAll[type]
                  ? plan.days[0].meals[type].recipe
                  : slot.recipe;
                return (
                  <div key={day.day} className="min-h-[90px]">
                    <MealSlotCard
                      recipe={effectiveRecipe}
                      mealType={type}
                      isCheatDay={day.isCheatDay}
                      onAdd={() => {}}
                      onSwap={() => {}}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold text-primary">{filledSlots}/{totalSlots}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Meals planned</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold text-primary">{avgCalories}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg cal/day</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xl font-bold text-accent">{cheatDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cheat days</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-2">
          <Link
            href="/grocery"
            className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 text-xs w-full justify-center")}
          >
            🛒 View grocery list
          </Link>
        </div>
      </div>

      {/* AI generate CTA if incomplete */}
      {filledSlots < totalSlots && (
        <div className="mt-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">
              {totalSlots - filledSlots} meal slots are empty
            </p>
            <p className="text-sm text-muted-foreground">
              Let AI fill them based on your Kitchen Goals in seconds.
            </p>
          </div>
          <Link
            href="/planner/generate"
            className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground shrink-0")}
          >
            ✨ Fill with AI
          </Link>
        </div>
      )}
    </main>
  );
}
