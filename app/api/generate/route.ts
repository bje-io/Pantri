import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// ── Kitchen context builder ───────────────────────────────────────

type KitchenProfileData = {
  goal?: string;
  macros?: { protein: number; carbs: number; fat: number };
  dietaryPrefs?: string[];
  allergies?: string[];
  cuisinePrefs?: string[];
  cookTimeMax?: number;
  servings?: number;
};

function buildKitchenContext(
  profile: KitchenProfileData | null,
  mealType?: string
): string {
  if (!profile) return "";

  const goalLabels: Record<string, string> = {
    "lose-weight":  "Lose Weight — calorie deficit, higher protein, smart carbs",
    maintain:       "Maintain weight — balanced macros, sustainable variety",
    "build-muscle": "Build Muscle — calorie surplus, high protein, nutrient-dense",
  };

  // Meal-type calorie shares; default to even split when no type specified
  const MEAL_SHARES: Record<string, number> = {
    breakfast: 0.25,
    lunch:     0.35,
    dinner:    0.40,
  };
  const share = mealType ? (MEAL_SHARES[mealType] ?? 1 / 3) : 1 / 3;

  const macros = profile.macros;
  const derivedCals    = macros ? Math.round(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9) : null;
  const perMealCals    = derivedCals    ? Math.round(derivedCals    * share) : null;
  const perMealProtein = macros?.protein ? Math.round(macros.protein * share) : null;
  const perMealCarbs   = macros?.carbs   ? Math.round(macros.carbs   * share) : null;
  const perMealFat     = macros?.fat     ? Math.round(macros.fat     * share) : null;

  const lines: string[] = ["=== USER KITCHEN PROFILE — apply all constraints strictly ==="];

  if (profile.goal)    lines.push(`Goal: ${goalLabels[profile.goal] ?? profile.goal}`);
  if (derivedCals)     lines.push(`Daily calorie target: ${derivedCals} kcal`);
  if (perMealCals && mealType) {
    lines.push(
      `Per-meal calorie target for ${mealType}: ~${perMealCals} kcal ` +
      `(${Math.round(share * 100)}% of daily total — aim within ±10%)`
    );
  } else if (perMealCals) {
    lines.push(`Per-meal calorie target: ~${perMealCals} kcal (aim within ±10%)`);
  }
  if (macros)          lines.push(`Daily macros: Protein ${macros.protein}g | Carbs ${macros.carbs}g | Fat ${macros.fat}g`);
  if (perMealProtein !== null) {
    lines.push(`Per-meal macros: Protein ~${perMealProtein}g | Carbs ~${perMealCarbs}g | Fat ~${perMealFat}g`);
  }

  if (profile.dietaryPrefs?.length) {
    lines.push(`Dietary requirements (MUST comply): ${profile.dietaryPrefs.join(", ")}`);
  }

  if (profile.allergies?.length) {
    lines.push(`ALLERGIES — NEVER include any of these in any ingredient: ${profile.allergies.join(", ")}`);
  }

  if (profile.cuisinePrefs?.length) {
    lines.push(`Preferred cuisines (choose from these when possible): ${profile.cuisinePrefs.join(", ")}`);
  }

  if (profile.cookTimeMax) lines.push(`Max total cook time: ${profile.cookTimeMax} minutes`);
  if (profile.servings)    lines.push(`Servings per recipe: ${profile.servings}`);

  lines.push("=== END KITCHEN PROFILE ===");

  return lines.join("\n");
}

// ── Meal-type semantic context ────────────────────────────────────
//
// Each meal type carries its own conventions around calories, cook time,
// appropriate food categories, macro emphasis, and what to avoid.
// This is injected into the single-recipe prompt so the model generates
// something that genuinely fits the meal slot — not just a generic recipe
// re-labelled as "breakfast."

type MealTypeSpec = {
  calorieShareNote: string;
  cookTimeWindow: string;
  appropriateFoods: string;
  macroEmphasis: string;
  avoid: string;
};

const MEAL_TYPE_SPECS: Record<string, MealTypeSpec> = {
  breakfast: {
    calorieShareNote:
      "Breakfast is the lightest meal — typically 25% of daily calories. " +
      "Keep it in the 300–500 kcal range unless the kitchen profile specifies otherwise.",
    cookTimeWindow:
      "5–20 minutes. Morning time is limited; the dish must be quick to prepare.",
    appropriateFoods:
      "Eggs (scrambled, poached, fried, omelette), oatmeal and porridge, " +
      "yogurt and fruit parfaits, overnight oats, smoothie bowls, pancakes, " +
      "waffles, avocado toast, breakfast burritos, granola, frittatas, " +
      "breakfast sandwiches, chia puddings.",
    macroEmphasis:
      "Moderate protein (20–30g) for morning satiety; carb-forward to fuel the day; " +
      "lighter on heavy saturated fats. Include fibre-rich ingredients where possible.",
    avoid:
      "Heavy stews, braises, roasts, red-meat-centric dishes, alcohol-based sauces, " +
      "overly rich restaurant-style preparations, dishes that require extended marinating " +
      "or slow cooking. Nothing that feels unnatural to eat at 7–9 AM.",
  },
  lunch: {
    calorieShareNote:
      "Lunch is the midday meal — typically 35% of daily calories. " +
      "Aim for 400–600 kcal unless the kitchen profile specifies otherwise.",
    cookTimeWindow:
      "15–30 minutes. Lunch is often batch-cooked or assembled quickly.",
    appropriateFoods:
      "Grain bowls, Buddha bowls, salads with substantial protein, wraps, sandwiches, " +
      "soups and chowders, stir-fries, bento-style plates, quesadillas, grain salads, " +
      "frittata slices, noodle salads, hearty legume dishes.",
    macroEmphasis:
      "Balanced macros: enough protein (25–40g) to sustain afternoon focus, " +
      "complex carbohydrates for steady energy, good fibre content. " +
      "Moderate fat — satisfying but not heavy.",
    avoid:
      "Very heavy or rich dishes that would cause an afternoon energy crash, " +
      "dishes that are difficult to portion or pack, anything that needs to be " +
      "served immediately from the oven and doesn't hold well.",
  },
  dinner: {
    calorieShareNote:
      "Dinner is the most substantial meal — typically 40% of daily calories. " +
      "Aim for 500–700 kcal unless the kitchen profile specifies otherwise.",
    cookTimeWindow:
      "25–50 minutes. The evening allows more time and attention in the kitchen.",
    appropriateFoods:
      "Protein centerpiece dishes (chicken, fish, beef, tofu) with vegetables and " +
      "complex carbs, pasta dishes, curries, braises, sheet-pan meals, roasted dishes, " +
      "stews, risottos, grain-and-protein combos, tacos and burritos, " +
      "stir-fries, stuffed vegetables, salmon dishes.",
    macroEmphasis:
      "Higher protein (35–50g) to support overnight muscle recovery; " +
      "complex carbohydrates for sustained satiety; moderate-to-higher fat for " +
      "flavour and fullness. The dish should feel complete and deeply satisfying " +
      "as the final meal of the day.",
    avoid:
      "Very light or snack-like preparations that don't satisfy as a main meal, " +
      "dishes whose character is clearly breakfast or brunch. " +
      "Avoid meals that are too calorie-sparse to close out the day.",
  },
};

function buildMealTypeContext(mealType?: string): string {
  if (!mealType) return "";
  const spec = MEAL_TYPE_SPECS[mealType];
  if (!spec) return "";

  const label = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  return [
    `=== MEAL TYPE: ${label.toUpperCase()} — follow these conventions strictly ===`,
    `Calorie guidance: ${spec.calorieShareNote}`,
    `Cook time: ${spec.cookTimeWindow}`,
    `Appropriate foods and formats: ${spec.appropriateFoods}`,
    `Macro emphasis: ${spec.macroEmphasis}`,
    `Avoid: ${spec.avoid}`,
    `=== END MEAL TYPE ===`,
  ].join("\n");
}

// ── Route handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "needs-key" }, { status: 500 });
  }

  const { mode, prompt, calories, cookTime, servings, kitchenProfile, mealType } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  // Pass mealType into kitchen context so per-meal calorie targets use the right share
  const kitchenContext  = buildKitchenContext(kitchenProfile ?? null, mealType ?? undefined);
  const mealTypeContext = buildMealTypeContext(mealType ?? undefined);

  // Manual form overrides (these take precedence over profile defaults)
  const overrides = [
    calories && `max ${calories} calories`,
    cookTime && `max ${cookTime} minutes cook time`,
    servings && `${servings} servings`,
  ]
    .filter(Boolean)
    .join(", ");

  try {
    if (mode === "single") {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are Sage, an AI chef for Pantri. Generate a single recipe.

${kitchenContext}

${mealTypeContext}

USER REQUEST: "${prompt}"${overrides ? `\nUSER OVERRIDES (take precedence over all): ${overrides}` : ""}

Return ONLY a valid JSON object with this exact structure, no extra text:
{
  "name": "Recipe Name",
  "description": "1-2 sentence description of the dish",
  "cuisine": "cuisine type (e.g. Italian, Thai, Mexican)",
  "cookTime": 30,
  "servings": 2,
  "calories": 450,
  "protein": 35,
  "carbs": 40,
  "fat": 12,
  "tags": ["High Protein", "Quick"],
  "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1 description.", "Step 2 description."]
}`,
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const recipe = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ recipe });

    } else {
      // Week mode
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are Sage, an AI chef for Pantri. Generate a full week meal plan (7 days, breakfast + lunch + dinner each day).

${kitchenContext}

USER REQUEST: "${prompt}"${overrides ? `\nUSER OVERRIDES (take precedence over profile): ${overrides}` : ""}

Return ONLY a valid JSON object, no extra text:
{
  "days": [
    {
      "day": "Sunday",
      "breakfast": { "name": "...", "description": "...", "calories": 350, "cookTime": 15, "tags": ["Quick"] },
      "lunch":     { "name": "...", "description": "...", "calories": 450, "cookTime": 20, "tags": ["Healthy"] },
      "dinner":    { "name": "...", "description": "...", "calories": 550, "cookTime": 35, "tags": ["High Protein"] }
    }
  ]
}

Include all 7 days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.`,
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const plan = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ plan });
    }
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
