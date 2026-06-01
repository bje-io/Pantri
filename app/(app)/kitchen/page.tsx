"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { loadKitchenProfile, saveKitchenProfile, derivedCalories } from "@/lib/local-store";

// ── Types ─────────────────────────────────────────────────────────

/** macros are in GRAMS; calories are always derived (protein×4 + carbs×4 + fat×9) */
type MacroGrams = { protein: number; carbs: number; fat: number };

type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very-active";

type KitchenProfile = {
  // ── Body stats ──
  heightCm: number;    // stored in cm; display converts to ft/in when units === "imperial"
  weightKg: number;    // stored in kg; display converts to lbs when units === "imperial"
  age: number;
  sex: "male" | "female";
  activityLevel: ActivityLevel;
  units: "metric" | "imperial";
  // ── Nutrition ──
  macros: MacroGrams;
  // ── Meal prefs ──
  servings: number;
  dietaryPrefs: string[];
  allergies: string[];
  cuisinePrefs: string[];
  mealConsistency: { breakfast: "same" | "vary"; lunch: "same" | "vary"; dinner: "same" | "vary" };
  cheatDaysPerWeek: number;
  cheatDayPrefs: string[];
  budgetPerWeek: number;
  cookTimeMax: number; // minutes
  goal: "lose-weight" | "maintain" | "build-muscle" | "eat-healthy" | "custom";
};

// ── Options ───────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; desc: string; emoji: string; multiplier: number }[] = [
  { id: "sedentary",   label: "Sedentary",    desc: "Desk job, little or no exercise",      emoji: "🪑", multiplier: 1.2   },
  { id: "light",       label: "Lightly Active",desc: "Light exercise 1–3 days/week",        emoji: "🚶", multiplier: 1.375 },
  { id: "moderate",    label: "Moderately Active", desc: "Exercise 3–5 days/week",          emoji: "🏃", multiplier: 1.55  },
  { id: "active",      label: "Very Active",  desc: "Hard exercise 6–7 days/week",          emoji: "🏋️", multiplier: 1.725 },
  { id: "very-active", label: "Extremely Active", desc: "Physical job + hard daily training", emoji: "⚡", multiplier: 1.9 },
];

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { id: "vegan",      label: "Vegan",      emoji: "🌱" },
  { id: "gluten-free",label: "Gluten-Free",emoji: "🌾" },
  { id: "dairy-free", label: "Dairy-Free", emoji: "🥛" },
  { id: "low-carb",   label: "Low Carb",   emoji: "🍞" },
  { id: "keto",       label: "Keto",       emoji: "🥑" },
  { id: "paleo",      label: "Paleo",      emoji: "🦴" },
  { id: "halal",      label: "Halal",      emoji: "☪️"  },
];

const ALLERGY_OPTIONS = [
  { id: "nuts",     label: "Tree Nuts" },
  { id: "peanuts",  label: "Peanuts"   },
  { id: "shellfish",label: "Shellfish" },
  { id: "fish",     label: "Fish"      },
  { id: "eggs",     label: "Eggs"      },
  { id: "soy",      label: "Soy"       },
  { id: "sesame",   label: "Sesame"    },
];

const CUISINE_OPTIONS = [
  { id: "Japanese",      emoji: "🇯🇵" },
  { id: "Mexican",       emoji: "🇲🇽" },
  { id: "Greek",         emoji: "🇬🇷" },
  { id: "Thai",          emoji: "🇹🇭" },
  { id: "Indian",        emoji: "🇮🇳" },
  { id: "Italian",       emoji: "🇮🇹" },
  { id: "American",      emoji: "🇺🇸" },
  { id: "Mediterranean", emoji: "🌊" },
  { id: "Chinese",       emoji: "🇨🇳" },
  { id: "Korean",        emoji: "🇰🇷" },
  { id: "French",        emoji: "🇫🇷" },
  { id: "Middle Eastern",emoji: "🌙" },
];

const CHEAT_PREF_OPTIONS = [
  { id: "burgers",  label: "Burgers & Fries", emoji: "🍔" },
  { id: "pizza",    label: "Pizza",           emoji: "🍕" },
  { id: "tacos",    label: "Street Tacos",    emoji: "🌮" },
  { id: "pasta",    label: "Pasta",           emoji: "🍝" },
  { id: "sushi",    label: "Sushi",           emoji: "🍣" },
  { id: "bbq",      label: "BBQ",             emoji: "🍖" },
  { id: "desserts", label: "Desserts",        emoji: "🍰" },
  { id: "brunch",   label: "Brunch",          emoji: "🥞" },
];

const GOAL_OPTIONS = [
  { id: "lose-weight",  label: "Lose Weight",   emoji: "⬇️", desc: "Calorie deficit, high protein, smart carbs"     },
  { id: "maintain",     label: "Maintain",       emoji: "⚖️", desc: "Balanced macros, sustainable variety"          },
  { id: "build-muscle", label: "Build Muscle",   emoji: "💪", desc: "High protein, calorie surplus, nutrient-dense" },
  { id: "eat-healthy",  label: "Eat Healthier",  emoji: "🥗", desc: "Whole foods, less processed, more variety"     },
  { id: "custom",       label: "Custom",         emoji: "⚙️", desc: "Set your own targets manually"                 },
] as const;

// Macro calorie-ratio targets per goal (for TDEE-based auto-fill)
const GOAL_MACRO_RATIOS: Record<string, { p: number; c: number; f: number }> = {
  "lose-weight":  { p: 0.40, c: 0.35, f: 0.25 },
  maintain:       { p: 0.30, c: 0.40, f: 0.30 },
  "build-muscle": { p: 0.35, c: 0.45, f: 0.20 },
  "eat-healthy":  { p: 0.25, c: 0.50, f: 0.25 },
  custom:         { p: 0.30, c: 0.40, f: 0.30 },
};

// Static gram fallbacks (used when no body stats are entered).
// Targets aligned with seed recipe calorie levels so green zone is achievable:
//   lose-weight 1,500 cal · maintain 1,800 cal · build-muscle 2,200 cal · eat-healthy 1,600 cal
const GOAL_DEFAULTS: Record<string, Partial<KitchenProfile>> = {
  "lose-weight":  { macros: { protein: 150, carbs: 130, fat: 42  } },  // 1,494 kcal
  maintain:       { macros: { protein: 135, carbs: 180, fat: 60  } },  // 1,800 kcal
  "build-muscle": { macros: { protein: 193, carbs: 248, fat: 49  } },  // 2,201 kcal
  "eat-healthy":  { macros: { protein: 100, carbs: 200, fat: 44  } },  // 1,596 kcal
  custom:         {},
};

// ── TDEE helpers ──────────────────────────────────────────────────

/** Mifflin-St Jeor BMR × activity multiplier → TDEE */
function calcTDEE(p: KitchenProfile): number | null {
  if (!p.heightCm || !p.weightKg || !p.age) return null;
  const bmr =
    p.sex === "male"
      ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
      : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161;
  const multiplier = ACTIVITY_OPTIONS.find((a) => a.id === p.activityLevel)?.multiplier ?? 1.55;
  return Math.round(bmr * multiplier);
}

/** Adjust TDEE for the selected goal */
function goalAdjustedCalories(tdee: number, goal: string): number {
  if (goal === "lose-weight")  return Math.max(1200, Math.round(tdee - 500));
  if (goal === "build-muscle") return Math.round(tdee + 300);
  return Math.round(tdee);
}

/** Convert goal-adjusted calories → macro grams using goal ratio */
function calsToMacros(calories: number, goal: string): MacroGrams {
  const r = GOAL_MACRO_RATIOS[goal] ?? GOAL_MACRO_RATIOS.maintain;
  return {
    protein: Math.round((calories * r.p) / 4),
    carbs:   Math.round((calories * r.c) / 4),
    fat:     Math.round((calories * r.f) / 9),
  };
}

// ── Unit display helpers ──────────────────────────────────────────

function fmtHeight(cm: number, units: "metric" | "imperial"): string {
  if (units === "metric") return `${cm} cm`;
  const totalIn = cm / 2.54;
  const ft   = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return `${ft}'${inch}"`;
}

function fmtWeight(kg: number, units: "metric" | "imperial"): string {
  if (units === "metric") return `${kg} kg`;
  return `${Math.round(kg * 2.20462)} lbs`;
}

// ── Helpers ───────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ active, onToggle, label, emoji }: { active: boolean; onToggle: () => void; label: string; emoji?: string }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
        active
          ? "bg-primary/10 border-primary text-primary"
          : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {emoji && <span>{emoji}</span>}
      {label}
      {active && <span className="ml-auto text-primary">✓</span>}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────

const DEFAULT_PROFILE: KitchenProfile = {
  // Body stats — sensible defaults the user should personalise
  heightCm: 170,
  weightKg: 75,
  age: 30,
  sex: "male",
  activityLevel: "moderate",
  units: "metric",
  // Nutrition — eat-healthy preset: 1,596 kcal · ~532 kcal per meal
  macros: { protein: 100, carbs: 200, fat: 44 },
  // Meal prefs
  servings: 2,
  dietaryPrefs: [],
  allergies: [],
  cuisinePrefs: ["Japanese", "Mexican", "Thai", "Indian", "Greek"],
  mealConsistency: { breakfast: "same", lunch: "vary", dinner: "vary" },
  cheatDaysPerWeek: 1,
  cheatDayPrefs: ["burgers", "pizza"],
  budgetPerWeek: 150,
  cookTimeMax: 45,
  goal: "eat-healthy",
};

export default function KitchenPage() {
  const [profile, setProfile] = useState<KitchenProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  // Load persisted profile on mount
  useEffect(() => {
    const stored = loadKitchenProfile();
    if (stored) {
      setProfile((p) => ({ ...p, ...(stored as Partial<KitchenProfile>) }));
    }
  }, []);

  function set<K extends keyof KitchenProfile>(key: K, value: KitchenProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function toggleList(key: "dietaryPrefs" | "allergies" | "cuisinePrefs" | "cheatDayPrefs", id: string) {
    setProfile((p) => {
      const list = p[key] as string[];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...p, [key]: next };
    });
    setSaved(false);
  }

  function selectGoal(goal: KitchenProfile["goal"]) {
    const tdee = calcTDEE(profile);
    if (tdee && goal !== "custom") {
      // Auto-set macros from TDEE when body stats are available
      const targetCals = goalAdjustedCalories(tdee, goal);
      const macros = calsToMacros(targetCals, goal);
      setProfile((p) => ({ ...p, goal, macros }));
    } else {
      // Fall back to static gram presets
      const defaults = GOAL_DEFAULTS[goal] ?? {};
      setProfile((p) => ({ ...p, goal, ...defaults }));
    }
    setSaved(false);
  }

  function applyTDEEToMacros() {
    const tdee = calcTDEE(profile);
    if (!tdee) return;
    const targetCals = goalAdjustedCalories(tdee, profile.goal);
    const macros = calsToMacros(targetCals, profile.goal);
    set("macros", macros);
  }

  /** Scale all macros proportionally so total calories hit `newCals`. */
  function scaleToCalories(newCals: number) {
    const current = derivedCals || 1;
    const ratio = newCals / current;
    set("macros", {
      protein: Math.max(10, Math.round(profile.macros.protein * ratio)),
      carbs:   Math.max(10, Math.round(profile.macros.carbs   * ratio)),
      fat:     Math.max(5,  Math.round(profile.macros.fat     * ratio)),
    });
  }

  /** Estimate lbs/week change from a calorie delta vs TDEE. */
  function weightChangeLabel(delta: number): string {
    const lbsPerWeek = Math.abs(delta * 7) / 3500;
    const dir = delta < 0 ? "loss" : "gain";
    if (lbsPerWeek < 0.1) return "maintenance";
    return `~${lbsPerWeek.toFixed(1)} lbs/week ${dir}`;
  }

  // ── Derived display values ────────────────────────────────────────
  const tdee      = calcTDEE(profile);
  const goalCals  = tdee ? goalAdjustedCalories(tdee, profile.goal) : null;
  const goalCalDelta = tdee && goalCals ? goalCals - tdee : 0;

  const derivedCals    = derivedCalories(profile.macros);
  const proCals        = profile.macros.protein * 4;
  const carbCals       = profile.macros.carbs   * 4;
  const fatCals        = profile.macros.fat     * 9;
  const totalMacroCals = proCals + carbCals + fatCals || 1;

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🍽️</span>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">My Kitchen</h1>
              <p className="text-muted-foreground text-sm">
                Set your goals and preferences — AI uses these to build every meal plan.
              </p>
            </div>
          </div>
          <button
            onClick={() => { saveKitchenProfile(profile); setSaved(true); }}
            className={cn(
              buttonVariants({ size: "sm" }),
              "shrink-0 transition-colors",
              saved ? "bg-green-600 hover:bg-green-600/90" : "bg-primary hover:bg-primary/90"
            )}
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── About You ── */}
        <Section title="About You" subtitle="Used to calculate your personalised calorie needs via the Mifflin-St Jeor formula.">
          <div className="space-y-5">

            {/* Units toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Units</label>
              <div className="flex rounded-lg border border-border bg-muted/20 p-0.5 gap-0.5">
                {(["metric", "imperial"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => set("units", u)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                      profile.units === u
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {u === "metric" ? "Metric" : "Imperial"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sex */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Biological sex</label>
              <p className="text-xs text-muted-foreground mb-3">Used for BMR calculation only</p>
              <div className="flex gap-3">
                {(["male", "female"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => set("sex", s)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      profile.sex === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {s === "male" ? "♂ Male" : "♀ Female"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-foreground">Age</label>
                <span className="text-sm font-bold text-primary">{profile.age} yrs</span>
              </div>
              <input
                type="range" min={15} max={80} step={1}
                value={profile.age}
                onChange={(e) => set("age", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>15</span><span>80</span>
              </div>
            </div>

            {/* Height */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-foreground">Height</label>
                <span className="text-sm font-bold text-primary">{fmtHeight(profile.heightCm, profile.units)}</span>
              </div>
              <input
                type="range" min={140} max={220} step={1}
                value={profile.heightCm}
                onChange={(e) => set("heightCm", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{fmtHeight(140, profile.units)}</span>
                <span>{fmtHeight(220, profile.units)}</span>
              </div>
            </div>

            {/* Weight */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-foreground">Weight</label>
                <span className="text-sm font-bold text-primary">{fmtWeight(profile.weightKg, profile.units)}</span>
              </div>
              <input
                type="range" min={40} max={200} step={1}
                value={profile.weightKg}
                onChange={(e) => set("weightKg", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{fmtWeight(40, profile.units)}</span>
                <span>{fmtWeight(200, profile.units)}</span>
              </div>
            </div>

            {/* Activity level */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-3">Activity level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => set("activityLevel", a.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      profile.activityLevel === a.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <span className="text-xl shrink-0">{a.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.desc}</p>
                    </div>
                    {profile.activityLevel === a.id && (
                      <span className="ml-auto text-primary text-xs shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </Section>

        {/* ── Goal ── */}
        <Section title="What's your goal?" subtitle="Selects a macro split — auto-calculated from your stats when available.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGoal(g.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                  profile.goal === g.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                <span className="text-2xl shrink-0">{g.emoji}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{g.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                </div>
                {profile.goal === g.id && (
                  <span className="ml-auto text-primary shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Nutrition targets ── */}
        <Section title="Nutrition Targets" subtitle="Set your daily calorie target — macros adjust automatically, or fine-tune below.">
          <div className="space-y-5">

            {/* ── 1. Calorie target — primary control ── */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Daily calorie target</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Drag to set · macros scale proportionally
                  </p>
                </div>
                <span className="text-3xl font-bold text-primary tabular-nums">
                  {derivedCals.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
                </span>
              </div>

              <input
                type="range" min={1200} max={3500} step={50}
                value={derivedCals}
                onChange={(e) => scaleToCalories(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1,200<br/><span className="text-[9px]">Min safe</span></span>
                <span className="text-center">1,500<br/><span className="text-[9px]">Weight loss</span></span>
                <span className="text-center">2,000<br/><span className="text-[9px]">Maintain</span></span>
                <span className="text-center">2,500<br/><span className="text-[9px]">Active</span></span>
                <span className="text-right">3,500<br/><span className="text-[9px]">Build</span></span>
              </div>

              {/* Safety warning */}
              {derivedCals < 1200 && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Below 1,200 kcal is not recommended without medical supervision.
                </p>
              )}

              {/* TDEE comparison */}
              {tdee && (
                <div className="flex items-center justify-between rounded-lg bg-background/60 border border-primary/10 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    Your TDEE: <span className="font-semibold text-foreground">{tdee.toLocaleString()} kcal</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-semibold",
                      derivedCals < tdee ? "text-primary" : "text-accent"
                    )}>
                      {derivedCals < tdee
                        ? `−${(tdee - derivedCals).toLocaleString()} kcal`
                        : `+${(derivedCals - tdee).toLocaleString()} kcal`}
                    </span>
                    <span className="text-muted-foreground">
                      · {weightChangeLabel(derivedCals - tdee)}
                    </span>
                    <button
                      onClick={applyTDEEToMacros}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-6 text-[10px] px-2")}
                    >
                      Use TDEE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── 2. Per-meal targets ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Per meal target (÷ 3)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: "🌅", label: "Breakfast" },
                  { emoji: "☀️", label: "Lunch" },
                  { emoji: "🌙", label: "Dinner" },
                ].map(({ emoji, label }) => (
                  <div key={label} className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                    <p className="text-lg mb-0.5">{emoji}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {Math.round(derivedCals / 3).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">kcal</p>
                    <div className="mt-1.5 pt-1.5 border-t border-border/50 grid grid-cols-3 gap-0.5 text-[9px] text-muted-foreground">
                      <span>{Math.round(profile.macros.protein / 3)}g P</span>
                      <span>{Math.round(profile.macros.carbs / 3)}g C</span>
                      <span>{Math.round(profile.macros.fat / 3)}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 3. Macro breakdown (fine-tune) ── */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Fine-tune macros</p>
              <div className="space-y-4">

                {/* Protein */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                      Protein
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {Math.round((proCals / totalMacroCals) * 100)}% of calories
                      </span>
                      <span className="font-semibold text-foreground">{profile.macros.protein} g</span>
                      <span className="text-muted-foreground">({proCals} kcal)</span>
                    </div>
                  </div>
                  <input
                    type="range" min={30} max={300} step={5}
                    value={profile.macros.protein}
                    onChange={(e) => set("macros", { ...profile.macros, protein: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Recommended: {Math.round(profile.weightKg * 1.6)}–{Math.round(profile.weightKg * 2.2)} g/day
                    ({(profile.weightKg * 1.6 / (profile.macros.protein || 1) * 100).toFixed(0)}% of your body weight target)
                  </p>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent inline-block" />
                      Carbohydrates
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {Math.round((carbCals / totalMacroCals) * 100)}% of calories
                      </span>
                      <span className="font-semibold text-foreground">{profile.macros.carbs} g</span>
                      <span className="text-muted-foreground">({carbCals} kcal)</span>
                    </div>
                  </div>
                  <input
                    type="range" min={30} max={400} step={5}
                    value={profile.macros.carbs}
                    onChange={(e) => set("macros", { ...profile.macros, carbs: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Dietary guidelines: 45–65% of total calories · min. 130 g/day for brain function
                  </p>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
                      Fat
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {Math.round((fatCals / totalMacroCals) * 100)}% of calories
                      </span>
                      <span className="font-semibold text-foreground">{profile.macros.fat} g</span>
                      <span className="text-muted-foreground">({fatCals} kcal)</span>
                    </div>
                  </div>
                  <input
                    type="range" min={15} max={180} step={2}
                    value={profile.macros.fat}
                    onChange={(e) => set("macros", { ...profile.macros, fat: Number(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Dietary guidelines: 20–35% of total calories · min. 44 g/day for hormones
                  </p>
                </div>
              </div>

              {/* Calorie-share bar */}
              <div className="mt-4">
                <div className="flex rounded-full overflow-hidden h-3">
                  <div className="bg-primary transition-all"             style={{ width: `${(proCals  / totalMacroCals) * 100}%` }} />
                  <div className="bg-accent transition-all"              style={{ width: `${(carbCals / totalMacroCals) * 100}%` }} />
                  <div className="bg-yellow-400/70 transition-all"       style={{ width: `${(fatCals  / totalMacroCals) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                    Protein {Math.round((proCals / totalMacroCals) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-accent inline-block" />
                    Carbs {Math.round((carbCals / totalMacroCals) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-400/70 inline-block" />
                    Fat {Math.round((fatCals / totalMacroCals) * 100)}%
                  </span>
                </div>
                {Math.round((proCals / totalMacroCals) * 100)
                  + Math.round((carbCals / totalMacroCals) * 100)
                  + Math.round((fatCals / totalMacroCals) * 100) !== 100 && null}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Meal settings ── */}
        <Section title="Meal Settings" subtitle="How you like your week structured.">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-3">Servings per meal</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => set("servings", Math.max(1, profile.servings - 1))}
                  className="h-9 w-9 rounded-full border border-border text-foreground hover:border-primary hover:text-primary text-lg transition-colors"
                >−</button>
                <span className="text-2xl font-bold text-foreground w-8 text-center">{profile.servings}</span>
                <button
                  onClick={() => set("servings", Math.min(8, profile.servings + 1))}
                  className="h-9 w-9 rounded-full border border-border text-foreground hover:border-primary hover:text-primary text-lg transition-colors"
                >+</button>
                <span className="text-sm text-muted-foreground">people</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-3">Max cook time per meal</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={10} max={120} step={5}
                  value={profile.cookTimeMax}
                  onChange={(e) => set("cookTimeMax", Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-bold text-primary w-16 text-right">{profile.cookTimeMax} min</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-3">Meal variety</label>
              <div className="space-y-2">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <div key={meal} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <span className="text-sm capitalize text-foreground">
                      {meal === "breakfast" ? "🌅" : meal === "lunch" ? "☀️" : "🌙"} {meal}
                    </span>
                    <div className="flex rounded-lg border border-border bg-muted/20 p-0.5 gap-0.5">
                      {(["same", "vary"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => set("mealConsistency", { ...profile.mealConsistency, [meal]: mode })}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                            profile.mealConsistency[meal] === mode
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {mode === "same" ? "Same daily" : "Vary daily"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Weekly budget</label>
                <span className="text-sm font-bold text-primary">${profile.budgetPerWeek}</span>
              </div>
              <input
                type="range" min={50} max={500} step={10}
                value={profile.budgetPerWeek}
                onChange={(e) => set("budgetPerWeek", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$50</span><span>$500</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Cheat days ── */}
        <Section title="Cheat Days 🍕" subtitle="Let yourself enjoy something indulgent. AI plans your treat meals too.">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Cheat days per week</label>
                <span className="text-sm font-bold text-accent">{profile.cheatDaysPerWeek === 0 ? "None" : profile.cheatDaysPerWeek}</span>
              </div>
              <input
                type="range" min={0} max={3} step={1}
                value={profile.cheatDaysPerWeek}
                onChange={(e) => set("cheatDaysPerWeek", Number(e.target.value))}
                className="w-full accent-[oklch(0.62_0.14_42)]"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>None</span><span>1</span><span>2</span><span>3</span>
              </div>
            </div>

            {profile.cheatDaysPerWeek > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-3">What do you love to indulge in?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHEAT_PREF_OPTIONS.map((opt) => (
                    <Toggle
                      key={opt.id}
                      active={profile.cheatDayPrefs.includes(opt.id)}
                      onToggle={() => toggleList("cheatDayPrefs", opt.id)}
                      label={opt.label}
                      emoji={opt.emoji}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Dietary prefs ── */}
        <Section title="Dietary Preferences" subtitle="AI will respect these when generating every meal.">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <Toggle
                key={opt.id}
                active={profile.dietaryPrefs.includes(opt.id)}
                onToggle={() => toggleList("dietaryPrefs", opt.id)}
                label={opt.label}
                emoji={opt.emoji}
              />
            ))}
          </div>
        </Section>

        {/* ── Allergies ── */}
        <Section title="Allergies & Avoidances" subtitle="These are hard limits — never included in your plan.">
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((opt) => (
              <Toggle
                key={opt.id}
                active={profile.allergies.includes(opt.id)}
                onToggle={() => toggleList("allergies", opt.id)}
                label={opt.label}
              />
            ))}
            <button className="px-3 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40">
              + Add other
            </button>
          </div>
        </Section>

        {/* ── Cuisine preferences ── */}
        <Section title="Cuisine Preferences" subtitle="Select the cuisines you want in your rotation.">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CUISINE_OPTIONS.map((opt) => (
              <Toggle
                key={opt.id}
                active={profile.cuisinePrefs.includes(opt.id)}
                onToggle={() => toggleList("cuisinePrefs", opt.id)}
                label={opt.id}
                emoji={opt.emoji}
              />
            ))}
          </div>
        </Section>

        {/* Save */}
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div>
            <p className="font-semibold text-foreground">Ready to generate your plan?</p>
            <p className="text-sm text-muted-foreground">Save your profile, then let AI build your week.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { saveKitchenProfile(profile); setSaved(true); }}
              className={cn(buttonVariants(), "bg-primary hover:bg-primary/90")}
            >
              {saved ? "✓ Saved" : "Save profile"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
