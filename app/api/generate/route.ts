import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "needs-key" }, { status: 500 });
  }

  const { mode, prompt, calories, cookTime, servings } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const constraints = [
    calories && `max ${calories} calories per meal`,
    cookTime && `max ${cookTime} minutes cook time`,
    servings && `${servings} servings`,
  ]
    .filter(Boolean)
    .join(", ");

  try {
    if (mode === "single") {
      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Generate a single recipe based on this request: "${prompt}"${constraints ? ` (constraints: ${constraints})` : ""}.

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

      const text =
        message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const recipe = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ recipe });
    } else {
      // Week mode
      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Generate a full week meal plan (7 days, breakfast + lunch + dinner each day) based on: "${prompt}"${constraints ? ` (constraints: ${constraints})` : ""}.

Return ONLY a valid JSON object, no extra text:
{
  "days": [
    {
      "day": "Sunday",
      "breakfast": { "name": "...", "description": "...", "calories": 350, "cookTime": 15, "tags": ["Quick"] },
      "lunch": { "name": "...", "description": "...", "calories": 450, "cookTime": 20, "tags": ["Healthy"] },
      "dinner": { "name": "...", "description": "...", "calories": 550, "cookTime": 35, "tags": ["High Protein"] }
    }
  ]
}

Include all 7 days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.`,
          },
        ],
      });

      const text =
        message.content[0].type === "text" ? message.content[0].text : "";
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
