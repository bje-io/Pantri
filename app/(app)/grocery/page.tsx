import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { WEEKLY_MEAL_PLAN } from "@/lib/recipes";

const GROCERY_CATEGORIES = [
  {
    name: "Produce",
    emoji: "🥬",
    items: [
      { name: "Scallions", amount: "1 bunch", checked: false },
      { name: "Cucumber", amount: "1 large", checked: false },
      { name: "Cherry tomatoes", amount: "1 cup", checked: true },
      { name: "Avocado", amount: "1", checked: false },
      { name: "Lime", amount: "2", checked: false },
      { name: "Cilantro", amount: "1 bunch", checked: false },
      { name: "Cauliflower", amount: "1 head", checked: false },
      { name: "Bean sprouts", amount: "1 cup", checked: false },
    ],
  },
  {
    name: "Proteins",
    emoji: "🥩",
    items: [
      { name: "Salmon fillets", amount: "2 × 6 oz", checked: false },
      { name: "Chicken thighs, boneless", amount: "12 oz", checked: false },
      { name: "Ground turkey (93% lean)", amount: "12 oz", checked: false },
      { name: "Large shrimp, peeled", amount: "12 oz", checked: false },
      { name: "Chicken breast, boneless", amount: "14 oz", checked: true },
    ],
  },
  {
    name: "Dairy & Eggs",
    emoji: "🥛",
    items: [
      { name: "Greek yogurt, full fat", amount: "1 cup", checked: false },
      { name: "Heavy cream", amount: "½ cup", checked: false },
      { name: "Eggs", amount: "3", checked: false },
    ],
  },
  {
    name: "Pantry",
    emoji: "🫙",
    items: [
      { name: "White miso paste", amount: "2 tbsp", checked: false },
      { name: "Fish sauce", amount: "3 tbsp", checked: false },
      { name: "Tamarind paste", amount: "2 tbsp", checked: false },
      { name: "Chipotle peppers in adobo", amount: "1 can", checked: false },
      { name: "Fire-roasted diced tomatoes", amount: "1 can (14 oz)", checked: true },
      { name: "Crushed tomatoes", amount: "1 can (14 oz)", checked: false },
      { name: "Coconut cream (alt. heavy cream)", amount: "optional", checked: false },
    ],
  },
  {
    name: "Grains & Noodles",
    emoji: "🍚",
    items: [
      { name: "Jasmine rice", amount: "2 cups dry", checked: false },
      { name: "Flat rice noodles", amount: "8 oz", checked: false },
      { name: "Corn tortillas (small)", amount: "6", checked: false },
      { name: "Pita bread", amount: "2", checked: false },
      { name: "Panko breadcrumbs", amount: "¼ cup", checked: false },
    ],
  },
  {
    name: "Spices & Sauces",
    emoji: "🧂",
    items: [
      { name: "Garam masala", amount: "2 tsp", checked: false },
      { name: "Kashmiri chili powder", amount: "1 tsp", checked: false },
      { name: "Turmeric", amount: "1 tsp", checked: false },
      { name: "Mirin", amount: "1 tbsp", checked: false },
      { name: "Sesame oil", amount: "1 tsp", checked: false },
      { name: "Oyster sauce", amount: "1 tbsp", checked: false },
      { name: "Low-sodium soy sauce", amount: "1 tbsp", checked: false },
    ],
  },
];

const totalItems = GROCERY_CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);
const checkedItems = GROCERY_CATEGORIES.reduce((sum, c) => sum + c.items.filter((i) => i.checked).length, 0);

export default function GroceryPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Grocery List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This week · {checkedItems} of {totalItems} items checked
          </p>
        </div>
        <div className="flex gap-2">
          <button className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Share
          </button>
          <button className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>
            Print
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-full bg-muted h-2 mb-8 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${(checkedItems / totalItems) * 100}%` }}
        />
      </div>

      {/* Source meals */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs text-muted-foreground self-center">Generated from:</span>
        {WEEKLY_MEAL_PLAN.map((day) => (
          <Link
            key={day.day}
            href={`/recipes/${day.recipe.id}`}
            className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            {day.day.slice(0, 3)} · {day.recipe.title}
          </Link>
        ))}
      </div>

      {/* Category lists */}
      <div className="space-y-6">
        {GROCERY_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <span>{cat.emoji}</span>
              {cat.name}
              <span className="text-xs font-normal text-muted-foreground">
                ({cat.items.filter((i) => i.checked).length}/{cat.items.length})
              </span>
            </h2>
            <ul className="space-y-1.5">
              {cat.items.map((item) => (
                <li
                  key={item.name}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors cursor-pointer",
                    item.checked
                      ? "bg-muted/40 border-border opacity-60"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      item.checked
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {item.checked && (
                      <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={cn("flex-1 text-sm", item.checked && "line-through text-muted-foreground")}>
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{item.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Add item */}
      <div className="mt-8 flex gap-2">
        <input
          type="text"
          placeholder="Add an item..."
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 shrink-0")}>
          Add
        </button>
      </div>
    </main>
  );
}
