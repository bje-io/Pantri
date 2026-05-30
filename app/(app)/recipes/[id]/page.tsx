"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_RECIPES, type Recipe } from "@/lib/meal-data";
import { loadCustomRecipes } from "@/lib/local-store";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [checkedIngs, setCheckedIngs] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Try seed data first, then localStorage custom recipes
    const seed = ALL_RECIPES.find((r) => r.id === id);
    if (seed) {
      setRecipe(seed);
      return;
    }
    const custom = loadCustomRecipes().find((r) => r.id === id);
    setRecipe(custom ?? null);
  }, [id]);

  function toggleStep(i: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleIng(i: number) {
    setCheckedIngs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  // Loading
  if (recipe === undefined) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Loading recipe…</p>
      </main>
    );
  }

  // Not found
  if (recipe === null) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-4xl">🍽️</p>
        <p className="font-serif text-xl font-bold text-foreground">Recipe not found</p>
        <p className="text-sm text-muted-foreground">
          This recipe may have been removed or the link is invalid.
        </p>
        <Link href="/recipes" className={cn(buttonVariants({ variant: "outline" }))}>
          ← Back to recipes
        </Link>
      </main>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;
  const total = recipe.macros.protein + recipe.macros.carbs + recipe.macros.fat;
  const completedSteps = checkedSteps.size;
  const progress = recipe.steps.length > 0
    ? Math.round((completedSteps / recipe.steps.length) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/recipes"
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
      >
        ← Back to recipes
      </Link>

      {/* Title block */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {recipe.cuisine}
          </span>
          {recipe.source === "ai" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              ✨ Sage
            </span>
          )}
          {recipe.isCheatDay && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              🍕 Cheat day
            </span>
          )}
        </div>

        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
          {recipe.title}
        </h1>

        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground mt-4">
          {recipe.prepTime > 0 && <span>⏱ Prep {recipe.prepTime} min</span>}
          <span>🔥 Cook {recipe.cookTime} min</span>
          {totalTime > 0 && <span>⏰ Total {totalTime} min</span>}
          <span>🍽 {recipe.servings} servings</span>
        </div>
      </div>

      {/* Macros */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        {total > 0 && (
          <div className="flex rounded-full overflow-hidden h-2 mb-4">
            <div className="bg-primary" style={{ width: `${(recipe.macros.protein / total) * 100}%` }} />
            <div className="bg-accent" style={{ width: `${(recipe.macros.carbs / total) * 100}%` }} />
            <div className="bg-yellow-400" style={{ width: `${(recipe.macros.fat / total) * 100}%` }} />
          </div>
        )}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Calories", value: recipe.macros.calories, unit: "" },
            { label: "Protein", value: recipe.macros.protein, unit: "g" },
            { label: "Carbs", value: recipe.macros.carbs, unit: "g" },
            { label: "Fat", value: recipe.macros.fat, unit: "g" },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-2xl font-bold text-primary">{m.value}{m.unit}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Progress bar (cooking mode) */}
      {recipe.steps.length > 0 && (
        <div className="rounded-2xl border border-border bg-card px-5 py-4 mb-8 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Cooking progress
              </p>
              <p className="text-xs font-bold text-foreground">
                {completedSteps} / {recipe.steps.length} steps
              </p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {completedSteps === recipe.steps.length && completedSteps > 0 && (
            <span className="text-xl shrink-0">🎉</span>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li
                  key={i}
                  onClick={() => toggleIng(i)}
                  className={cn(
                    "flex items-baseline gap-3 text-sm rounded-xl px-3 py-2 cursor-pointer transition-all select-none",
                    checkedIngs.has(i)
                      ? "bg-muted/60 opacity-50 line-through"
                      : "hover:bg-muted/40"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all",
                      checkedIngs.has(i)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {checkedIngs.has(i) && "✓"}
                  </span>
                  {ing.amount && (
                    <span className="font-semibold text-foreground shrink-0">
                      {ing.amount}
                    </span>
                  )}
                  <span className={checkedIngs.has(i) ? "text-muted-foreground" : "text-foreground"}>
                    {ing.item}
                  </span>
                </li>
              ))}
            </ul>
            {checkedIngs.size > 0 && (
              <button
                onClick={() => setCheckedIngs(new Set())}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Reset ingredients
              </button>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="lg:col-span-3">
          <h2 className="font-serif text-xl font-bold text-foreground mb-4">
            Instructions
          </h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li
                key={i}
                onClick={() => toggleStep(i)}
                className={cn(
                  "flex gap-4 rounded-2xl border p-4 cursor-pointer transition-all select-none",
                  checkedSteps.has(i)
                    ? "border-primary/20 bg-primary/5 opacity-60"
                    : "border-border hover:border-primary/30 hover:bg-muted/20"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 h-7 w-7 rounded-full text-sm font-bold flex items-center justify-center transition-all",
                    checkedSteps.has(i)
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {checkedSteps.has(i) ? "✓" : i + 1}
                </span>
                <p
                  className={cn(
                    "leading-relaxed pt-0.5 text-sm sm:text-base",
                    checkedSteps.has(i)
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  {step}
                </p>
              </li>
            ))}
          </ol>

          {checkedSteps.size > 0 && (
            <button
              onClick={() => setCheckedSteps(new Set())}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Reset steps
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
