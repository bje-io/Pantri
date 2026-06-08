"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { saveCustomRecipe, saveWeekPlan, loadKitchenProfile, derivedCalories } from "@/lib/local-store";
import type { MealType, Recipe, WeekPlan as StoredWeekPlan } from "@/lib/meal-data";

const EXAMPLE_PROMPTS = [
  "High protein week, no red meat, mix of Asian cuisines",
  "Quick 30-minute meals for busy weeknights",
  "Mediterranean diet, gluten-free, around 500 cal each",
  "Kid-friendly dinners the whole family will love",
];

type GenerateMode = "single" | "week";
type GenerateState = "idle" | "loading" | "done" | "error";

type SingleRecipe = {
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

type DayMeal = {
  name: string;
  description: string;
  calories: number;
  cookTime: number;
  tags: string[];
};

type WeekDay = {
  day: string;
  breakfast: DayMeal;
  lunch: DayMeal;
  dinner: DayMeal;
};

type WeekPlan = { days: WeekDay[] };

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
};

export default function GeneratePage() {
  const [mode, setMode] = useState<GenerateMode>("single");
  // Meal type for single-recipe mode — determines calorie share, cook time, food conventions
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [prompt, setPrompt] = useState("");
  const [calories, setCalories] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("2");
  const [state, setState] = useState<GenerateState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [recipe, setRecipe] = useState<SingleRecipe | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [savedToRecipes, setSavedToRecipes] = useState(false);

  // Week-plan save state
  type WeekSaveMode = "none" | "pick-week" | "select-meals";
  const [weekSaveMode, setWeekSaveMode] = useState<WeekSaveMode>("none");
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set()); // "dayIndex-mealType"
  const [savedAllRecipes, setSavedAllRecipes] = useState(false);
  const [savedWeekStart, setSavedWeekStart] = useState<string | null>(null);
  const [savedPickedCount, setSavedPickedCount] = useState<number | null>(null);

  // Kitchen profile — auto-loaded; useKitchen controls whether it's sent to AI
  const [kitchenProfile, setKitchenProfile] = useState<Record<string, unknown> | null>(null);
  const [useKitchen, setUseKitchen] = useState(true);
  // Cached profile-derived values so we can restore them when re-enabling
  const [profileCals, setProfileCals] = useState("");
  const [profileCookTime, setProfileCookTime] = useState("");
  const [profileServings, setProfileServings] = useState("2");

  useEffect(() => {
    const p = loadKitchenProfile();
    if (p) {
      setKitchenProfile(p);
      // Pre-fill form from profile (user can still override)
      const macros = p.macros as { protein: number; carbs: number; fat: number } | undefined;
      if (macros) {
        const total = derivedCalories(macros);
        const cals = String(Math.round(total / 3));
        setCalories(cals);
        setProfileCals(cals);
      }
      if (p.cookTimeMax) { setCookTime(String(p.cookTimeMax)); setProfileCookTime(String(p.cookTimeMax)); }
      if (p.servings)    { setServings(String(p.servings));    setProfileServings(String(p.servings)); }
    }
  }, []);

  function toggleKitchen(next: boolean) {
    setUseKitchen(next);
    if (next) {
      // Restore profile-derived form values
      if (profileCals)     setCalories(profileCals);
      if (profileCookTime) setCookTime(profileCookTime);
      if (profileServings) setServings(profileServings);
    } else {
      // Clear the profile-derived pre-fills so user starts fresh
      setCalories("");
      setCookTime("");
    }
  }

  // Derived display values from kitchen profile
  const profileMacros  = kitchenProfile?.macros as { protein: number; carbs: number; fat: number } | undefined;
  const totalDailyCals = profileMacros ? derivedCalories(profileMacros) : null;
  // Per-meal calorie target adjusts to the meal type share (breakfast 25%, lunch 35%, dinner 40%)
  const MEAL_SHARES: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.40 };
  const activeMealShare = mode === "single" ? (MEAL_SHARES[mealType] ?? 1 / 3) : 1 / 3;
  const perMealCals    = totalDailyCals ? Math.round(totalDailyCals * activeMealShare) : null;
  const dietaryPrefs   = (kitchenProfile?.dietaryPrefs as string[] | undefined) ?? [];
  const allergies      = (kitchenProfile?.allergies    as string[] | undefined) ?? [];

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setState("loading");
    setErrorMsg("");
    setRecipe(null);
    setWeekPlan(null);
    setSavedToRecipes(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          calories,
          cookTime,
          servings,
          kitchenProfile: useKitchen ? kitchenProfile : null,
          mealType: mode === "single" ? mealType : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error === "needs-key" ? "needs-key" : (data.error || "Something went wrong. Please try again."));
        setState("error");
        return;
      }

      if (mode === "single") {
        const r: SingleRecipe = data.recipe;
        setRecipe(r);
        saveCustomRecipe({
          id: `sage-${Date.now()}`,
          title: r.name,
          cuisine: r.cuisine,
          mealType: [mealType], // use the selected meal type
          cookTime: r.cookTime,
          prepTime: 0,
          servings: r.servings,
          macros: { calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat },
          ingredients: r.ingredients.map((ing) => ({ amount: "", item: ing })),
          steps: r.instructions,
          tags: [...(r.tags ?? []), "Sage"],
          source: "ai",
        });
        setSavedToRecipes(true);
      } else {
        setWeekPlan(data.plan);
      }
      setState("done");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  function handleExampleClick(p: string) {
    setPrompt(p);
    setState("idle");
  }

  function handleReset() {
    setState("idle");
    setRecipe(null);
    setWeekPlan(null);
    setErrorMsg("");
    setSavedToRecipes(false);
    setWeekSaveMode("none");
    setSelectedMeals(new Set());
    setSavedAllRecipes(false);
    setSavedWeekStart(null);
    setSavedPickedCount(null);
  }

  // ── Week-plan helpers ──────────────────────────────────────────

  function getUpcomingWeeks(count: number) {
    const now = new Date();
    const thisSunday = new Date(now);
    thisSunday.setDate(now.getDate() - now.getDay());
    thisSunday.setHours(0, 0, 0, 0);
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(thisSunday);
      d.setDate(thisSunday.getDate() + i * 7);
      const iso = d.toISOString().split("T")[0];
      const label =
        i === 0 ? "This week" :
        i === 1 ? "Next week" :
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return { weekStart: iso, label };
    });
  }

  function buildRecipe(meal: DayMeal, mealType: MealType, id: string): Recipe {
    return {
      id,
      title: meal.name,
      cuisine: "International",
      mealType: [mealType],
      cookTime: meal.cookTime,
      prepTime: 0,
      servings: 2,
      macros: { calories: meal.calories, protein: 0, carbs: 0, fat: 0 },
      ingredients: [],
      steps: [],
      tags: [...(meal.tags ?? []), "Sage"],
      source: "ai",
    };
  }

  function saveAllWeekRecipes() {
    if (!weekPlan) return;
    weekPlan.days.forEach((day, di) => {
      (["breakfast", "lunch", "dinner"] as const).forEach((mealType) => {
        saveCustomRecipe(buildRecipe(day[mealType], mealType, `sage-week-${di}-${mealType}-${Date.now()}`));
      });
    });
    setSavedAllRecipes(true);
  }

  function addWeekToPlanner(weekStart: string) {
    if (!weekPlan) return;
    const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const recipesMap: Record<string, Recipe> = {};
    weekPlan.days.forEach((day, di) => {
      (["breakfast", "lunch", "dinner"] as const).forEach((mealType) => {
        const id = `sage-${weekStart}-d${di}-${mealType}`;
        const r = buildRecipe(day[mealType], mealType, id);
        saveCustomRecipe(r);
        recipesMap[`${di}-${mealType}`] = r;
      });
    });
    const plan: StoredWeekPlan = {
      weekStart,
      days: DAYS.map((dayName, di) => ({
        day: dayName,
        isCheatDay: false,
        meals: {
          breakfast: { recipe: recipesMap[`${di}-breakfast`] ?? null },
          lunch:     { recipe: recipesMap[`${di}-lunch`]     ?? null },
          dinner:    { recipe: recipesMap[`${di}-dinner`]    ?? null },
        },
      })),
    };
    saveWeekPlan(plan);
    setSavedWeekStart(weekStart);
    setWeekSaveMode("none");
  }

  function toggleMealSelection(key: string) {
    setSelectedMeals((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function savePickedMeals() {
    if (!weekPlan) return;
    let count = 0;
    weekPlan.days.forEach((day, di) => {
      (["breakfast", "lunch", "dinner"] as const).forEach((mealType) => {
        const key = `${di}-${mealType}`;
        if (!selectedMeals.has(key)) return;
        saveCustomRecipe(buildRecipe(day[mealType], mealType, `sage-pick-${di}-${mealType}-${Date.now()}`));
        count++;
      });
    });
    setSavedPickedCount(count);
    setWeekSaveMode("none");
    setSelectedMeals(new Set());
  }

  const totalMacros = recipe ? recipe.protein + recipe.carbs + recipe.fat : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/planner" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          ← Back to planner
        </Link>
        <div className="flex items-center gap-3 mt-2 mb-2">
          <span className="text-3xl">✨</span>
          <h1 className="font-serif text-3xl font-bold text-foreground">AI Meal Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Describe what you want — a single meal or a full week — and Sage will build it for you.
        </p>
      </div>

      {/* Error: needs API key */}
      {state === "error" && errorMsg === "needs-key" && (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔑</span>
            <div>
              <p className="font-semibold text-foreground mb-1">Anthropic API key required</p>
              <p className="text-sm text-muted-foreground mb-3">Add your key to Vercel Environment Variables:</p>
              <pre className="bg-muted rounded-xl px-4 py-3 text-xs font-mono text-foreground mb-3 overflow-x-auto">
                ANTHROPIC_API_KEY=sk-ant-...
              </pre>
              <p className="text-xs text-muted-foreground">
                Get your key at{" "}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  console.anthropic.com
                </a>
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Error: general */}
      {state === "error" && errorMsg !== "needs-key" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <button onClick={handleReset} className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground ml-4">
            Try again
          </button>
        </div>
      )}

      {/* Result: Single Recipe */}
      {state === "done" && recipe && (
        <div className="mb-8">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-primary/5 border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-1">{recipe.name}</h2>
                  <p className="text-sm text-muted-foreground">{recipe.description}</p>
                </div>
                <span className="text-3xl shrink-0">
                  {recipe.cuisine === "Thai" ? "🇹🇭" : recipe.cuisine === "Italian" ? "🇮🇹" : recipe.cuisine === "Mexican" ? "🇲🇽" : recipe.cuisine === "Japanese" ? "🇯🇵" : recipe.cuisine === "Indian" ? "🇮🇳" : recipe.cuisine === "Mediterranean" ? "🫒" : recipe.cuisine === "American" ? "🍔" : "🍽️"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { icon: "⏱️", label: `${recipe.cookTime} min` },
                  { icon: "👥", label: `${recipe.servings} servings` },
                  { icon: "🔥", label: `${recipe.calories} cal` },
                ].map((s) => (
                  <span key={s.label} className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-xs font-medium text-foreground">
                    {s.icon} {s.label}
                  </span>
                ))}
                {recipe.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Macros per serving</p>
                <div className="flex rounded-full overflow-hidden h-2 mb-3">
                  <div className="bg-primary" style={{ width: `${(recipe.protein / totalMacros) * 100}%` }} />
                  <div className="bg-accent" style={{ width: `${(recipe.carbs / totalMacros) * 100}%` }} />
                  <div className="bg-yellow-400" style={{ width: `${(recipe.fat / totalMacros) * 100}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span><span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />Protein {recipe.protein}g</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-accent mr-1" />Carbs {recipe.carbs}g</span>
                  <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />Fat {recipe.fat}g</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Ingredients</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Instructions</p>
                <ol className="space-y-3">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Link href="/planner" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 text-primary-foreground")}>
              📅 Add to This Week
            </Link>
            <button onClick={handleReset} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ✨ Generate Another
            </button>
            {savedToRecipes && (
              <Link href="/recipes" className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1.5 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                ✓ Saved to your recipes →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Result: Week Plan */}
      {state === "done" && weekPlan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Your week is ready ✨</h2>
            <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
              Regenerate
            </button>
          </div>

          {/* Day cards */}
          <div className="space-y-3">
            {weekPlan.days.map((day, di) => (
              <div key={day.day} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">{day.day}</p>
                </div>
                <div className="divide-y divide-border">
                  {(["breakfast", "lunch", "dinner"] as const).map((mealType) => {
                    const meal = day[mealType];
                    const key = `${di}-${mealType}`;
                    const isSelected = selectedMeals.has(key);
                    return (
                      <div
                        key={mealType}
                        className={cn(
                          "px-4 py-3 flex items-start gap-3 transition-colors",
                          weekSaveMode === "select-meals" && isSelected && "bg-primary/5"
                        )}
                      >
                        {/* Checkbox in select mode */}
                        {weekSaveMode === "select-meals" && (
                          <button
                            type="button"
                            onClick={() => toggleMealSelection(key)}
                            className={cn(
                              "mt-1 shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border bg-background"
                            )}
                          >
                            {isSelected && <span className="text-[10px] font-bold leading-none">✓</span>}
                          </button>
                        )}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="text-lg shrink-0 mt-0.5">{MEAL_ICONS[mealType]}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground capitalize mb-0.5">{mealType}</p>
                            <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{meal.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">🔥 {meal.calories} cal</p>
                          <p className="text-xs text-muted-foreground">⏱️ {meal.cookTime}m</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Action panel */}
          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-4">What would you like to do with this week?</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {/* Save all */}
              <button
                onClick={saveAllWeekRecipes}
                disabled={savedAllRecipes}
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  savedAllRecipes && "opacity-60 cursor-default"
                )}
              >
                {savedAllRecipes ? "✓ All recipes saved" : "📚 Save all to My Recipes"}
              </button>

              {/* Add to a week */}
              <button
                onClick={() => setWeekSaveMode(weekSaveMode === "pick-week" ? "none" : "pick-week")}
                className={cn(
                  buttonVariants({ size: "sm", variant: weekSaveMode === "pick-week" ? "default" : "outline" }),
                  weekSaveMode === "pick-week" && "bg-primary text-primary-foreground"
                )}
              >
                📅 Add to a week
              </button>

              {/* Select individual meals */}
              <button
                onClick={() => {
                  if (weekSaveMode === "select-meals") {
                    setWeekSaveMode("none");
                    setSelectedMeals(new Set());
                  } else {
                    setWeekSaveMode("select-meals");
                  }
                }}
                className={cn(
                  buttonVariants({ size: "sm", variant: weekSaveMode === "select-meals" ? "default" : "outline" }),
                  weekSaveMode === "select-meals" && "bg-primary text-primary-foreground"
                )}
              >
                ☑️ Select meals
              </button>
            </div>

            {/* Week picker */}
            {weekSaveMode === "pick-week" && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Choose which week to fill:</p>
                <div className="flex flex-wrap gap-2">
                  {getUpcomingWeeks(5).map(({ weekStart, label }) => (
                    <button
                      key={weekStart}
                      onClick={() => addWeekToPlanner(weekStart)}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        savedWeekStart === weekStart
                          ? "bg-green-600 hover:bg-green-600 text-white"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                    >
                      {savedWeekStart === weekStart ? `✓ ${label}` : label}
                    </button>
                  ))}
                </div>
                {savedWeekStart && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                    ✓ Added to planner —{" "}
                    <Link href="/planner" className="underline underline-offset-2">
                      go to planner →
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Select meals — save button + instructions */}
            {weekSaveMode === "select-meals" && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Tap the meals above you want to keep, then save.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={savePickedMeals}
                    disabled={selectedMeals.size === 0}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      selectedMeals.size === 0
                        ? "opacity-40 cursor-not-allowed bg-primary text-primary-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    Save {selectedMeals.size > 0 ? `${selectedMeals.size} ` : ""}selected
                  </button>
                  <button
                    onClick={() => { setWeekSaveMode("none"); setSelectedMeals(new Set()); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation messages */}
            {savedPickedCount !== null && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                ✓ {savedPickedCount} recipe{savedPickedCount !== 1 ? "s" : ""} saved to{" "}
                <Link href="/recipes" className="underline underline-offset-2">My Recipes →</Link>
              </p>
            )}
            {savedAllRecipes && !savedPickedCount && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                ✓ All 21 recipes saved to{" "}
                <Link href="/recipes" className="underline underline-offset-2">My Recipes →</Link>
              </p>
            )}
          </div>

          <button onClick={handleReset} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
            ✨ Generate Again
          </button>
        </div>
      )}

      {/* Form — always show when idle/error, hide when done */}
      {state !== "done" && (
        <>
          {/* Kitchen Profile Banner */}
          {kitchenProfile ? (
            <div className={cn(
              "rounded-2xl border p-4 mb-6 transition-all",
              useKitchen
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-muted/20"
            )}>
              {/* Header row: icon + label + toggle + edit link */}
              <div className="flex items-center gap-3 mb-3">
                <span className={cn("text-lg transition-opacity", !useKitchen && "opacity-40")}>🍽️</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", useKitchen ? "text-foreground" : "text-muted-foreground")}>
                    {useKitchen ? "Kitchen profile active" : "Kitchen profile off"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {useKitchen
                      ? "Sage will follow your calorie targets, macros & restrictions"
                      : "Sage will use your prompt only — no calorie or macro targets"}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={useKitchen}
                  onClick={() => toggleKitchen(!useKitchen)}
                  className={cn(
                    "relative shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    useKitchen ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    useKitchen ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>

                <Link href="/kitchen" className={cn("text-xs shrink-0 mt-0.5 transition-colors", useKitchen ? "text-primary hover:underline" : "text-muted-foreground hover:text-foreground")}>
                  Edit →
                </Link>
              </div>

              {/* Macro / restriction chips — only when active */}
              {useKitchen && (
                <div className="flex flex-wrap gap-1.5">
                  {perMealCals && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-border text-xs font-medium text-foreground">
                      🔥 ~{perMealCals} cal
                      {mode === "single"
                        ? ` (${mealType})`
                        : "/meal"}
                    </span>
                  )}
                  {profileMacros && (
                    <>
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                        P {Math.round(profileMacros.protein * activeMealShare)}g
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                        C {Math.round(profileMacros.carbs * activeMealShare)}g
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        F {Math.round(profileMacros.fat * activeMealShare)}g
                      </span>
                    </>
                  )}
                  {dietaryPrefs.map((pref) => (
                    <span key={pref} className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs font-medium text-green-700 dark:text-green-400 capitalize">
                      ✓ {pref}
                    </span>
                  ))}
                  {allergies.map((a) => (
                    <span key={a} className="px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive capitalize">
                      ⚠ no {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">🍽️</span>
                <p className="text-sm text-muted-foreground">No kitchen profile saved — Sage will use your prompt only.</p>
              </div>
              <Link href="/kitchen" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
                Set up My Kitchen →
              </Link>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border bg-muted/30 p-1 mb-4 w-fit">
            {(["single", "week"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-5 py-1.5 rounded-lg text-sm font-medium transition-all",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "single" ? "Single meal" : "Full week"}
              </button>
            ))}
          </div>

          {/* Meal type picker — single mode only */}
          {mode === "single" && (
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Meal type
              </p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { type: "breakfast" as const, emoji: "🌅", label: "Breakfast", sub: "25% of daily cal · quick prep" },
                    { type: "lunch"     as const, emoji: "☀️", label: "Lunch",     sub: "35% of daily cal · midday fuel" },
                    { type: "dinner"    as const, emoji: "🌙", label: "Dinner",    sub: "40% of daily cal · hearty meal" },
                  ] as const
                ).map(({ type, emoji, label, sub }) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all",
                      mealType === type
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <span className="text-xl shrink-0">{emoji}</span>
                    <div>
                      <p className={cn("text-sm font-semibold leading-none", mealType === type ? "text-primary" : "text-foreground")}>
                        {label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                    {mealType === type && (
                      <span className="ml-auto shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] text-primary-foreground font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt input */}
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              {mode === "single" ? "What meal are you looking for?" : "Describe your ideal week"}
            </label>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
              rows={3}
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); if (state === "error") setState("idle"); }}
              placeholder={
                mode === "single"
                  ? "e.g. Healthy Thai dinner under 600 calories, ready in 30 minutes..."
                  : "e.g. High protein, no red meat, mix of Asian cuisines, under 500 cal each..."
              }
            />

            {/* Overrides — hidden when kitchen profile is active */}
            {!(kitchenProfile && useKitchen) && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Optional constraints</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Max calories", value: calories, set: setCalories, placeholder: "e.g. 600" },
                    { label: "Max cook time (min)", value: cookTime, set: setCookTime, placeholder: "e.g. 30" },
                    { label: "Servings", value: servings, set: setServings, placeholder: "e.g. 2" },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || state === "loading"}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full mt-5 justify-center gap-2 transition-all",
                !prompt.trim() || state === "loading"
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {state === "loading" ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  {mode === "single" ? "Crafting your recipe..." : "Building your week..."}
                </>
              ) : (
                `✨ Generate ${mode === "single" ? "recipe" : "meal plan"}`
              )}
            </button>

            {state === "loading" && (
              <p className="text-center text-xs text-muted-foreground mt-2 animate-pulse">
                Sage is cooking up something delicious{mode === "week" ? " — this may take a few seconds" : ""}…
              </p>
            )}
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Try one of these</p>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleExampleClick(p)}
                  className={cn(
                    "w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-all",
                    prompt === p && "border-primary bg-primary/5 text-foreground"
                  )}
                >
                  <span className="mr-2 text-primary">→</span>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
