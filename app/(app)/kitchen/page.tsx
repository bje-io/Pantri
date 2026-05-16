"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────

type MacroSplit = { protein: number; carbs: number; fat: number };

type KitchenProfile = {
  dailyCalories: number;
  macros: MacroSplit;
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

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", emoji: "🥦" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "gluten-free", label: "Gluten-Free", emoji: "🌾" },
  { id: "dairy-free", label: "Dairy-Free", emoji: "🥛" },
  { id: "low-carb", label: "Low Carb", emoji: "🍞" },
  { id: "keto", label: "Keto", emoji: "🥑" },
  { id: "paleo", label: "Paleo", emoji: "🦴" },
  { id: "halal", label: "Halal", emoji: "☪️" },
];

const ALLERGY_OPTIONS = [
  { id: "nuts", label: "Tree Nuts" },
  { id: "peanuts", label: "Peanuts" },
  { id: "shellfish", label: "Shellfish" },
  { id: "fish", label: "Fish" },
  { id: "eggs", label: "Eggs" },
  { id: "soy", label: "Soy" },
  { id: "sesame", label: "Sesame" },
];

const CUISINE_OPTIONS = [
  { id: "Japanese", emoji: "🇯🇵" },
  { id: "Mexican", emoji: "🇲🇽" },
  { id: "Greek", emoji: "🇬🇷" },
  { id: "Thai", emoji: "🇹🇭" },
  { id: "Indian", emoji: "🇮🇳" },
  { id: "Italian", emoji: "🇮🇹" },
  { id: "American", emoji: "🇺🇸" },
  { id: "Mediterranean", emoji: "🌊" },
  { id: "Chinese", emoji: "🇨🇳" },
  { id: "Korean", emoji: "🇰🇷" },
  { id: "French", emoji: "🇫🇷" },
  { id: "Middle Eastern", emoji: "🌙" },
];

const CHEAT_PREF_OPTIONS = [
  { id: "burgers", label: "Burgers & Fries", emoji: "🍔" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "tacos", label: "Street Tacos", emoji: "🌮" },
  { id: "pasta", label: "Pasta", emoji: "🍝" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "bbq", label: "BBQ", emoji: "🍖" },
  { id: "desserts", label: "Desserts", emoji: "🍰" },
  { id: "brunch", label: "Brunch", emoji: "🥞" },
];

const GOAL_OPTIONS = [
  { id: "lose-weight", label: "Lose Weight", emoji: "⬇️", desc: "Calorie deficit, high protein, smart carbs" },
  { id: "maintain", label: "Maintain", emoji: "⚖️", desc: "Balanced macros, sustainable variety" },
  { id: "build-muscle", label: "Build Muscle", emoji: "💪", desc: "High protein, calorie surplus, nutrient-dense" },
  { id: "eat-healthy", label: "Eat Healthier", emoji: "🥗", desc: "Whole foods, less processed, more variety" },
  { id: "custom", label: "Custom", emoji: "⚙️", desc: "Set your own targets manually" },
] as const;

const GOAL_DEFAULTS: Record<string, Partial<KitchenProfile>> = {
  "lose-weight": { dailyCalories: 1600, macros: { protein: 40, carbs: 35, fat: 25 } },
  maintain: { dailyCalories: 2000, macros: { protein: 30, carbs: 40, fat: 30 } },
  "build-muscle": { dailyCalories: 2400, macros: { protein: 35, carbs: 45, fat: 20 } },
  "eat-healthy": { dailyCalories: 1900, macros: { protein: 25, carbs: 50, fat: 25 } },
  custom: {},
};

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

function Toggle({
  active,
  onToggle,
  label,
  emoji,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  emoji?: string;
}) {
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
  dailyCalories: 2000,
  macros: { protein: 30, carbs: 40, fat: 30 },
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
    const defaults = GOAL_DEFAULTS[goal] ?? {};
    setProfile((p) => ({ ...p, goal, ...defaults }));
    setSaved(false);
  }

  const totalMacros = profile.macros.protein + profile.macros.carbs + profile.macros.fat;

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🍽️</span>
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">My Kitchen</h1>
            <p className="text-muted-foreground text-sm">
              Set your goals and preferences — AI uses these to build every meal plan.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Goal ── */}
        <Section title="What's your goal?" subtitle="This shapes your calorie targets and macro split.">
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
        <Section title="Nutrition Targets" subtitle="Daily goals AI will aim for when building your plan.">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Daily calories</label>
                <span className="text-sm font-bold text-primary">{profile.dailyCalories} kcal</span>
              </div>
              <input
                type="range"
                min={1000}
                max={3500}
                step={50}
                value={profile.dailyCalories}
                onChange={(e) => set("dailyCalories", Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1,000</span><span>3,500</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-3">Macro split</p>
              <div className="grid grid-cols-3 gap-4">
                {(["protein", "carbs", "fat"] as const).map((macro) => (
                  <div key={macro}>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-muted-foreground capitalize">{macro}</label>
                      <span className="text-xs font-semibold text-foreground">{profile.macros[macro]}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={70}
                      step={5}
                      value={profile.macros[macro]}
                      onChange={(e) =>
                        set("macros", { ...profile.macros, [macro]: Number(e.target.value) })
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                ))}
              </div>
              {totalMacros !== 100 && (
                <p className="text-xs text-destructive mt-2">
                  Macros total {totalMacros}% — adjust to reach 100%
                </p>
              )}
              {/* Visual bar */}
              <div className="flex rounded-full overflow-hidden h-3 mt-3">
                <div className="bg-primary transition-all" style={{ width: `${profile.macros.protein}%` }} />
                <div className="bg-accent transition-all" style={{ width: `${profile.macros.carbs}%` }} />
                <div className="bg-muted-foreground/40 transition-all" style={{ width: `${profile.macros.fat}%` }} />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Protein</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent inline-block" />Carbs</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" />Fat</span>
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
                >
                  −
                </button>
                <span className="text-2xl font-bold text-foreground w-8 text-center">{profile.servings}</span>
                <button
                  onClick={() => set("servings", Math.min(8, profile.servings + 1))}
                  className="h-9 w-9 rounded-full border border-border text-foreground hover:border-primary hover:text-primary text-lg transition-colors"
                >
                  +
                </button>
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
                          onClick={() =>
                            set("mealConsistency", { ...profile.mealConsistency, [meal]: mode })
                          }
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
              onClick={() => setSaved(true)}
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
