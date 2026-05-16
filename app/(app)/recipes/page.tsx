"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_RECIPES, type MealType, type Recipe } from "@/lib/meal-data";

const MEAL_FILTERS: { type: MealType | "all"; label: string; emoji: string }[] = [
  { type: "all", label: "All", emoji: "🍽️" },
  { type: "breakfast", label: "Breakfast", emoji: "🌅" },
  { type: "lunch", label: "Lunch", emoji: "☀️" },
  { type: "dinner", label: "Dinner", emoji: "🌙" },
];

const CUISINE_FILTERS = ["All", "Japanese", "Mexican", "Greek", "Thai", "Indian", "American", "Mediterranean"];

function AddToWeekMenu({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 text-xs gap-1")}
      >
        + Add to plan
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[160px]">
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
          >
            📅 This week
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
          >
            ➡️ Next week
          </button>
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, saved, onSave }: { recipe: Recipe; saved: boolean; onSave: () => void }) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const isCheat = recipe.isCheatDay;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-all group",
        isCheat ? "border-accent/40" : "border-border hover:border-primary/30"
      )}
    >
      {/* Color band */}
      <div className={cn("h-1.5", isCheat ? "bg-accent" : "bg-primary/30")} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {recipe.mealType.map((t) => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {t === "breakfast" ? "🌅" : t === "lunch" ? "☀️" : "🌙"} {t}
              </span>
            ))}
            {isCheat && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                🍕 Cheat day
              </span>
            )}
          </div>
          <button
            onClick={onSave}
            className={cn(
              "shrink-0 text-lg transition-all",
              saved ? "text-accent" : "text-muted-foreground hover:text-accent"
            )}
            title={saved ? "Saved" : "Save recipe"}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>

        <Link href={`/recipes/${recipe.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-1">
            {recipe.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-3">{recipe.cuisine} · {totalTime} min</p>

        <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/50 p-2.5 text-center mb-3">
          {[
            { label: "cal", val: recipe.macros.calories },
            { label: "protein", val: `${recipe.macros.protein}g` },
            { label: "carbs", val: `${recipe.macros.carbs}g` },
            { label: "fat", val: `${recipe.macros.fat}g` },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-sm font-bold text-foreground">{m.val}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] capitalize">{t}</Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/recipes/${recipe.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-center text-xs")}
          >
            View recipe
          </Link>
          <AddToWeekMenu recipe={recipe} />
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const [mealFilter, setMealFilter] = useState<MealType | "all">("all");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  function toggleSave(id: string) {
    setSaved((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = ALL_RECIPES.filter((r) => {
    if (mealFilter !== "all" && !r.mealType.includes(mealFilter)) return false;
    if (cuisineFilter !== "All" && r.cuisine !== cuisineFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const savedRecipes = ALL_RECIPES.filter((r) => saved.has(r.id));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Recipes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ALL_RECIPES.length} recipes · {savedRecipes.length} saved
          </p>
        </div>
        <Link
          href="/planner/generate"
          className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground")}
        >
          ✨ Generate with AI
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Meal type filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {MEAL_FILTERS.map((f) => (
          <button
            key={f.type}
            onClick={() => setMealFilter(f.type)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border shrink-0 transition-all",
              mealFilter === f.type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            <span>{f.emoji}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Cuisine filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {CUISINE_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setCuisineFilter(c)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all",
              cuisineFilter === c
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-background text-muted-foreground border-border hover:border-primary/30"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Saved recipes section */}
      {savedRecipes.length > 0 && (
        <div className="mb-10">
          <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-accent">♥</span> Saved Recipes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {savedRecipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} saved={true} onSave={() => toggleSave(r.id)} />
            ))}
          </div>
          <div className="border-t border-border mt-8 mb-6" />
        </div>
      )}

      {/* All recipes */}
      <h2 className="font-serif text-xl font-bold text-foreground mb-4">
        {search || mealFilter !== "all" || cuisineFilter !== "All"
          ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
          : "All Recipes"}
      </h2>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-medium text-foreground mb-1">No recipes found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or generate one with AI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} saved={saved.has(r.id)} onSave={() => toggleSave(r.id)} />
          ))}
        </div>
      )}
    </main>
  );
}
