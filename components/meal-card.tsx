import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MealPlanDay } from "@/lib/recipes";

const CUISINE_EMOJI: Record<string, string> = {
  Japanese: "🇯🇵",
  Mexican: "🇲🇽",
  Greek: "🇬🇷",
  Thai: "🇹🇭",
  Indian: "🇮🇳",
};

const DAY_COLORS: Record<string, string> = {
  Monday: "bg-pantri-green/10 text-pantri-green border-pantri-green/20",
  Tuesday: "bg-pantri-terracotta/10 text-pantri-terracotta border-pantri-terracotta/20",
  Wednesday: "bg-pantri-green/10 text-pantri-green border-pantri-green/20",
  Thursday: "bg-pantri-terracotta/10 text-pantri-terracotta border-pantri-terracotta/20",
  Friday: "bg-pantri-green/10 text-pantri-green border-pantri-green/20",
};

type Props = {
  day: MealPlanDay;
  index: number;
};

export default function MealCard({ day, index }: Props) {
  const { recipe } = day;
  const emoji = CUISINE_EMOJI[recipe.cuisine] ?? "🍽️";

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block h-full">
      <Card className="h-full border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DAY_COLORS[day.day]}`}
            >
              {day.day}
            </span>
            <span className="text-xl">{emoji}</span>
          </div>
          <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
          <p className="text-xs text-muted-foreground">{recipe.cuisine} cuisine</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.prepTime + recipe.cookTime} min
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {recipe.servings} servings
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted/60 p-2.5 text-center">
            <div>
              <p className="text-sm font-semibold text-foreground">{recipe.macros.calories}</p>
              <p className="text-[10px] text-muted-foreground">cal</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{recipe.macros.protein}g</p>
              <p className="text-[10px] text-muted-foreground">protein</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{recipe.macros.carbs}g</p>
              <p className="text-[10px] text-muted-foreground">carbs</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{recipe.macros.fat}g</p>
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
        </CardContent>
      </Card>
    </Link>
  );
}
