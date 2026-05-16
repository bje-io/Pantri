import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_RECIPES } from "@/lib/recipes";

const CUISINES = ["All", "Japanese", "Mexican", "Greek", "Thai", "Indian"];
const TAGS = ["quick", "high-protein", "low-carb", "gluten-free", "dairy-free", "meal-prep"];

export default function RecipesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Recipes</h1>
          <p className="text-muted-foreground mt-1">Your saved recipes and community favorites</p>
        </div>
        <Link
          href="/planner/generate"
          className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground")}
        >
          ✨ Generate with AI
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search recipes..."
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}>
          Filters
        </button>
      </div>

      {/* Cuisine filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CUISINES.map((c, i) => (
          <button
            key={c}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              i === 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {TAGS.map((tag) => (
          <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 capitalize">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SEED_RECIPES.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5 block"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {recipe.cuisine}
              </span>
              <span className="text-xs text-muted-foreground">{recipe.prepTime + recipe.cookTime} min</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-3 leading-snug">
              {recipe.title}
            </h3>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted/60 p-2.5 text-center mb-3">
              <div>
                <p className="text-sm font-semibold">{recipe.macros.calories}</p>
                <p className="text-[10px] text-muted-foreground">cal</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{recipe.macros.protein}g</p>
                <p className="text-[10px] text-muted-foreground">protein</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{recipe.macros.carbs}g</p>
                <p className="text-[10px] text-muted-foreground">carbs</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{recipe.macros.fat}g</p>
                <p className="text-[10px] text-muted-foreground">fat</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5 capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state for user recipes */}
      <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-3xl mb-3">🍽️</p>
        <p className="font-medium text-foreground mb-1">Save your own recipes</p>
        <p className="text-sm text-muted-foreground mb-4">
          AI-generated meals and recipes you save will appear here.
        </p>
        <Link href="/planner/generate" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>
          Generate your first AI recipe
        </Link>
      </div>
    </main>
  );
}
