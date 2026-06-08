"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { loadWeekPlan, loadKitchenProfile } from "@/lib/local-store";
import type { MealType, WeekPlan } from "@/lib/meal-data";

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

// ── Week helpers ──────────────────────────────────────────────────

function getWeekStartISO(offset = 0): string {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay() + offset * 7);
  return sunday.toISOString().split("T")[0];
}

function getWeekLabel(offset: number): string {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay() + offset * 7);
  const end = new Date(sunday);
  end.setDate(sunday.getDate() + 6);
  return `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// ── Ingredient categorisation ─────────────────────────────────────

const PROTEIN_KW   = ["chicken", "beef", "turkey", "pork", "salmon", "shrimp", "tuna", "fish", "steak", "lamb", "tofu", "tempeh", "mince", "ground", "fillet", "breast", "thigh", "sausage", "bacon", "ham", "duck", "tilapia", "cod", "crab", "lobster", "scallop", "prawn"];
const PRODUCE_KW   = ["tomato", "lettuce", "spinach", "kale", "broccoli", "pepper", "onion", "garlic", "ginger", "carrot", "cucumber", "avocado", "cilantro", "parsley", "basil", "lemon", "lime", "apple", "banana", "berry", "berries", "scallion", "mushroom", "potato", "zucchini", "celery", "mango", "peach", "sprout", "cabbage", "cauliflower", "corn", "pea", "asparagus", "eggplant", "squash", "arugula", "romaine", "shallot", "leek", "radish", "beet", "fennel", "orange", "grape", "cherry", "plum", "herbs", "herb", "jalapeño", "jalapeno", "chili", "chilli", "bok choy"];
const DAIRY_KW     = ["milk", "cream", "cheese", "yogurt", "butter", "egg", "eggs", "cheddar", "mozzarella", "parmesan", "feta", "ricotta", "brie", "gouda", "ghee", "sour cream", "whey"];
const GRAIN_KW     = ["rice", "pasta", "noodle", "bread", "tortilla", "oat", "oats", "quinoa", "farro", "couscous", "flour", "wrap", "bagel", "pita", "cracker", "cereal", "barley", "lentil", "lentils", "chickpea", "chickpeas", "bean", "beans", "bulgur", "polenta", "ramen"];

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  if (PROTEIN_KW.some((k) => lower.includes(k))) return "Proteins";
  if (DAIRY_KW.some((k) => lower.includes(k)))   return "Dairy & Eggs";
  if (PRODUCE_KW.some((k) => lower.includes(k))) return "Produce";
  if (GRAIN_KW.some((k) => lower.includes(k)))   return "Grains & Noodles";
  return "Pantry";
}

function getShelfDays(name: string, category: string): number | undefined {
  if (category === "Pantry" || category === "Grains & Noodles") return undefined;
  const lower = name.toLowerCase();
  if (category === "Proteins") return 2;
  if (category === "Dairy & Eggs") {
    if (lower.includes("egg"))    return 21;
    if (lower.includes("butter") || lower.includes("cheese")) return 14;
    return 7;
  }
  if (category === "Produce") {
    if (lower.includes("avocado") || lower.includes("banana") || lower.includes("sprout")) return 3;
    if (lower.includes("herb") || lower.includes("cilantro") || lower.includes("parsley") || lower.includes("basil")) return 4;
    if (lower.includes("berry") || lower.includes("berries") || lower.includes("cherry")) return 3;
    return 5;
  }
  return undefined;
}

// ── Amount scaling ────────────────────────────────────────────────

const UNICODE_FRACS: Record<string, number> = {
  "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

function parseLeadingNum(str: string): { num: number; rest: string } | null {
  let s = str.trim();
  let num = 0;
  let found = false;

  // Leading unicode fraction (e.g. "½ cup")
  for (const [ch, val] of Object.entries(UNICODE_FRACS)) {
    if (s.startsWith(ch)) {
      num = val;
      s = s.slice(ch.length).trim();
      found = true;
      break;
    }
  }

  // Leading integer or decimal (e.g. "2 tbsp" or "1.5 oz")
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  if (m && !found) {
    num = parseFloat(m[1]);
    s = s.slice(m[1].length).trim();
    // Trailing unicode fraction: "1 ½ cups"
    for (const [ch, val] of Object.entries(UNICODE_FRACS)) {
      if (s.startsWith(ch)) {
        num += val;
        s = s.slice(ch.length).trim();
        break;
      }
    }
    found = true;
  } else if (m && found) {
    // e.g. "½ ..." shouldn't hit here, but guard anyway
  }

  if (!found) return null;
  return { num, rest: s };
}

function formatNum(n: number): string {
  // Round to nearest ¼
  const r = Math.round(n * 4) / 4;
  const whole = Math.floor(r);
  const frac = Math.round((r - whole) * 4);
  const FRAC_CHAR: Record<number, string> = { 1: "¼", 2: "½", 3: "¾" };
  if (frac === 0) return `${whole}`;
  if (whole === 0) return FRAC_CHAR[frac];
  return `${whole} ${FRAC_CHAR[frac]}`;
}

function scaleAmount(amount: string | undefined, factor: number): string {
  if (!amount) return "";
  if (Math.abs(factor - 1) < 0.001) return amount;
  const parsed = parseLeadingNum(amount);
  if (!parsed) return amount; // unparseable — return as-is
  const scaled = parsed.num * factor;
  return `${formatNum(scaled)}${parsed.rest ? " " + parsed.rest : ""}`.trim();
}

// ── Grocery generation ────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

function generateGroceryItems(weekStart: string, defaultServings: number): GroceryItem[] {
  const plan = loadWeekPlan(weekStart);
  if (!plan) return [];

  // Load per-week sameForAll state (same key as planner uses)
  let sameForAll: Record<MealType, boolean> = {
    breakfast: false,
    lunch: false,
    dinner: false,
  };
  try {
    const raw = localStorage.getItem(`pantri-sameforall-${weekStart}`);
    if (raw) sameForAll = JSON.parse(raw) as Record<MealType, boolean>;
  } catch {}

  // Accumulate by normalised ingredient name
  type AccEntry = {
    displayName: string;
    amounts: { num: number; unit: string }[];
    rawAmounts: string[];
    fromMeals: Set<string>;
  };
  const acc = new Map<string, AccEntry>();

  function addIngredient(
    itemName: string,
    amount: string | undefined,
    mealTitle: string,
    scalingFactor: number
  ) {
    const key = itemName.toLowerCase().replace(/\s+/g, " ").trim();
    if (!acc.has(key)) {
      acc.set(key, { displayName: itemName, amounts: [], rawAmounts: [], fromMeals: new Set() });
    }
    const entry = acc.get(key)!;
    entry.fromMeals.add(mealTitle);

    if (amount) {
      const parsed = parseLeadingNum(amount);
      if (parsed) {
        const scaled = parsed.num * scalingFactor;
        const unit = parsed.rest;
        const existing = entry.amounts.find((a) => a.unit === unit);
        if (existing) {
          existing.num += scaled;
        } else {
          entry.amounts.push({ num: scaled, unit });
        }
      } else {
        // Can't parse; note the raw amount with multiplier when > 1
        const label =
          scalingFactor > 1 && Math.round(scalingFactor) === scalingFactor
            ? `${Math.round(scalingFactor)}× ${amount}`
            : amount;
        if (!entry.rawAmounts.includes(label)) entry.rawAmounts.push(label);
      }
    }
  }

  for (const mealType of MEAL_TYPES) {
    if (sameForAll[mealType]) {
      // Only day 0 stores the recipe; it repeats all 7 days
      const slot = plan.days[0].meals[mealType];
      if (!slot.recipe) continue;
      const recipe = slot.recipe;
      const slotServings = slot.servings ?? defaultServings;
      // Weekly total = 7 days × slotServings, relative to recipe's serving size
      const factor = recipe.servings > 0 ? (slotServings * 7) / recipe.servings : slotServings * 7;
      for (const ing of recipe.ingredients) {
        addIngredient(ing.item, ing.amount, recipe.title, factor);
      }
    } else {
      for (const day of plan.days) {
        const slot = day.meals[mealType];
        if (!slot.recipe) continue;
        const recipe = slot.recipe;
        const slotServings = slot.servings ?? defaultServings;
        const factor = recipe.servings > 0 ? slotServings / recipe.servings : slotServings;
        for (const ing of recipe.ingredients) {
          addIngredient(ing.item, ing.amount, recipe.title, factor);
        }
      }
    }
  }

  // Build GroceryItem list
  const items: GroceryItem[] = [];
  for (const [key, entry] of acc) {
    const category = categorizeIngredient(entry.displayName);
    const shelfDays = getShelfDays(entry.displayName, category);

    // Build combined amount string
    const parts: string[] = entry.amounts
      .filter((a) => a.num > 0)
      .map((a) => `${formatNum(a.num)}${a.unit ? " " + a.unit : ""}`.trim());
    parts.push(...entry.rawAmounts);
    const amount = parts.join(", ");

    items.push({
      id: `gen-${weekStart}-${key.replace(/[^a-z0-9]/g, "-")}`,
      name: entry.displayName,
      amount,
      category,
      checked: false, // overridden by checkedIds in component
      perishable: shelfDays !== undefined,
      shelfDays,
      fromMeals: Array.from(entry.fromMeals),
    });
  }

  return items;
}

// ── Shelf badge ───────────────────────────────────────────────────

function shelfInfo(days: number): { label: string; color: string; tip: string } {
  if (days <= 2)
    return { label: `${days}d`, color: "bg-destructive/10 text-destructive border-destructive/30", tip: "Use quickly — expires in 1–2 days" };
  if (days <= 5)
    return { label: `${days}d`, color: "bg-accent/10 text-accent border-accent/30", tip: `Use within ${days} days of purchase` };
  return { label: `${days}d`, color: "bg-primary/10 text-primary border-primary/20", tip: `Good for up to ${days} days` };
}

// ── Constants ─────────────────────────────────────────────────────

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
  const weekStart = getWeekStartISO(weekOffset);

  const [catFilter, setCatFilter] = useState("All");
  const [showPerishableOnly, setShowPerishableOnly] = useState(false);
  const [newItem, setNewItem] = useState("");

  // Items derived from the meal plan for this week
  const [generatedItems, setGeneratedItems] = useState<GroceryItem[]>([]);
  // Items manually added by the user (persisted per week)
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  // Checked item IDs (persisted per week, independent of generated list)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const checkedKey = `pantri-grocery-checked-${weekStart}`;
  const customKey  = `pantri-grocery-custom-${weekStart}`;

  // Regenerate list whenever the selected week changes
  useEffect(() => {
    let defaultServings = 2;
    try {
      const p = loadKitchenProfile();
      if (p && typeof p.servings === "number") defaultServings = p.servings;
    } catch {}

    setGeneratedItems(generateGroceryItems(weekStart, defaultServings));

    try {
      const raw = localStorage.getItem(customKey);
      setCustomItems(raw ? (JSON.parse(raw) as GroceryItem[]) : []);
    } catch {
      setCustomItems([]);
    }

    try {
      const raw = localStorage.getItem(checkedKey);
      setCheckedIds(raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set());
    } catch {
      setCheckedIds(new Set());
    }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge generated + custom, applying checked state from the persisted set
  const allItems: GroceryItem[] = [...generatedItems, ...customItems].map((item) => ({
    ...item,
    checked: checkedIds.has(item.id),
  }));

  const filtered = allItems.filter((item) => {
    if (catFilter !== "All" && item.category !== catFilter) return false;
    if (showPerishableOnly && !item.perishable) return false;
    return true;
  });

  const grouped = CATEGORIES.slice(1).reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const catItems = filtered.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const checkedCount = allItems.filter((i) => i.checked).length;
  const total = allItems.length;
  const hasAnything = total > 0;

  function toggleItem(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(checkedKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function addItem() {
    if (!newItem.trim()) return;
    const item: GroceryItem = {
      id: `custom-${Date.now()}`,
      name: newItem.trim(),
      amount: "",
      category: categorizeIngredient(newItem.trim()),
      checked: false,
      perishable: false,
      fromMeals: [],
    };
    const next = [...customItems, item];
    setCustomItems(next);
    try {
      localStorage.setItem(customKey, JSON.stringify(next));
    } catch {}
    setNewItem("");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Grocery List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasAnything
              ? `${checkedCount} of ${total} items checked`
              : "Plan your meals to generate your list"}
          </p>
        </div>
        <div className="flex gap-2">
          <button className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Share</button>
          <button className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>
            Print
          </button>
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/20 p-1 mb-4">
        {([-1, 0, 1, 2] as const).map((offset) => (
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
          style={{ width: total > 0 ? `${(checkedCount / total) * 100}%` : "0%" }}
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
            {c !== "All" ? `${CATEGORY_EMOJI[c]} ` : ""}
            {c}
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
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/30">
          1–2d · Use immediately
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-accent/10 text-accent border-accent/30">
          3–5d · Use soon
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
          6d+ · Lasts the week
        </span>
      </div>

      {/* Empty state */}
      {!hasAnything && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-medium text-foreground mb-1">No meals planned for this week</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add meals to your planner and your grocery list will auto-generate here.
          </p>
          <a
            href="/planner"
            className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}
          >
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
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          item.checked ? "bg-primary border-primary" : "border-muted-foreground/40"
                        )}
                      >
                        {item.checked && (
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Name + meal attribution */}
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-sm",
                            item.checked && "line-through text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        {item.fromMeals.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            For: {item.fromMeals.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Scaled amount */}
                      {item.amount && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.amount}
                        </span>
                      )}

                      {/* Perishable badge */}
                      {shelf && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                            shelf.color
                          )}
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
