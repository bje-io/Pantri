import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_RECIPES } from "@/lib/recipes";

export function generateStaticParams() {
  return SEED_RECIPES.map((r) => ({ id: r.id }));
}

export default function RecipePage({ params }: { params: { id: string } }) {
  const recipe = SEED_RECIPES.find((r) => r.id === params.id);
  if (!recipe) notFound();

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link href="/recipes" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        ← Back to recipes
      </Link>

      {/* Title block */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {recipe.cuisine}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border capitalize">
            {recipe.source}
          </span>
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">{recipe.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap gap-5 text-sm text-muted-foreground mt-4">
          <span>⏱ Prep {recipe.prepTime} min</span>
          <span>🔥 Cook {recipe.cookTime} min</span>
          <span>⏰ Total {totalTime} min</span>
          <span>🍽 {recipe.servings} servings</span>
        </div>
      </div>

      {/* Macros bar */}
      <div className="grid grid-cols-4 gap-3 rounded-2xl border border-border bg-card p-5 mb-8">
        {[
          { label: "Calories", value: recipe.macros.calories, unit: "" },
          { label: "Protein", value: recipe.macros.protein, unit: "g" },
          { label: "Carbs", value: recipe.macros.carbs, unit: "g" },
          { label: "Fat", value: recipe.macros.fat, unit: "g" },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-2xl font-bold text-primary">{m.value}{m.unit}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {recipe.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="capitalize">{tag}</Badge>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Ingredients</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground">Servings:</span>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
                <button className="text-muted-foreground hover:text-foreground">−</button>
                <span className="text-sm font-medium w-4 text-center">{recipe.servings}</span>
                <button className="text-muted-foreground hover:text-foreground">+</button>
              </div>
            </div>
            <ul className="space-y-2.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span className="font-medium text-foreground shrink-0 w-16 text-right">{ing.amount}</span>
                  <span className="text-muted-foreground">{ing.item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Steps */}
        <div className="lg:col-span-3">
          <h2 className="font-serif text-xl font-bold text-foreground mb-4">Instructions</h2>
          <ol className="space-y-5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-foreground leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          href={`/recipes/${recipe.id}/cook`}
          className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-primary/90")}
        >
          🍳 Start cooking mode
        </Link>
        <button className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          + Add to this week
        </button>
        <button className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          🛒 Add to grocery list
        </button>
      </div>
    </main>
  );
}
