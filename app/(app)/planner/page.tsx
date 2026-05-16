import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import MealCard from "@/components/meal-card";
import { WEEKLY_MEAL_PLAN } from "@/lib/recipes";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function PlannerPage() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekLabel = weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Week of {weekLabel}</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">Meal Planner</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/grocery" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            🛒 View grocery list
          </Link>
          <Link
            href="/planner/generate"
            className={cn(buttonVariants({ size: "sm" }), "bg-accent hover:bg-accent/90 text-accent-foreground")}
          >
            ✨ Generate with AI
          </Link>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-4 mb-8">
        <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          ← Prev week
        </button>
        <span className="text-sm font-medium text-foreground px-3 py-1 rounded-full bg-primary/10 text-primary">
          This week
        </span>
        <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          Next week →
        </button>
      </div>

      {/* Meal grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {WEEKLY_MEAL_PLAN.map((day, index) => (
          <MealCard key={day.day} day={day} index={index} />
        ))}
      </div>

      {/* Empty days placeholder */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-3xl mb-3">📅</p>
        <p className="font-medium text-foreground mb-1">Weekend meals</p>
        <p className="text-sm text-muted-foreground mb-4">
          Saturday & Sunday are empty — add meals or let AI fill them in.
        </p>
        <Link href="/planner/generate" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>
          ✨ Generate weekend meals
        </Link>
      </div>

      {/* Weekly summary */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Avg calories / day", value: "498" },
          { label: "Avg protein / day", value: "41g" },
          { label: "Total cook time", value: "~2.5 hrs" },
          { label: "Grocery items", value: "47" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
