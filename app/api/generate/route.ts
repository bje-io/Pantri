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

function buildKitchenContext(profile: KitchenProfileData | null): string {
  if (!profile) return "";

  const goalLabels: Record<string, string> = {
    "lose-weight":  "Lose Weight — calorie deficit, higher protein, smart carbs",
    maintain:       "Maintain weight — balanced macros, sustainable variety",
    "build-muscle": "Build Muscle — calorie surplus, high protein, nutrient-dense",
    "eat-healthy":  "Eat Healthier — whole foods, less processed, balanced",
    custom:         "Custom targets",
  };

  const macros = profile.macros;
  const derivedCals    = macros ? Math.round(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9) : null;
  const perMealCals    = derivedCals    ? Math.round(derivedCals    / 3) : null;
  const perMealProtein = macros?.protein ? Math.round(macros.protein / 3) : null;
  const perMealCarbs   = macros?.carbs   ? Math.round(macros.carbs   / 3) : null;
  const perMealFat     = macros?.fat     ? Math.round(macros.fat     / 3) : null;

  const lines: string[] = ["=== USER KITCHEN PROFILE — apply all constraints strictly ==="];

  if (profile.goal)    lines.push(`Goal: ${goalLabels[profile.goal] ?? profile.goal}`);
  if (derivedCals)     lines.push(`Daily calorie target: ${derivedCals} kcal`);
  if (perMealCals)     lines.push(`Per-meal calorie target: ~${perMealCals} kcal (aim within ±10%)`);
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

// ── Route handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "needs-key" }, { status: 500 });
  }

  const { mode, prompt, calories, cookTime, servings, kitchenProfile } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const kitchenContext = buildKitchenContext(kitchenProfile ?? null);

  // Manual form overrides (these take precedence over profile defaults)
  const overrides = [
    calories && `max ${calories} calories per meal`,
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

USER REQUEST: "${prompt}"${overrides ? `\nUSER OVERRIDES (take precedence over profile): ${overrides}` : ""}

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
