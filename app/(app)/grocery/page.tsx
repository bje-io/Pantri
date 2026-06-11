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

type DayMealSlot = {
  mealType: MealType;
  recipeName: string;
  items: GroceryItem[];
};

type DayViewEntry = {
  dayName: string;       // "Sunday"
  dateLabel: string;     // "Jun 8"
  dayIndex: number;      // 0–6
  isToday: boolean;
  slots: DayMealSlot[];  // only slots that have a recipe
};

type ViewMode = "day" | "meal" | "list";

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

// ── Ingredient helpers ────────────────────────────────────────────

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
    if (lower.includes("egg"))                                        return 21;
    if (lower.includes("butter") || lower.includes("cheese"))        return 14;
    return 7;
  }
  if (category === "Produce") {
    if (lower.includes("avocado") || lower.includes("banana") || lower.includes("sprout")) return 3;
    if (lower.includes("herb") || lower.includes("cilantro") || lower.includes("parsley") || lower.includes("basil")) return 4;
    if (lower.includes("berry") || lower.includes("berries") || lower.includes("cherry"))  return 3;
    return 5;
  }
  return undefined;
}

// ── Amount scaling ────────────────────────────────────────────────

const UNICODE_FRACS: Record<string, number> = {
  "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1/3, "⅔": 2/3,
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
  const FC: Record<number, string> = { 1: "¼", 2: "½", 3: "¾" };
  if (frac === 0) return `${whole}`;
  if (whole === 0) return FC[frac];
  return `${whole} ${FC[frac]}`;
}

function scaleStr(amount: string | undefined, factor: number): string {
  if (!amount) return "";
  if (Math.abs(factor - 1) < 0.001) return amount;
  const p = parseLeadingNum(amount);
  if (!p) return amount;
  return `${formatNum(p.num * factor)}${p.rest ? " " + p.rest : ""}`.trim();
}

// ── Accumulator helpers (for combined / by-meal list views) ───────

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
    const p = parseLeadingNum(amount);
    if (p) {
      const scaled = p.num * factor;
      const existing = entry.amounts.find((a) => a.unit === p.rest);
      if (existing) existing.num += scaled;
      else entry.amounts.push({ num: scaled, unit: p.rest });
    } else {
      const label = factor > 1 && Math.round(factor) === factor ? `${Math.round(factor)}× ${amount}` : amount;
      if (!entry.rawAmounts.includes(label)) entry.rawAmounts.push(label);
    }
  }
}

function accToItems(acc: Map<string, AccEntry>, idPrefix: string): GroceryItem[] {
  return Array.from(acc.entries()).map(([key, entry]) => {
    const category = categorizeIngredient(entry.displayName);
    const shelfDays = getShelfDays(entry.displayName, category);
    const parts = [
      ...entry.amounts.filter((a) => a.num > 0).map((a) => `${formatNum(a.num)}${a.unit ? " " + a.unit : ""}`.trim()),
      ...entry.rawAmounts,
    ];
    return {
      id: `${idPrefix}-${key.replace(/[^a-z0-9]/g, "-")}`,
      name: entry.displayName,
      amount: parts.join(", "),
      category,
      checked: false,
      perishable: shelfDays !== undefined,
      shelfDays,
      fromMeals: Array.from(entry.fromMeals),
    };
  });
}

// ── Data generation ───────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

function loadSameForAll(weekStart: string): Record<MealType, boolean> {
  try {
    const raw = localStorage.getItem(`pantri-sameforall-${weekStart}`);
    if (raw) return JSON.parse(raw) as Record<MealType, boolean>;
  } catch {}
  return { breakfast: false, lunch: false, dinner: false };
}

/** Combined + per-meal-type ingredient lists (for list and meal views). */
function generateAggregated(weekStart: string, defaultServings: number): {
  combined: GroceryItem[];
  byMeal: Record<MealType, GroceryItem[]>;
} {
  const plan = loadWeekPlan(weekStart);
  if (!plan) return { combined: [], byMeal: { breakfast: [], lunch: [], dinner: [] } };
  const sfa = loadSameForAll(weekStart);

  const combinedAcc = new Map<string, AccEntry>();
  const mealAccs: Record<MealType, Map<string, AccEntry>> = {
    breakfast: new Map(), lunch: new Map(), dinner: new Map(),
  };

  for (const mt of MEAL_TYPES) {
    if (sfa[mt]) {
      const slot = plan.days[0].meals[mt];
      if (!slot.recipe) continue;
      const r = slot.recipe;
      const f = r.servings > 0 ? ((slot.servings ?? defaultServings) * 7) / r.servings : (slot.servings ?? defaultServings) * 7;
      for (const ing of r.ingredients) {
        pushIngredient(combinedAcc, ing.item, ing.amount, r.title, f);
        pushIngredient(mealAccs[mt], ing.item, ing.amount, r.title, f);
      }
    } else {
      for (const day of plan.days) {
        const slot = day.meals[mt];
        if (!slot.recipe) continue;
        const r = slot.recipe;
        const f = r.servings > 0 ? (slot.servings ?? defaultServings) / r.servings : (slot.servings ?? defaultServings);
        for (const ing of r.ingredients) {
          pushIngredient(combinedAcc, ing.item, ing.amount, r.title, f);
          pushIngredient(mealAccs[mt], ing.item, ing.amount, r.title, f);
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

/** Day-by-day view — mirrors the planner grid exactly. Each day × each filled
 *  meal slot has its own ingredient list scaled to that slot's servings. */
function generateDayView(weekStart: string, defaultServings: number): DayViewEntry[] {
  const plan = loadWeekPlan(weekStart);
  if (!plan) return [];
  const sfa = loadSameForAll(weekStart);
  const todayDOW = new Date().getDay(); // 0=Sun

  return plan.days.map((day, dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const slots: DayMealSlot[] = MEAL_TYPES.flatMap((mt) => {
      // Respect sameForAll — if on, every day mirrors day 0's slot
      const effectiveSlot = sfa[mt] ? plan.days[0].meals[mt] : day.meals[mt];
      if (!effectiveSlot.recipe) return [];

      const recipe = effectiveSlot.recipe;
      const slotServings = effectiveSlot.servings ?? defaultServings;
      const factor = recipe.servings > 0 ? slotServings / recipe.servings : slotServings;

      const items: GroceryItem[] = recipe.ingredients.map((ing, i) => {
        const cat = categorizeIngredient(ing.item);
        const shelf = getShelfDays(ing.item, cat);
        return {
          id: `dv-${weekStart}-d${dayIndex}-${mt}-${i}`,
          name: ing.item,
          amount: scaleStr(ing.amount, factor),
          category: cat,
          checked: false,
          perishable: shelf !== undefined,
          shelfDays: shelf,
          fromMeals: [recipe.title],
        };
      });

      return [{ mealType: mt, recipeName: recipe.title, items }];
    });

    return { dayName: day.day, dateLabel, dayIndex, isToday: dayIndex === todayDOW, slots };
  });
}

// ── Shelf badge ───────────────────────────────────────────────────

function shelfInfo(days: number) {
  if (days <= 2) return { label: `${days}d`, color: "bg-destructive/10 text-destructive border-destructive/30", tip: "Use quickly — expires in 1–2 days" };
  if (days <= 5) return { label: `${days}d`, color: "bg-accent/10 text-accent border-accent/30",             tip: `Use within ${days} days` };
  return               { label: `${days}d`, color: "bg-primary/10 text-primary border-primary/20",           tip: `Good for up to ${days} days` };
}

// ── Constants ─────────────────────────────────────────────────────

const CATEGORIES = ["All", "Produce", "Proteins", "Dairy & Eggs", "Grains & Noodles", "Pantry"];
const CAT_EMOJI: Record<string, string> = {
  Produce: "🥬", Proteins: "🥩", "Dairy & Eggs": "🥛", "Grains & Noodles": "🍚", Pantry: "🫙",
};
const MEAL_META: { type: MealType; emoji: string; label: string }[] = [
  { type: "breakfast", emoji: "🌅", label: "Breakfast" },
  { type: "lunch",     emoji: "☀️", label: "Lunch" },
  { type: "dinner",    emoji: "🌙", label: "Dinner" },
];

// ── Shared item row component ─────────────────────────────────────

function ItemRow({ item, onToggle }: { item: GroceryItem; onToggle: () => void }) {
  const shelf = item.perishable && item.shelfDays ? shelfInfo(item.shelfDays) : null;
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-all",
        item.checked
          ? "bg-muted/30 border-border opacity-50"
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
      <span className={cn("flex-1 text-sm min-w-0 truncate", item.checked && "line-through text-muted-foreground")}>
        {item.name}
      </span>
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

  // "day" = planner mirror (default), "meal" = by breakfast/lunch/dinner, "list" = combined by category
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [catFilter, setCatFilter] = useState("All");
  const [activeMeals, setActiveMeals] = useState<Set<MealType>>(
    new Set<MealType>(["breakfast", "lunch", "dinner"])
  );
  const [showPerishOnly, setShowPerishOnly] = useState(false);
  const [newItem, setNewItem] = useState("");

  // Collapsible state
  const [expandedDays, setExpandedDays]   = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(
    new Set<MealType>(["breakfast", "lunch", "dinner"])
  );

  // Data
  const [combinedItems, setCombinedItems] = useState<GroceryItem[]>([]);
  const [byMeal, setByMeal]               = useState<Record<MealType, GroceryItem[]>>({ breakfast: [], lunch: [], dinner: [] });
  const [dayView, setDayView]             = useState<DayViewEntry[]>([]);
  const [customItems, setCustomItems]     = useState<GroceryItem[]>([]);
  const [checkedIds, setCheckedIds]       = useState<Set<string>>(new Set());

  const checkedKey = `pantri-grocery-checked-${weekStart}`;
  const customKey  = `pantri-grocery-custom-${weekStart}`;

  useEffect(() => {
    let ds = 2;
    try { const p = loadKitchenProfile(); if (p && typeof p.servings === "number") ds = p.servings; } catch {}

    const agg = generateAggregated(weekStart, ds);
    setCombinedItems(agg.combined);
    setByMeal(agg.byMeal);
    setDayView(generateDayView(weekStart, ds));

    try { const r = localStorage.getItem(customKey); setCustomItems(r ? JSON.parse(r) : []); } catch { setCustomItems([]); }
    try { const r = localStorage.getItem(checkedKey); setCheckedIds(r ? new Set<string>(JSON.parse(r)) : new Set()); } catch { setCheckedIds(new Set()); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────

  function withChecked<T extends { id: string; checked: boolean }>(items: T[]): T[] {
    return items.map((i) => ({ ...i, checked: checkedIds.has(i.id) }));
  }

  function passesFilter(item: GroceryItem) {
    if (catFilter !== "All" && item.category !== catFilter) return false;
    if (showPerishOnly && !item.perishable) return false;
    return true;
  }

  function toggleChecked(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(checkedKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function addCustomItem() {
    if (!newItem.trim()) return;
    const item: GroceryItem = {
      id: `custom-${Date.now()}`, name: newItem.trim(), amount: "",
      category: categorizeIngredient(newItem.trim()), checked: false, perishable: false, fromMeals: [],
    };
    const next = [...customItems, item];
    setCustomItems(next);
    try { localStorage.setItem(customKey, JSON.stringify(next)); } catch {}
    setNewItem("");
  }

  function toggleDay(idx: number) {
    setExpandedDays((p) => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }

  function toggleExpandMeal(t: MealType) {
    setExpandedMeals((p) => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }

  function toggleActiveMeal(t: MealType) {
    setActiveMeals((p) => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }

  // ── Derived counts ────────────────────────────────────────────────

  const allListItems = withChecked([...combinedItems, ...customItems]);
  const listFiltered = allListItems.filter(passesFilter);
  const listGrouped  = CATEGORIES.slice(1).reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const ci = listFiltered.filter((i) => i.category === cat);
    if (ci.length > 0) acc[cat] = ci;
    return acc;
  }, {});

  const totalItems = combinedItems.length + customItems.length;
  const checkedCount = allListItems.filter((i) => i.checked).length;
  const hasAnything = totalItems > 0;

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Grocery List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasAnything ? `${checkedCount} of ${totalItems} items checked` : "Plan your meals to generate your list"}
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
              weekOffset === offset ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {offset === -1 ? "Last" : offset === 0 ? "This week" : offset === 1 ? "Next week" : "+2 wks"}
            <span className="block text-[10px] font-normal opacity-70">{getWeekLabel(offset)}</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-full bg-muted h-2 mb-5 overflow-hidden">
        <div className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : "0%" }} />
      </div>

      {/* ── View toggle ───────────────────────────────────────────── */}
      <div className="flex rounded-xl border border-border bg-muted/30 p-1 mb-4">
        {([
          { v: "day"  as ViewMode, icon: "📅", label: "By day"  },
          { v: "meal" as ViewMode, icon: "🍽",  label: "By meal" },
          { v: "list" as ViewMode, icon: "🛒",  label: "Shopping list" },
        ]).map(({ v, icon, label }) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
              viewMode === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Meal-type filter chips (meal view only) ───────────────── */}
      {viewMode === "meal" && (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-3 py-2.5 rounded-xl border border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">Show:</span>
          {MEAL_META.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => toggleActiveMeal(type)}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                activeMeals.has(type)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {emoji} {label}
            </button>
          ))}
          {activeMeals.size < 3 && (
            <button
              onClick={() => setActiveMeals(new Set<MealType>(["breakfast","lunch","dinner"]))}
              className="ml-auto text-xs text-primary hover:underline"
            >
              All meals
            </button>
          )}
        </div>
      )}

      {/* ── Category + perishable filters ────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
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
              {c !== "All" ? `${CAT_EMOJI[c]} ` : ""}{c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowPerishOnly((p) => !p)}
          className={cn(
            "ml-auto px-2.5 py-1 rounded-full text-xs font-medium border transition-all shrink-0",
            showPerishOnly
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-background text-muted-foreground border-border hover:border-destructive/30"
          )}
        >
          🕐 Perishables
        </button>
      </div>

      {/* Freshness legend */}
      <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-muted/30 border border-border text-[11px]">
        <span className="font-medium text-muted-foreground">Freshness:</span>
        <span className="px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/30">1–2d use immediately</span>
        <span className="px-2 py-0.5 rounded-full border bg-accent/10 text-accent border-accent/30">3–5d use soon</span>
        <span className="px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">6d+ lasts the week</span>
      </div>

      {/* Empty state */}
      {!hasAnything && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-medium text-foreground mb-1">No meals planned for this week</p>
          <p className="text-sm text-muted-foreground mb-4">Add meals in the planner and your list generates here.</p>
          <a href="/planner" className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90")}>Go to planner</a>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW: BY DAY — mirrors the planner grid (Sun → Sat)
          ════════════════════════════════════════════════════════════ */}
      {viewMode === "day" && (
        <div className="space-y-3">
          {dayView.map((entry) => {
            const isExpanded = expandedDays.has(entry.dayIndex);
            const allSlotItems = entry.slots.flatMap((s) => s.items);
            const visibleSlots = entry.slots.filter((s) =>
              s.items.some(passesFilter)
            );
            const totalSlotItems = allSlotItems.filter(passesFilter).length;
            const checkedSlotItems = allSlotItems.filter((i) => passesFilter(i) && checkedIds.has(i.id)).length;
            const hasItems = totalSlotItems > 0;

            return (
              <div
                key={entry.dayIndex}
                className={cn(
                  "rounded-2xl border overflow-hidden transition-all",
                  entry.isToday ? "border-primary/40 bg-primary/[0.02]" : "border-border bg-card"
                )}
              >
                {/* Day header */}
                <button
                  onClick={() => toggleDay(entry.dayIndex)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", entry.isToday ? "text-primary" : "text-foreground")}>
                          {entry.dayName}
                        </span>
                        {entry.isToday && (
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">TODAY</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{entry.dateLabel}</span>
                    </div>
                    {/* Meal type indicators */}
                    <div className="flex gap-1">
                      {MEAL_META.map(({ type, emoji }) => {
                        const hasSlot = entry.slots.some((s) => s.mealType === type);
                        return (
                          <span
                            key={type}
                            className={cn("text-sm transition-opacity", hasSlot ? "opacity-100" : "opacity-20")}
                          >
                            {emoji}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasItems && (
                      <>
                        <span className="text-[11px] text-muted-foreground">
                          {checkedSlotItems}/{totalSlotItems}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(checkedSlotItems / totalSlotItems) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                    {!hasItems && (
                      <span className="text-[11px] text-muted-foreground">no meals</span>
                    )}
                    <span className={cn("text-xs text-muted-foreground transition-transform duration-200", isExpanded ? "rotate-180" : "")}>▾</span>
                  </div>
                </button>

                {/* Day content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {entry.slots.length === 0 || visibleSlots.length === 0 ? (
                      <div className="px-4 py-5 text-center text-sm text-muted-foreground">
                        No meals planned for {entry.dayName}.{" "}
                        <a href="/planner" className="text-primary hover:underline">Add in planner →</a>
                      </div>
                    ) : (
                      visibleSlots.map((slot) => {
                        const slotItems = withChecked(slot.items).filter(passesFilter);
                        if (slotItems.length === 0) return null;
                        const mealMeta = MEAL_META.find((m) => m.type === slot.mealType)!;
                        const checkedInSlot = slotItems.filter((i) => i.checked).length;
                        return (
                          <div key={slot.mealType} className="border-b border-border/50 last:border-0">
                            {/* Meal slot header within day */}
                            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{mealMeta.emoji}</span>
                                <span className="text-xs font-semibold text-foreground">{mealMeta.label}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                  · {slot.recipeName}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {checkedInSlot}/{slotItems.length}
                              </span>
                            </div>
                            <ul className="px-3 pb-3 space-y-1">
                              {slotItems.map((item) => (
                                <li key={item.id}>
                                  <ItemRow item={item} onToggle={() => toggleChecked(item.id)} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom items */}
          {customItems.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm text-foreground">✏️ Added by you</span>
              </div>
              <ul className="p-3 space-y-1.5">
                {withChecked(customItems).map((item) => (
                  <li key={item.id}><ItemRow item={item} onToggle={() => toggleChecked(item.id)} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW: BY MEAL — grouped by meal type, filterable
          ════════════════════════════════════════════════════════════ */}
      {viewMode === "meal" && (
        <div className="space-y-3">
          {MEAL_META.filter(({ type }) => activeMeals.has(type)).map(({ type, emoji, label }) => {
            const items = withChecked(byMeal[type]).filter(passesFilter);
            const isExp = expandedMeals.has(type);
            const checkedIn = items.filter((i) => i.checked).length;

            return (
              <div key={type} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => toggleExpandMeal(type)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {items.length > 0 ? `${checkedIn}/${items.length} items` : "no meals planned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {items.length > 0 && (
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(checkedIn / items.length) * 100}%` }} />
                      </div>
                    )}
                    <span className={cn("text-xs text-muted-foreground transition-transform", isExp ? "rotate-180" : "")}>▾</span>
                  </div>
                </button>

                {isExp && (
                  <div className="border-t border-border px-3 pb-3">
                    {items.length === 0 ? (
                      <div className="py-5 text-center text-sm text-muted-foreground">
                        No {label.toLowerCase()} meals planned.{" "}
                        <a href="/planner" className="text-primary hover:underline text-xs">Add in planner →</a>
                      </div>
                    ) : (
                      // Sub-group by category
                      CATEGORIES.slice(1).map((cat) => {
                        const ci = items.filter((i) => i.category === cat);
                        if (!ci.length) return null;
                        return (
                          <div key={cat} className="pt-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                              {CAT_EMOJI[cat]} {cat}
                            </p>
                            <ul className="space-y-1">
                              {ci.map((item) => (
                                <li key={item.id}><ItemRow item={item} onToggle={() => toggleChecked(item.id)} /></li>
                              ))}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {customItems.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm text-foreground">✏️ Added by you</span>
              </div>
              <ul className="p-3 space-y-1.5">
                {withChecked(customItems).map((item) => (
                  <li key={item.id}><ItemRow item={item} onToggle={() => toggleChecked(item.id)} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VIEW: SHOPPING LIST — all items combined, grouped by category
          ════════════════════════════════════════════════════════════ */}
      {viewMode === "list" && (
        <div className="space-y-7">
          {Object.entries(listGrouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <span>{CAT_EMOJI[cat]}</span>{cat}
                <span className="text-xs font-normal text-muted-foreground">
                  ({catItems.filter((i) => i.checked).length}/{catItems.length})
                </span>
              </h2>
              <ul className="space-y-1.5">
                {catItems.map((item) => (
                  <li key={item.id}><ItemRow item={item} onToggle={() => toggleChecked(item.id)} /></li>
                ))}
              </ul>
            </div>
          ))}
          {withChecked(customItems).filter(passesFilter).length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">✏️ Added by you</h2>
              <ul className="space-y-1.5">
                {withChecked(customItems).filter(passesFilter).map((item) => (
                  <li key={item.id}><ItemRow item={item} onToggle={() => toggleChecked(item.id)} /></li>
                ))}
              </ul>
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
          onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
          placeholder="Add an item..."
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button
          onClick={addCustomItem}
          className={cn(buttonVariants({ size: "sm" }), "bg-primary hover:bg-primary/90 shrink-0")}
        >
          Add
        </button>
      </div>
    </main>
  );
}
