"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { loadWeekPlan, loadKitchenProfile } from "@/lib/local-store";
import type { MealType } from "@/lib/meal-data";

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

type ViewMode = "category" | "meal";

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

const PROTEIN_KW = ["chicken", "beef", "turkey", "pork", "salmon", "shrimp", "tuna", "fish", "steak", "lamb", "tofu", "tempeh", "mince", "ground", "fillet", "breast", "thigh", "sausage", "bacon", "ham", "duck", "tilapia", "cod", "crab", "lobster", "scallop", "prawn"];
const PRODUCE_KW = ["tomato", "lettuce", "spinach", "kale", "broccoli", "pepper", "onion", "garlic", "ginger", "carrot", "cucumber", "avocado", "cilantro", "parsley", "basil", "lemon", "lime", "apple", "banana", "berry", "berries", "scallion", "mushroom", "potato", "zucchini", "celery", "mango", "peach", "sprout", "cabbage", "cauliflower", "corn", "pea", "asparagus", "eggplant", "squash", "arugula", "romaine", "shallot", "leek", "radish", "beet", "fennel", "orange", "grape", "cherry", "plum", "herbs", "herb", "jalapeño", "jalapeno", "chili", "chilli", "bok choy"];
const DAIRY_KW   = ["milk", "cream", "cheese", "yogurt", "butter", "egg", "eggs", "cheddar", "mozzarella", "parmesan", "feta", "ricotta", "brie", "gouda", "ghee", "sour cream", "whey"];
const GRAIN_KW   = ["rice", "pasta", "noodle", "bread", "tortilla", "oat", "oats", "quinoa", "farro", "couscous", "flour", "wrap", "bagel", "pita", "cracker", "cereal", "barley", "lentil", "lentils", "chickpea", "chickpeas", "bean", "beans", "bulgur", "polenta", "ramen"];

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

// ── Amount parsing / scaling ──────────────────────────────────────

const UNICODE_FRACS: Record<string, number> = {
  "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

function parseLeadingNum(str: string): { num: number; rest: string } | null {
  let s = str.trim();
  let num = 0;
  let found = false;

  for (const [ch, val] of Object.entries(UNICODE_FRACS)) {
    if (s.startsWith(ch)) { num = val; s = s.slice(ch.length).trim(); found = true; break; }
  }

  const m = s.match(/^(\d+(?:\.\d+)?)/);
  if (m && !found) {
    num = parseFloat(m[1]);
    s = s.slice(m[1].length).trim();
    for (const [ch, val] of Object.entries(UNICODE_FRACS)) {
      if (s.startsWith(ch)) { num += val; s = s.slice(ch.length).trim(); break; }
    }
    found = true;
  }

  if (!found) return null;
  return { num, rest: s };
}

function formatNum(n: number): string {
  const r = Math.round(n * 4) / 4;
  const whole = Math.floor(r);
  const frac = Math.round((r - whole) * 4);
  const FRAC_CHAR: Record<number, string> = { 1: "¼", 2: "½", 3: "¾" };
  if (frac === 0) return `${whole}`;
  if (whole === 0) return FRAC_CHAR[frac];
  return `${whole} ${FRAC_CHAR[frac]}`;
}

// ── Grocery generation ────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

type AccEntry = {
  displayName: string;
  amounts: { num: number; unit: string }[];
  rawAmounts: string[];
  fromMeals: Set<string>;
};

function pushIngredient(
  acc: Map<string, AccEntry>,
  itemName: string,
  amount: string | undefined,
  mealTitle: string,
  factor: number
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
      const scaled = parsed.num * factor;
      const unit = parsed.rest;
      const existing = entry.amounts.find((a) => a.unit === unit);
      if (existing) existing.num += scaled;
      else entry.amounts.push({ num: scaled, unit });
    } else {
      const label =
        factor > 1 && Math.round(factor) === factor
          ? `${Math.round(factor)}× ${amount}`
          : amount;
      if (!entry.rawAmounts.includes(label)) entry.rawAmounts.push(label);
    }
  }
}

function accToItems(acc: Map<string, AccEntry>, idPrefix: string): GroceryItem[] {
  const items: GroceryItem[] = [];
  for (const [key, entry] of acc) {
    const category = categorizeIngredient(entry.displayName);
    const shelfDays = getShelfDays(entry.displayName, category);
    const parts = [
      ...entry.amounts.filter((a) => a.num > 0).map((a) => `${formatNum(a.num)}${a.unit ? " " + a.unit : ""}`.trim()),
      ...entry.rawAmounts,
    ];
    items.push({
      id: `${idPrefix}-${key.replace(/[^a-z0-9]/g, "-")}`,
      name: entry.displayName,
      amount: parts.join(", "),
      category,
      checked: false,
      perishable: shelfDays !== undefined,
      shelfDays,
      fromMeals: Array.from(entry.fromMeals),
    });
  }
  return items;
}

/** Generates both a combined ingredient list (for category view) and per-meal-type
 *  lists (for meal view). Each set has correctly scaled quantities. */
function generateGroceryData(weekStart: string, defaultServings: number): {
  combined: GroceryItem[];
  byMeal: Record<MealType, GroceryItem[]>;
} {
  const plan = loadWeekPlan(weekStart);
  if (!plan) return { combined: [], byMeal: { breakfast: [], lunch: [], dinner: [] } };

  let sameForAll: Record<MealType, boolean> = { breakfast: false, lunch: false, dinner: false };
  try {
    const raw = localStorage.getItem(`pantri-sameforall-${weekStart}`);
    if (raw) sameForAll = JSON.parse(raw) as Record<MealType, boolean>;
  } catch {}

  const combinedAcc = new Map<string, AccEntry>();
  const mealAccs: Record<MealType, Map<string, AccEntry>> = {
    breakfast: new Map(),
    lunch: new Map(),
    dinner: new Map(),
  };

  for (const mealType of MEAL_TYPES) {
    if (sameForAll[mealType]) {
      const slot = plan.days[0].meals[mealType];
      if (!slot.recipe) continue;
      const recipe = slot.recipe;
      const factor = recipe.servings > 0
        ? ((slot.servings ?? defaultServings) * 7) / recipe.servings
        : (slot.servings ?? defaultServings) * 7;
      for (const ing of recipe.ingredients) {
        pushIngredient(combinedAcc, ing.item, ing.amount, recipe.title, factor);
        pushIngredient(mealAccs[mealType], ing.item, ing.amount, recipe.title, factor);
      }
    } else {
      for (const day of plan.days) {
        const slot = day.meals[mealType];
        if (!slot.recipe) continue;
        const recipe = slot.recipe;
        const factor = recipe.servings > 0
          ? (slot.servings ?? defaultServings) / recipe.servings
          : (slot.servings ?? defaultServings);
        for (const ing of recipe.ingredients) {
          pushIngredient(combinedAcc, ing.item, ing.amount, recipe.title, factor);
          pushIngredient(mealAccs[mealType], ing.item, ing.amount, recipe.title, factor);
        }
      }
    }
  }

  return {
    combined: accToItems(combinedAcc, `gen-${weekStart}`),
    byMeal: {
      breakfast: accToItems(mealAccs.breakfast, `bfst-${weekStart}`),
      lunch:     accToItems(mealAccs.lunch,     `lnch-${weekStart}`),
      dinner:    accToItems(mealAccs.dinner,     `dnr-${weekStart}`),
    },
  };
}

// ── Shelf badge ───────────────────────────────────────────────────

function shelfInfo(days: number): { label: string; color: string; tip: string } {
  if (days <= 2) return { label: `${days}d`, color: "bg-destructive/10 text-destructive border-destructive/30", tip: "Use quickly — expires in 1–2 days" };
  if (days <= 5) return { label: `${days}d`, color: "bg-accent/10 text-accent border-accent/30", tip: `Use within ${days} days of purchase` };
  return { label: `${days}d`, color: "bg-primary/10 text-primary border-primary/20", tip: `Good for up to ${days} days` };
}

// ── Constants ─────────────────────────────────────────────────────

const CATEGORIES = ["All", "Produce", "Proteins", "Dairy & Eggs", "Grains & Noodles", "Pantry"];
const CATEGORY_EMOJI: Record<string, string> = {
  Produce: "🥬", Proteins: "🥩", "Dairy & Eggs": "🥛", "Grains & Noodles": "🍚", Pantry: "🫙",
};

const MEAL_META: { type: MealType; emoji: string; label: string }[] = [
  { type: "breakfast", emoji: "🌅", label: "Breakfast" },
  { type: "lunch",     emoji: "☀️", label: "Lunch" },
  { type: "dinner",    emoji: "🌙", label: "Dinner" },
];

// ── Item row ──────────────────────────────────────────────────────

function ItemRow({ item, onToggle }: { item: GroceryItem; onToggle: () => void }) {
  const shelf = item.perishable && item.shelfDays ? shelfInfo(item.shelfDays) : null;
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-all",
        item.checked
          ? "bg-muted/30 border-border opacity-55"
          : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
      )}
    >
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
      {item.amount && (
        <span className="text-xs text-muted-foreground shrink-0">{item.amount}</span>
      )}
      {shelf && (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", shelf.color)} title={shelf.tip}>
          🕐 {shelf.label}
        </span>
      )}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function GroceryPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStartISO(weekOffset);

  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [catFilter, setCatFilter] = useState("All");
  const [activeMealTypes, setActiveMealTypes] = useState<Set<MealType>>(
    new Set<MealType>(["breakfast", "lunch", "dinner"])
  );
  const [showPerishableOnly, setShowPerishableOnly] = useState(false);
  const [newItem, setNewItem] = useState("");

  // Per-meal collapsible state
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(
    new Set<MealType>(["breakfast", "lunch", "dinner"])
  );

  // Data from plan
  const [combinedItems, setCombinedItems] = useState<GroceryItem[]>([]);
  const [byMeal, setByMeal] = useState<Record<MealType, GroceryItem[]>>({
    breakfast: [], lunch: [], dinner: [],
  });
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const checkedKey = `pantri-grocery-checked-${weekStart}`;
  const customKey  = `pantri-grocery-custom-${weekStart}`;

  useEffect(() => {
    let defaultServings = 2;
    try {
      const p = loadKitchenProfile();
      if (p && typeof p.servings === "number") defaultServings = p.servings;
    } catch {}

    const data = generateGroceryData(weekStart, defaultServings);
    setCombinedItems(data.combined);
    setByMeal(data.byMeal);

    try {
      const raw = localStorage.getItem(customKey);
      setCustomItems(raw ? (JSON.parse(raw) as GroceryItem[]) : []);
    } catch { setCustomItems([]); }

    try {
      const raw = localStorage.getItem(checkedKey);
      setCheckedIds(raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set());
    } catch { setCheckedIds(new Set()); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyChecked(items: GroceryItem[]): GroceryItem[] {
    return items.map((i) => ({ ...i, checked: checkedIds.has(i.id) }));
  }

  function toggleItem(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(checkedKey, JSON.stringify([...next])); } catch {}
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
    try { localStorage.setItem(customKey, JSON.stringify(next)); } catch {}
    setNewItem("");
  }

  function toggleMealType(type: MealType) {
    setActiveMealTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function toggleExpandMeal(type: MealType) {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  // ── Category view data ───────────────────────────────────────────

  const allCategoryItems = applyChecked([...combinedItems, ...customItems]);

  const catFiltered = allCategoryItems.filter((item) => {
    if (catFilter !== "All" && item.category !== catFilter) return false;
    if (showPerishableOnly && !item.perishable) return false;
    return true;
  });

  const groupedByCategory = CATEGORIES.slice(1).reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const catItems = catFiltered.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  // ── Meal view data ───────────────────────────────────────────────

  // Items for each meal type, filtered by category and perishable toggles
  function getMealItems(type: MealType): GroceryItem[] {
    return applyChecked(byMeal[type]).filter((item) => {
      if (catFilter !== "All" && item.category !== catFilter) return false;
      if (showPerishableOnly && !item.perishable) return false;
      return true;
    });
  }

  // Total counts
  const totalGenerated = viewMode === "category"
    ? combinedItems.length
    : MEAL_META.filter((m) => activeMealTypes.has(m.type))
        .reduce((sum, m) => sum + byMeal[m.type].length, 0);
  const total = totalGenerated + customItems.length;

  const checkedCount = viewMode === "category"
    ? allCategoryItems.filter((i) => i.checked).length
    : MEAL_META.filter((m) => activeMealTypes.has(m.type))
        .flatMap((m) => applyChecked(byMeal[m.type]))
        .filter((i) => i.checked).length;

  const hasAnything = total > 0 || customItems.length > 0;

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
          <button className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>Print</button>
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
      <div className="rounded-full bg-muted h-2 mb-5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: total > 0 ? `${(checkedCount / total) * 100}%` : "0%" }}
        />
      </div>

      {/* View toggle + filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* View mode */}
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 shrink-0">
          {(["category", "meal"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                viewMode === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "category" ? "🗂 By category" : "🍽 By meal"}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                catFilter === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {c !== "All" ? `${CATEGORY_EMOJI[c]} ` : ""}
              {c}
            </button>
          ))}
        </div>

        {/* Perishable filter */}
        <button
          onClick={() => setShowPerishableOnly((p) => !p)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium border transition-all ml-auto shrink-0",
            showPerishableOnly
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-background text-muted-foreground border-border hover:border-destructive/30"
          )}
        >
          🕐 Perishables
        </button>
      </div>

      {/* Meal type filter chips — meal view only */}
      {viewMode === "meal" && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl border border-border bg-muted/20">
          <span className="text-xs text-muted-foreground self-center mr-1">Show:</span>
          {MEAL_META.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => toggleMealType(type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                activeMealTypes.has(type)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {emoji} {label}
              {activeMealTypes.has(type) && <span className="opacity-70">✓</span>}
            </button>
          ))}
          {activeMealTypes.size < 3 && (
            <button
              onClick={() => setActiveMealTypes(new Set<MealType>(["breakfast", "lunch", "dinner"]))}
              className="text-xs text-primary hover:underline ml-auto self-center"
            >
              Show all
            </button>
          )}
        </div>
      )}

      {/* Freshness legend */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl bg-muted/30 border border-border">
        <span className="text-xs font-medium text-muted-foreground">Freshness from purchase:</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/30">1–2d · Use immediately</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-accent/10 text-accent border-accent/30">3–5d · Use soon</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">6d+ · Lasts the week</span>
      </div>

      {/* Empty state */}
      {!hasAnything && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-medium text-foreground mb-1">No meals planned for this week</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add meals to your planner and your grocery list will auto-generate here.
          </p>
          <a href="/planner" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>
            Go to planner
          </a>
        </div>
      )}

      {/* ── Category view ─────────────────────────────────────── */}
      {viewMode === "category" && (
        <div className="space-y-7">
          {Object.entries(groupedByCategory).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <span>{CATEGORY_EMOJI[cat]}</span>
                {cat}
                <span className="text-xs font-normal text-muted-foreground">
                  ({catItems.filter((i) => i.checked).length}/{catItems.length})
                </span>
              </h2>
              <ul className="space-y-1.5">
                {catItems.map((item) => (
                  <li key={item.id}>
                    <ItemRow item={item} onToggle={() => toggleItem(item.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Custom items in category view */}
          {applyChecked(customItems).filter((i) => {
            if (catFilter !== "All" && i.category !== catFilter) return false;
            if (showPerishableOnly && !i.perishable) return false;
            return true;
          }).length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <span>✏️</span> Added by you
              </h2>
              <ul className="space-y-1.5">
                {applyChecked(customItems)
                  .filter((i) => {
                    if (catFilter !== "All" && i.category !== catFilter) return false;
                    if (showPerishableOnly && !i.perishable) return false;
                    return true;
                  })
                  .map((item) => (
                    <li key={item.id}>
                      <ItemRow item={item} onToggle={() => toggleItem(item.id)} />
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Meal view ─────────────────────────────────────────── */}
      {viewMode === "meal" && (
        <div className="space-y-4">
          {MEAL_META.filter(({ type }) => activeMealTypes.has(type)).map(({ type, emoji, label }) => {
            const items = getMealItems(type);
            const isExpanded = expandedMeals.has(type);
            const checkedInMeal = items.filter((i) => i.checked).length;

            return (
              <div key={type} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => toggleExpandMeal(type)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {items.length > 0
                        ? `${checkedInMeal}/${items.length} items`
                        : "no meals planned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {items.length > 0 && (
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: items.length > 0 ? `${(checkedInMeal / items.length) * 100}%` : "0%" }}
                        />
                      </div>
                    )}
                    <span className={cn("text-xs text-muted-foreground transition-transform", isExpanded ? "rotate-180" : "")}>
                      ▾
                    </span>
                  </div>
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1.5 border-t border-border">
                    {items.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No {label.toLowerCase()} meals planned for this week.
                        <br />
                        <a href="/planner" className="text-primary hover:underline text-xs mt-1 inline-block">
                          Add meals in planner →
                        </a>
                      </div>
                    ) : (
                      <>
                        {/* Sub-group by category within the meal section */}
                        {CATEGORIES.slice(1).map((cat) => {
                          const catItems = items.filter((i) => i.category === cat);
                          if (catItems.length === 0) return null;
                          return (
                            <div key={cat} className="pt-2">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                                {CATEGORY_EMOJI[cat]} {cat}
                              </p>
                              <ul className="space-y-1">
                                {catItems.map((item) => (
                                  <li key={item.id}>
                                    <ItemRow item={item} onToggle={() => toggleItem(item.id)} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom items in meal view */}
          {customItems.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <span>✏️</span> Added by you
                </span>
              </div>
              <div className="px-3 py-3 space-y-1.5">
                {applyChecked(customItems).map((item) => (
                  <li key={item.id} className="list-none">
                    <ItemRow item={item} onToggle={() => toggleItem(item.id)} />
                  </li>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
