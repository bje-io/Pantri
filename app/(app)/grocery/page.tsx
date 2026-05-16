"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────

type GroceryItem = {
  id: string;
  name: string;
  amount: string;
  category: string;
  checked: boolean;
  perishable: boolean;
  shelfDays?: number;
  fromMeals: string[];
};

// ── Helpers ───────────────────────────────────────────────────────

function shelfInfo(days: number): { label: string; color: string; tip: string } {
  if (days <= 2) return { label: `${days}d`, color: "bg-destructive/10 text-destructive border-destructive/30", tip: "Use quickly — expires in 1–2 days" };
  if (days <= 5) return { label: `${days}d`, color: "bg-accent/10 text-accent border-accent/30", tip: `Use within ${days} days of purchase` };
  return { label: `${days}d`, color: "bg-primary/10 text-primary border-primary/20", tip: `Good for up to ${days} days` };
}

function getWeekLabel(offset: number): string {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay() + offset * 7);
  const end = new Date(sunday);
  end.setDate(sunday.getDate() + 6);
  return `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// ── Mock data for two weeks ───────────────────────────────────────

const WEEK_DATA: Record<number, GroceryItem[]> = {
  0: [
    // Produce
    { id: "p1", name: "Salmon fillets", amount: "2 × 6 oz", category: "Proteins", checked: false, perishable: true, shelfDays: 2, fromMeals: ["Miso-Glazed Salmon"] },
    { id: "p2", name: "Chicken thighs", amount: "12 oz", category: "Proteins", checked: false, perishable: true, shelfDays: 2, fromMeals: ["Chicken Tinga Tacos"] },
    { id: "p3", name: "Ground turkey", amount: "12 oz", category: "Proteins", checked: true, perishable: true, shelfDays: 2, fromMeals: ["Greek Turkey Meatballs"] },
    { id: "p4", name: "Large shrimp, peeled", amount: "12 oz", category: "Proteins", checked: false, perishable: true, shelfDays: 2, fromMeals: ["Shrimp Pad Thai"] },
    { id: "p5", name: "Chicken breast", amount: "14 oz", category: "Proteins", checked: false, perishable: true, shelfDays: 2, fromMeals: ["Chicken Tikka Masala"] },

    { id: "v1", name: "Scallions", amount: "1 bunch", category: "Produce", checked: false, perishable: true, shelfDays: 7, fromMeals: ["Miso-Glazed Salmon", "Shrimp Pad Thai"] },
    { id: "v2", name: "Avocado", amount: "2", category: "Produce", checked: false, perishable: true, shelfDays: 2, fromMeals: ["Chicken Tinga Tacos"] },
    { id: "v3", name: "Cherry tomatoes", amount: "2 cups", category: "Produce", checked: true, perishable: true, shelfDays: 5, fromMeals: ["Greek Turkey Meatballs", "Mediterranean Bowl"] },
    { id: "v4", name: "Cucumber", amount: "1 large", category: "Produce", checked: false, perishable: true, shelfDays: 7, fromMeals: ["Greek Turkey Meatballs"] },
    { id: "v5", name: "Cauliflower", amount: "1 head", category: "Produce", checked: false, perishable: true, shelfDays: 5, fromMeals: ["Chicken Tikka Masala"] },
    { id: "v6", name: "Fresh cilantro", amount: "1 bunch", category: "Produce", checked: false, perishable: true, shelfDays: 4, fromMeals: ["Chicken Tinga Tacos", "Chicken Tikka Masala"] },
    { id: "v7", name: "Bean sprouts", amount: "1 cup", category: "Produce", checked: false, perishable: true, shelfDays: 3, fromMeals: ["Shrimp Pad Thai"] },
    { id: "v8", name: "Mixed berries", amount: "1 cup", category: "Produce", checked: false, perishable: true, shelfDays: 4, fromMeals: ["Yogurt Parfait"] },
    { id: "v9", name: "Banana", amount: "3", category: "Produce", checked: false, perishable: true, shelfDays: 3, fromMeals: ["Overnight Oats"] },

    { id: "d1", name: "Greek yogurt, full fat", amount: "2 cups", category: "Dairy & Eggs", checked: false, perishable: true, shelfDays: 7, fromMeals: ["Yogurt Parfait", "Greek Turkey Meatballs", "Chicken Tikka Masala"] },
    { id: "d2", name: "Eggs", amount: "6", category: "Dairy & Eggs", checked: false, perishable: true, shelfDays: 21, fromMeals: ["Avocado Toast", "Shrimp Pad Thai"] },
    { id: "d3", name: "Heavy cream", amount: "½ cup", category: "Dairy & Eggs", checked: false, perishable: true, shelfDays: 5, fromMeals: ["Chicken Tikka Masala"] },

    { id: "g1", name: "Jasmine rice", amount: "2 cups dry", category: "Grains & Noodles", checked: false, perishable: false, fromMeals: ["Miso-Glazed Salmon"] },
    { id: "g2", name: "Flat rice noodles", amount: "8 oz", category: "Grains & Noodles", checked: false, perishable: false, fromMeals: ["Shrimp Pad Thai"] },
    { id: "g3", name: "Corn tortillas (small)", amount: "6", category: "Grains & Noodles", checked: true, perishable: false, fromMeals: ["Chicken Tinga Tacos"] },
    { id: "g4", name: "Rolled oats", amount: "1 cup", category: "Grains & Noodles", checked: false, perishable: false, fromMeals: ["Overnight Oats"] },

    { id: "pa1", name: "White miso paste", amount: "2 tbsp", category: "Pantry", checked: false, perishable: false, fromMeals: ["Miso-Glazed Salmon"] },
    { id: "pa2", name: "Fish sauce", amount: "3 tbsp", category: "Pantry", checked: false, perishable: false, fromMeals: ["Shrimp Pad Thai"] },
    { id: "pa3", name: "Tamarind paste", amount: "2 tbsp", category: "Pantry", checked: false, perishable: false, fromMeals: ["Shrimp Pad Thai"] },
    { id: "pa4", name: "Crushed tomatoes (can)", amount: "1 × 14 oz", category: "Pantry", checked: false, perishable: false, fromMeals: ["Chicken Tikka Masala"] },
    { id: "pa5", name: "Chipotle peppers in adobo", amount: "1 can", category: "Pantry", checked: true, perishable: false, fromMeals: ["Chicken Tinga Tacos"] },
  ],
  1: [
    { id: "n1", name: "Ground beef, 80/20", amount: "12 oz", category: "Proteins", checked: false, perishable: true, shelfDays: 2, fromMeals: ["Smash Burger"] },
    { id: "n2", name: "Farro or quinoa", amount: "1 cup dry", category: "Grains & Noodles", checked: false, perishable: false, fromMeals: ["Mediterranean Bowl"] },
    { id: "n3", name: "Chickpeas (can)", amount: "1 × 14 oz", category: "Pantry", checked: false, perishable: false, fromMeals: ["Mediterranean Bowl"] },
    { id: "n4", name: "Deli turkey breast", amount: "8 oz", category: "Proteins", checked: false, perishable: true, shelfDays: 4, fromMeals: ["Turkey Avocado Wrap"] },
    { id: "n5", name: "Feta cheese", amount: "2 oz", category: "Dairy & Eggs", checked: false, perishable: true, shelfDays: 7, fromMeals: ["Mediterranean Bowl"] },
    { id: "n6", name: "Red cabbage", amount: "1 small head", category: "Produce", checked: false, perishable: true, shelfDays: 7, fromMeals: ["Spicy Thai Noodle Salad"] },
    { id: "n7", name: "Brioche buns", amount: "2", category: "Grains & Noodles", checked: false, perishable: true, shelfDays: 5, fromMeals: ["Smash Burger"] },
    { id: "n8", name: "American cheese slices", amount: "4 slices", category: "Dairy & Eggs", checked: false, perishable: true, shelfDays: 14, fromMeals: ["Smash Burger"] },
  ],
};

const CATEGORIES = ["All", "Produce", "Proteins", "Dairy & Eggs", "Grains & Noodles", "Pantry"];
const CATEGORY_EMOJI: Record<string, string> = {
  Produce: "🥬",
  Proteins: "🥩",
  "Dairy & Eggs": "🥛",
  "Grains & Noodles": "🍚",
  Pantry: "🫙",
};

// ── Main page ─────────────────────────────────────────────────────

export default function GroceryPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [catFilter, setCatFilter] = useState("All");
  const [items, setItems] = useState<Record<number, GroceryItem[]>>(WEEK_DATA);
  const [newItem, setNewItem] = useState("");
  const [showPerishableOnly, setShowPerishableOnly] = useState(false);

  const weekItems = items[weekOffset] ?? [];
  const filtered = weekItems.filter((item) => {
    if (catFilter !== "All" && item.category !== catFilter) return false;
    if (showPerishableOnly && !item.perishable) return false;
    return true;
  });

  const grouped = CATEGORIES.slice(1).reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const catItems = filtered.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const checked = weekItems.filter((i) => i.checked).length;
  const total = weekItems.length;

  function toggleItem(id: string) {
    setItems((prev) => ({
      ...prev,
      [weekOffset]: (prev[weekOffset] ?? []).map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  }

  function addItem() {
    if (!newItem.trim()) return;
    const item: GroceryItem = {
      id: `custom-${Date.now()}`,
      name: newItem.trim(),
      amount: "",
      category: "Pantry",
      checked: false,
      perishable: false,
      fromMeals: [],
    };
    setItems((prev) => ({ ...prev, [weekOffset]: [...(prev[weekOffset] ?? []), item] }));
    setNewItem("");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Grocery List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {checked} of {total} items checked
          </p>
        </div>
        <div className="flex gap-2">
          <button className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Share</button>
          <button className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>Print</button>
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/20 p-1 mb-4">
        {[-1, 0, 1, 2].map((offset) => (
          <button
            key={offset}
            onClick={() => setWeekOffset(offset)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
              weekOffset === offset
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {offset === -1 ? "Last" : offset === 0 ? "This week" : offset === 1 ? "Next week" : "+2 wks"}
            <span className="block text-[10px] font-normal opacity-70">{getWeekLabel(offset)}</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-full bg-muted h-2 mb-4 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: total > 0 ? `${(checked / total) * 100}%` : "0%" }}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              catFilter === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            {c !== "All" ? `${CATEGORY_EMOJI[c]} ` : ""}{c}
          </button>
        ))}
        <button
          onClick={() => setShowPerishableOnly((p) => !p)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all ml-auto",
            showPerishableOnly
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-background text-muted-foreground border-border hover:border-destructive/30"
          )}
        >
          🕐 Perishables only
        </button>
      </div>

      {/* Perishable legend */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl bg-muted/30 border border-border">
        <span className="text-xs font-medium text-muted-foreground">Freshness from purchase:</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/30">1–2d · Use immediately</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-accent/10 text-accent border-accent/30">3–5d · Use soon</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">6d+ · Lasts the week</span>
      </div>

      {/* Empty state for future weeks */}
      {(weekItems.length === 0) && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-medium text-foreground mb-1">No list yet for this week</p>
          <p className="text-sm text-muted-foreground mb-4">
            Plan your meals first and your grocery list will auto-generate.
          </p>
          <a href="/planner" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>
            Go to planner
          </a>
        </div>
      )}

      {/* Grouped item lists */}
      <div className="space-y-7">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <span>{CATEGORY_EMOJI[cat]}</span>
              {cat}
              <span className="text-xs font-normal text-muted-foreground">
                ({catItems.filter((i) => i.checked).length}/{catItems.length})
              </span>
            </h2>
            <ul className="space-y-1.5">
              {catItems.map((item) => {
                const shelf = item.perishable && item.shelfDays ? shelfInfo(item.shelfDays) : null;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-all",
                        item.checked
                          ? "bg-muted/30 border-border opacity-55"
                          : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                      )}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        item.checked ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {item.checked && (
                          <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>
                          {item.name}
                        </span>
                        {item.fromMeals.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            For: {item.fromMeals.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <span className="text-xs text-muted-foreground shrink-0">{item.amount}</span>

                      {/* Perishable badge */}
                      {shelf && (
                        <span
                          className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", shelf.color)}
                          title={shelf.tip}
                        >
                          🕐 {shelf.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Add item */}
      <div className="mt-8 flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add an item..."
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button
          onClick={addItem}
          className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 shrink-0")}
        >
          Add
        </button>
      </div>
    </main>
  );
}
