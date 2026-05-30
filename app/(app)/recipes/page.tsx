"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALL_RECIPES, type MealType, type Recipe } from "@/lib/meal-data";
import { loadCustomRecipes, loadRecipeTags, saveRecipeTags } from "@/lib/local-store";

const MEAL_FILTERS: { type: MealType | "all"; label: string; emoji: string }[] = [
  { type: "all", label: "All", emoji: "🍽️" },
  { type: "breakfast", label: "Breakfast", emoji: "🌅" },
  { type: "lunch", label: "Lunch", emoji: "☀️" },
  { type: "dinner", label: "Dinner", emoji: "🌙" },
];

const CUISINE_FILTERS = [
  "All", "Japanese", "Mexican", "Greek", "Thai", "Indian", "American", "Mediterranean",
];

// ── Recipe Preview Modal ──────────────────────────────────────────

function RecipePreviewModal({
  recipe,
  saved,
  onClose,
  onSave,
}: {
  recipe: Recipe;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
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
              {/* Meal type + cheat badges */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {recipe.mealType.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize"
                  >
                    {t === "breakfast" ? "🌅" : t === "lunch" ? "☀️" : "🌙"} {t}
                  </span>
                ))}
                {recipe.isCheatDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    🍕 Cheat day
                  </span>
                )}
                {recipe.source === "ai" && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    ✨ Sage
                  </span>
                )}
              </div>

              <h2 className="font-serif text-xl font-bold text-foreground leading-tight">
                {recipe.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                <span>{recipe.cuisine}</span>
                {totalTime > 0 && <span>· ⏱️ {totalTime} min</span>}
                <span>· 👥 {recipe.servings} servings</span>
                <span>· 🔥 {recipe.macros.calories} cal</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {recipe.ingredients.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Ingredients
              </p>
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
              <p className="text-sm font-semibold text-foreground mb-2">
                Instructions
              </p>
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
          {/* Save toggle */}
          <button
            onClick={onSave}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
              saved && "border-accent text-accent hover:bg-accent/5"
            )}
          >
            {saved ? "♥ Favorited" : "♡ Favorite"}
          </button>

          {/* Add to plan */}
          <div className="relative flex-1">
            <button
              onClick={() => setAddOpen((o) => !o)}
              className={cn(
                buttonVariants({ size: "sm" }),
                "w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              + Add to Plan
            </button>
            {addOpen && (
              <div className="absolute bottom-full mb-1 left-0 right-0 z-10 bg-card border border-border rounded-xl shadow-lg p-2">
                <button
                  onClick={() => setAddOpen(false)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
                >
                  📅 This week
                </button>
                <button
                  onClick={() => setAddOpen(false)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
                >
                  ➡️ Next week
                </button>
              </div>
            )}
          </div>

          {/* Full detail page */}
          <Link
            href={`/recipes/${recipe.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0"
            )}
            onClick={onClose}
          >
            Full →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Add to Week dropdown ──────────────────────────────────────────

function AddToWeekMenu({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          buttonVariants({ size: "sm" }),
          "bg-primary hover:bg-primary/90 text-xs gap-1"
        )}
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

const MEAL_TYPE_OPTIONS: { type: MealType; emoji: string; label: string }[] = [
  { type: "breakfast", emoji: "🌅", label: "Breakfast" },
  { type: "lunch",     emoji: "☀️", label: "Lunch" },
  { type: "dinner",    emoji: "🌙", label: "Dinner" },
];

// ── Recipe Card ───────────────────────────────────────────────────

function RecipeCard({
  recipe,
  activeMealTypes,
  saved,
  onSave,
  onPreview,
  onToggleMealType,
}: {
  recipe: Recipe;
  activeMealTypes: MealType[];
  saved: boolean;
  onSave: () => void;
  onPreview: () => void;
  onToggleMealType: (t: MealType) => void;
}) {
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
          {/* Meal type toggles */}
          <div className="flex flex-wrap gap-1">
            {MEAL_TYPE_OPTIONS.map(({ type, emoji, label }) => {
              const active = activeMealTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => onToggleMealType(type)}
                  title={active ? `Remove ${label}` : `Tag as ${label}`}
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all",
                    active
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground border-transparent hover:border-primary/20 hover:text-foreground"
                  )}
                >
                  {emoji} {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={onSave}
            className={cn(
              "shrink-0 text-lg transition-all",
              saved ? "text-accent" : "text-muted-foreground hover:text-accent"
            )}
            title={saved ? "Favorited" : "Add to favorites"}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>

        {/* Title — click to preview */}
        <button
          onClick={onPreview}
          className="block text-left w-full mb-1"
        >
          <h3 className="font-serif text-lg font-bold text-foreground leading-snug hover:text-primary transition-colors">
            {recipe.title}
          </h3>
        </button>
        <p className="text-xs text-muted-foreground mb-3">
          {recipe.cuisine}{totalTime > 0 ? ` · ${totalTime} min` : ""}
        </p>

        {/* Macros grid */}
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
            <Badge key={t} variant="secondary" className="text-[10px] capitalize">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex-1 justify-center text-xs"
            )}
          >
            👁 Preview
          </button>
          <AddToWeekMenu recipe={recipe} />
          <button
            onClick={() => window.open(`/recipes/${recipe.id}`, "_blank")}
            title="Open in new tab"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1 shrink-0"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [mealFilter, setMealFilter] = useState<MealType | "all">("all");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);

  // Load AI-generated recipes from localStorage
  const [customRecipes] = useState<Recipe[]>(() => loadCustomRecipes());

  // Load user-set meal-type tags (overrides / additions per recipe id)
  const [tagOverrides, setTagOverrides] = useState<Record<string, MealType[]>>(
    () => loadRecipeTags()
  );

  // Merge: custom AI recipes first, then seeded recipes (no duplicates)
  const seedIds = new Set(ALL_RECIPES.map((r) => r.id));
  const uniqueCustom = customRecipes.filter((r) => !seedIds.has(r.id));
  const allRecipes = [...uniqueCustom, ...ALL_RECIPES];

  // Resolve the effective meal types for a recipe (override wins if set)
  function effectiveMealTypes(r: Recipe): MealType[] {
    return tagOverrides[r.id] ?? r.mealType;
  }

  function toggleSave(id: string) {
    setSaved((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleMealType(id: string, type: MealType) {
    setTagOverrides((prev) => {
      const current = prev[id] ?? allRecipes.find((r) => r.id === id)?.mealType ?? [];
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      saveRecipeTags(id, next);
      return { ...prev, [id]: next };
    });
  }

  const filtered = allRecipes.filter((r) => {
    const mt = effectiveMealTypes(r);
    if (mealFilter !== "all" && !mt.includes(mealFilter)) return false;
    if (cuisineFilter !== "All" && r.cuisine !== cuisineFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const savedRecipes = allRecipes.filter((r) => saved.has(r.id));

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Recipes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allRecipes.length} recipes · {savedRecipes.length} favorites
            </p>
          </div>
          <Link
            href="/planner/generate"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-accent hover:bg-accent/90 text-accent-foreground"
            )}
          >
            ✨ Generate with Sage
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
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

        {/* Saved recipes */}
        {savedRecipes.length > 0 && (
          <div className="mb-10">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-accent">♥</span> Favorites
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedRecipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  activeMealTypes={effectiveMealTypes(r)}
                  saved={true}
                  onSave={() => toggleSave(r.id)}
                  onPreview={() => setPreviewRecipe(r)}
                  onToggleMealType={(t) => toggleMealType(r.id, t)}
                />
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
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or generate one with Sage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                activeMealTypes={effectiveMealTypes(r)}
                saved={saved.has(r.id)}
                onSave={() => toggleSave(r.id)}
                onPreview={() => setPreviewRecipe(r)}
                onToggleMealType={(t) => toggleMealType(r.id, t)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Preview modal */}
      {previewRecipe && (
        <RecipePreviewModal
          recipe={previewRecipe}
          saved={saved.has(previewRecipe.id)}
          onClose={() => setPreviewRecipe(null)}
          onSave={() => toggleSave(previewRecipe.id)}
        />
      )}
    </>
  );
}
