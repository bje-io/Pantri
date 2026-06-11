export type MealType = "breakfast" | "lunch" | "dinner";

// Recipes can additionally be tagged as snacks (planner slots between meals)
export type RecipeMealType = MealType | "snack";

// Planner slot keys — 5 per day: 3 meals + 2 snacks
export type SlotKey = "breakfast" | "morningSnack" | "lunch" | "afternoonSnack" | "dinner";

export const SLOT_KEYS: SlotKey[] = [
  "breakfast",
  "morningSnack",
  "lunch",
  "afternoonSnack",
  "dinner",
];

/** Which recipe meal-type a planner slot draws from */
export function slotRecipeType(slot: SlotKey): RecipeMealType {
  if (slot === "morningSnack" || slot === "afternoonSnack") return "snack";
  return slot;
}

// Daily calorie/macro share per slot. Meals carry 80%, snacks fill the
// remaining 20% — snacks exist precisely to close the macro gap that
// three square meals alone can't reach.
export const SLOT_SHARES: Record<SlotKey, number> = {
  breakfast:      0.20,
  morningSnack:   0.10,
  lunch:          0.30,
  afternoonSnack: 0.10,
  dinner:         0.30,
};

export type Macro = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Ingredient = {
  amount: string;
  item: string;
  perishable?: boolean;
  shelfDays?: number; // days fresh after purchase
};

export type Recipe = {
  id: string;
  title: string;
  cuisine: string;
  mealType: RecipeMealType[];
  cookTime: number;
  prepTime: number;
  servings: number;
  macros: Macro;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  source: "seed" | "ai" | "user" | "forum";
  isCheatDay?: boolean;
};

export type MealSlot = {
  recipe: Recipe | null;
  isCheatDay?: boolean;
  /** Override the recipe's default serving count for this specific slot */
  servings?: number;
};

export type DayPlan = {
  day: string;
  isCheatDay: boolean;
  meals: Record<SlotKey, MealSlot>;
};

export type WeekPlan = {
  weekStart: string; // ISO date of Sunday
  days: DayPlan[];
};

// ─── Breakfast Recipes (10) ──────────────────────────────────────

export const BREAKFAST_RECIPES: Recipe[] = [
  {
    id: "turkish-menemen",
    title: "Turkish Menemen",
    cuisine: "Turkish",
    mealType: ["breakfast"],
    cookTime: 12,
    prepTime: 8,
    servings: 2,
    macros: { calories: 310, protein: 15, carbs: 12, fat: 22 },
    tags: ["vegetarian", "gluten-free", "quick", "spicy"],
    source: "seed",
    ingredients: [
      { amount: "4", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "2", item: "Roma tomatoes, diced", perishable: true, shelfDays: 4 },
      { amount: "1", item: "green bell pepper, diced", perishable: true, shelfDays: 7 },
      { amount: "½", item: "medium onion, diced", perishable: true, shelfDays: 14 },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "½ tsp", item: "cumin" },
      { amount: "½ tsp", item: "red pepper flakes" },
      { amount: "¼ cup", item: "fresh parsley, chopped", perishable: true, shelfDays: 5 },
    ],
    steps: [
      "Heat olive oil in a wide skillet over medium. Cook onion and pepper until soft, 5 min.",
      "Add tomatoes, cumin, and red pepper flakes. Simmer 4–5 min until jammy.",
      "Crack eggs directly into the tomato mixture. Stir gently, scrambling loosely.",
      "Cook until eggs are just set but still creamy. Season with salt.",
      "Scatter parsley over the top. Serve with crusty bread or simit.",
    ],
  },
  {
    id: "smoked-salmon-bagel",
    title: "Smoked Salmon Bagel",
    cuisine: "American",
    mealType: ["breakfast"],
    cookTime: 0,
    prepTime: 8,
    servings: 2,
    macros: { calories: 445, protein: 25, carbs: 58, fat: 12 },
    tags: ["no-cook", "quick", "dairy-free-option"],
    source: "seed",
    ingredients: [
      { amount: "2", item: "everything bagels, toasted" },
      { amount: "4 oz", item: "smoked salmon", perishable: true, shelfDays: 5 },
      { amount: "4 tbsp", item: "whipped cream cheese", perishable: true, shelfDays: 14 },
      { amount: "¼", item: "red onion, thinly sliced", perishable: true, shelfDays: 14 },
      { amount: "2 tbsp", item: "capers" },
      { amount: "1 tbsp", item: "fresh dill", perishable: true, shelfDays: 5 },
      { amount: "½", item: "lemon, for squeezing" },
      { amount: "¼", item: "cucumber, thinly sliced", perishable: true, shelfDays: 7 },
    ],
    steps: [
      "Toast bagels until golden.",
      "Spread cream cheese generously on each half.",
      "Layer cucumber, then drape smoked salmon over the top.",
      "Scatter red onion, capers, and fresh dill.",
      "Finish with a squeeze of lemon and a crack of black pepper.",
    ],
  },
  {
    id: "mango-coconut-chia-pudding",
    title: "Mango Coconut Chia Pudding",
    cuisine: "Thai-Inspired",
    mealType: ["breakfast"],
    cookTime: 0,
    prepTime: 8,
    servings: 2,
    macros: { calories: 460, protein: 8, carbs: 42, fat: 30 },
    tags: ["vegan", "dairy-free", "meal-prep", "no-cook", "gluten-free"],
    source: "seed",
    ingredients: [
      { amount: "6 tbsp", item: "chia seeds" },
      { amount: "1½ cups", item: "full-fat coconut milk" },
      { amount: "1 tsp", item: "vanilla extract" },
      { amount: "1 tbsp", item: "maple syrup" },
      { amount: "1 large", item: "ripe mango, diced", perishable: true, shelfDays: 4 },
      { amount: "2 tbsp", item: "toasted coconut flakes" },
      { amount: "1 tsp", item: "lime zest" },
    ],
    steps: [
      "Whisk chia seeds, coconut milk, vanilla, and maple syrup together.",
      "Cover and refrigerate at least 4 hours or overnight until thick.",
      "Stir well before serving — add a splash of milk if too thick.",
      "Spoon into bowls. Top with diced mango, coconut flakes, and lime zest.",
    ],
  },
  {
    id: "chorizo-potato-hash",
    title: "Spicy Chorizo & Potato Hash",
    cuisine: "Spanish",
    mealType: ["breakfast"],
    cookTime: 22,
    prepTime: 10,
    servings: 2,
    macros: { calories: 520, protein: 28, carbs: 42, fat: 26 },
    tags: ["high-protein", "gluten-free", "spicy", "weeknight"],
    source: "seed",
    ingredients: [
      { amount: "6 oz", item: "Spanish chorizo, diced", perishable: true, shelfDays: 7 },
      { amount: "2 medium", item: "Yukon Gold potatoes, diced small", perishable: true, shelfDays: 14 },
      { amount: "1", item: "red bell pepper, diced", perishable: true, shelfDays: 7 },
      { amount: "½", item: "yellow onion, diced", perishable: true, shelfDays: 14 },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "4", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "1 tsp", item: "smoked paprika" },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "2 tbsp", item: "fresh parsley, chopped", perishable: true, shelfDays: 5 },
    ],
    steps: [
      "Parboil diced potatoes 5 min until just tender. Drain.",
      "Heat olive oil in a large cast-iron skillet over medium-high. Cook chorizo 3 min until fat renders.",
      "Add potatoes; press flat. Cook undisturbed 4 min until crusted. Toss and repeat.",
      "Add bell pepper, onion, and garlic. Cook 4 min. Season with smoked paprika.",
      "Make 4 wells. Crack an egg into each. Cover and cook 3–4 min until whites set.",
      "Scatter parsley. Serve straight from the pan.",
    ],
  },
  {
    id: "cottage-cheese-pancakes",
    title: "High-Protein Cottage Cheese Pancakes",
    cuisine: "American",
    mealType: ["breakfast"],
    cookTime: 12,
    prepTime: 5,
    servings: 2,
    macros: { calories: 355, protein: 22, carbs: 38, fat: 12 },
    tags: ["vegetarian", "quick", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "1 cup", item: "full-fat cottage cheese", perishable: true, shelfDays: 7 },
      { amount: "2", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "½ cup", item: "rolled oats" },
      { amount: "1 tbsp", item: "honey" },
      { amount: "½ tsp", item: "vanilla extract" },
      { amount: "½ tsp", item: "cinnamon" },
      { amount: "½ cup", item: "fresh blueberries", perishable: true, shelfDays: 5 },
      { amount: "2 tbsp", item: "maple syrup, to serve" },
    ],
    steps: [
      "Blend cottage cheese, eggs, oats, honey, vanilla, and cinnamon until smooth.",
      "Heat a non-stick skillet over medium-low. Lightly coat with cooking spray.",
      "Pour batter in ¼-cup portions. Cook 2–3 min per side until golden.",
      "Stack and top with blueberries and a drizzle of maple syrup.",
    ],
  },
  {
    id: "spicy-tofu-scramble",
    title: "Spicy Tofu Scramble with Veggies",
    cuisine: "Asian-Fusion",
    mealType: ["breakfast"],
    cookTime: 12,
    prepTime: 8,
    servings: 2,
    macros: { calories: 295, protein: 18, carbs: 14, fat: 18 },
    tags: ["vegan", "dairy-free", "low-carb", "gluten-free"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "firm tofu, crumbled", perishable: true, shelfDays: 5 },
      { amount: "1 cup", item: "baby spinach", perishable: true, shelfDays: 5 },
      { amount: "½", item: "red bell pepper, diced", perishable: true, shelfDays: 7 },
      { amount: "2", item: "scallions, sliced", perishable: true, shelfDays: 7 },
      { amount: "1 tbsp", item: "soy sauce (low sodium)" },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "1 tsp", item: "turmeric" },
      { amount: "1 tsp", item: "sriracha" },
      { amount: "½ tsp", item: "garlic powder" },
    ],
    steps: [
      "Drain and press tofu, then crumble into rough chunks.",
      "Heat sesame oil in a skillet over medium-high. Add bell pepper; cook 2 min.",
      "Add crumbled tofu. Sprinkle turmeric and garlic powder. Cook undisturbed 3 min to brown.",
      "Stir in soy sauce and sriracha. Add spinach and toss until wilted.",
      "Finish with scallions and a squeeze of lime. Serve with toast or rice.",
    ],
  },
  {
    id: "shakshuka-verde",
    title: "Green Shakshuka",
    cuisine: "Israeli",
    mealType: ["breakfast"],
    cookTime: 18,
    prepTime: 10,
    servings: 2,
    macros: { calories: 390, protein: 20, carbs: 20, fat: 24 },
    tags: ["vegetarian", "gluten-free", "low-carb"],
    source: "seed",
    ingredients: [
      { amount: "4", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "2 cups", item: "baby spinach", perishable: true, shelfDays: 5 },
      { amount: "1 cup", item: "frozen peas, thawed" },
      { amount: "1", item: "zucchini, grated", perishable: true, shelfDays: 5 },
      { amount: "1", item: "jalapeño, sliced", perishable: true, shelfDays: 7 },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "½ cup", item: "labneh or thick yogurt", perishable: true, shelfDays: 7 },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "¼ cup", item: "fresh cilantro or parsley", perishable: true, shelfDays: 4 },
    ],
    steps: [
      "Heat olive oil in a wide skillet. Sauté garlic and jalapeño 1 min.",
      "Add grated zucchini and peas. Cook 4 min until any liquid evaporates.",
      "Stir in spinach and cumin until wilted. Season generously.",
      "Make 4 wells. Crack an egg into each. Cover and cook 5–6 min until whites set.",
      "Dollop labneh around the eggs. Scatter herbs and serve with pita.",
    ],
  },
  {
    id: "japanese-okayu",
    title: "Okayu (Japanese Rice Porridge)",
    cuisine: "Japanese",
    mealType: ["breakfast"],
    cookTime: 30,
    prepTime: 5,
    servings: 2,
    macros: { calories: 330, protein: 13, carbs: 44, fat: 8 },
    tags: ["dairy-free", "gluten-free", "comforting"],
    source: "seed",
    ingredients: [
      { amount: "½ cup", item: "short-grain white rice" },
      { amount: "4 cups", item: "dashi or chicken broth", perishable: true, shelfDays: 3 },
      { amount: "2", item: "soft-boiled eggs, halved", perishable: true, shelfDays: 3 },
      { amount: "2 tsp", item: "white miso paste" },
      { amount: "2", item: "scallions, thinly sliced", perishable: true, shelfDays: 7 },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "1 tsp", item: "fresh ginger, grated" },
      { amount: "1 sheet", item: "nori, cut into strips" },
    ],
    steps: [
      "Rinse rice. Combine with broth in a pot over medium heat.",
      "Bring to a boil, then reduce to the lowest simmer. Cook 25–30 min, stirring occasionally, until porridge is thick and creamy.",
      "Stir in miso, ginger, and sesame oil. Adjust seasoning.",
      "Ladle into bowls. Top with a halved soft-boiled egg, scallions, and nori strips.",
    ],
  },
  {
    id: "chilaquiles-verdes",
    title: "Chilaquiles Verdes",
    cuisine: "Mexican",
    mealType: ["breakfast"],
    cookTime: 15,
    prepTime: 10,
    servings: 2,
    macros: { calories: 470, protein: 22, carbs: 48, fat: 22 },
    tags: ["vegetarian", "gluten-free", "spicy", "weeknight"],
    source: "seed",
    ingredients: [
      { amount: "4 oz", item: "tortilla chips (thick-cut)" },
      { amount: "1½ cups", item: "salsa verde (jarred or homemade)" },
      { amount: "4", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "½ cup", item: "crumbled queso fresco or feta", perishable: true, shelfDays: 7 },
      { amount: "¼ cup", item: "Mexican crema or sour cream", perishable: true, shelfDays: 10 },
      { amount: "½", item: "avocado, sliced", perishable: true, shelfDays: 2 },
      { amount: "¼ cup", item: "fresh cilantro leaves", perishable: true, shelfDays: 4 },
      { amount: "¼ cup", item: "diced white onion" },
    ],
    steps: [
      "Heat salsa verde in a wide skillet over medium until simmering.",
      "Add tortilla chips; fold gently to coat. Cook 2 min until chips are slightly softened but still have some crunch.",
      "Push chips to the sides. Fry eggs in the centre to your liking.",
      "Transfer to plates. Top with queso fresco, crema, avocado, cilantro, and onion.",
    ],
  },
  {
    id: "congee-soft-egg",
    title: "Ginger Congee with Soft-Boiled Egg",
    cuisine: "Chinese",
    mealType: ["breakfast"],
    cookTime: 35,
    prepTime: 5,
    servings: 2,
    macros: { calories: 315, protein: 14, carbs: 44, fat: 8 },
    tags: ["dairy-free", "gluten-free", "meal-prep", "comforting"],
    source: "seed",
    ingredients: [
      { amount: "½ cup", item: "jasmine rice" },
      { amount: "5 cups", item: "low-sodium chicken broth" },
      { amount: "1 tbsp", item: "fresh ginger, grated" },
      { amount: "2", item: "garlic cloves, smashed" },
      { amount: "2", item: "soft-boiled eggs, peeled and halved", perishable: true, shelfDays: 3 },
      { amount: "2", item: "scallions, thinly sliced", perishable: true, shelfDays: 7 },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "1 tbsp", item: "soy sauce" },
      { amount: "1 tsp", item: "white pepper" },
    ],
    steps: [
      "Combine rice, broth, ginger, and garlic in a large pot. Bring to a boil.",
      "Reduce to a low simmer. Cook uncovered, stirring occasionally, 30–35 min until rice breaks down into a thick porridge.",
      "Season with soy sauce and white pepper. Remove garlic cloves.",
      "Ladle into bowls. Top with soft-boiled egg halves, scallions, and a drizzle of sesame oil.",
    ],
  },
];

// ─── Lunch Recipes (10) ──────────────────────────────────────────

export const LUNCH_RECIPES: Recipe[] = [
  {
    id: "tuna-nicoise-salad",
    title: "Tuna Niçoise Salad",
    cuisine: "French",
    mealType: ["lunch"],
    cookTime: 12,
    prepTime: 12,
    servings: 2,
    macros: { calories: 480, protein: 38, carbs: 18, fat: 26 },
    tags: ["high-protein", "gluten-free", "dairy-free", "quick"],
    source: "seed",
    ingredients: [
      { amount: "2 cans (5 oz each)", item: "tuna in olive oil, drained" },
      { amount: "4", item: "eggs, soft-boiled and halved", perishable: true, shelfDays: 3 },
      { amount: "½ lb", item: "green beans, trimmed", perishable: true, shelfDays: 5 },
      { amount: "2 cups", item: "mixed greens", perishable: true, shelfDays: 4 },
      { amount: "1 cup", item: "cherry tomatoes, halved", perishable: true, shelfDays: 5 },
      { amount: "¼ cup", item: "kalamata olives" },
      { amount: "3 tbsp", item: "olive oil" },
      { amount: "1 tbsp", item: "Dijon mustard" },
      { amount: "2 tbsp", item: "red wine vinegar" },
      { amount: "1 tsp", item: "honey" },
    ],
    steps: [
      "Blanch green beans in boiling salted water 3 min. Immediately plunge into ice water to stop cooking. Drain.",
      "Whisk olive oil, Dijon, red wine vinegar, and honey to make dressing. Season well.",
      "Arrange greens on two plates. Top with green beans, tomatoes, and olives.",
      "Flake tuna over the salad. Place egg halves on top.",
      "Drizzle generously with dressing and serve immediately.",
    ],
  },
  {
    id: "falafel-pita",
    title: "Crispy Falafel Pita with Tahini",
    cuisine: "Lebanese",
    mealType: ["lunch"],
    cookTime: 20,
    prepTime: 15,
    servings: 2,
    macros: { calories: 530, protein: 20, carbs: 64, fat: 22 },
    tags: ["vegetarian", "vegan", "dairy-free", "high-fiber"],
    source: "seed",
    ingredients: [
      { amount: "1 can (14 oz)", item: "chickpeas, drained and rinsed" },
      { amount: "¼ cup", item: "fresh parsley" },
      { amount: "¼ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
      { amount: "3", item: "garlic cloves" },
      { amount: "½ tsp", item: "cumin" },
      { amount: "½ tsp", item: "coriander" },
      { amount: "3 tbsp", item: "flour" },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "2", item: "pita breads, halved" },
      { amount: "3 tbsp", item: "tahini" },
      { amount: "2 tbsp", item: "lemon juice" },
      { amount: "1 cup", item: "shredded lettuce", perishable: true, shelfDays: 4 },
      { amount: "1", item: "tomato, sliced", perishable: true, shelfDays: 4 },
    ],
    steps: [
      "Pulse chickpeas, parsley, cilantro, garlic, cumin, coriander, and flour in a food processor until coarse. Season well.",
      "Form into 8 small patties. Refrigerate 15 min if time allows.",
      "Pan-fry in olive oil over medium-high, 3–4 min per side until deep golden.",
      "Whisk tahini with lemon juice, 2 tbsp water, and salt until smooth and pourable.",
      "Fill pita with lettuce, tomato, and falafel. Drizzle with tahini sauce.",
    ],
  },
  {
    id: "mango-shrimp-lettuce-cups",
    title: "Mango Shrimp Lettuce Cups",
    cuisine: "Thai",
    mealType: ["lunch"],
    cookTime: 8,
    prepTime: 12,
    servings: 2,
    macros: { calories: 370, protein: 32, carbs: 28, fat: 12 },
    tags: ["high-protein", "low-carb", "gluten-free", "dairy-free", "quick"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "large shrimp, peeled and deveined", perishable: true, shelfDays: 2 },
      { amount: "1 large", item: "ripe mango, diced", perishable: true, shelfDays: 4 },
      { amount: "1", item: "red bell pepper, diced", perishable: true, shelfDays: 7 },
      { amount: "8", item: "large butter lettuce leaves", perishable: true, shelfDays: 4 },
      { amount: "2 tbsp", item: "fish sauce" },
      { amount: "2 tbsp", item: "lime juice" },
      { amount: "1 tbsp", item: "honey" },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "1 tsp", item: "red chili, minced", perishable: true, shelfDays: 7 },
      { amount: "¼ cup", item: "fresh mint leaves", perishable: true, shelfDays: 4 },
      { amount: "2 tbsp", item: "roasted peanuts, crushed" },
    ],
    steps: [
      "Whisk fish sauce, lime juice, honey, sesame oil, and chili to make dressing.",
      "Sear shrimp in a hot skillet over high heat 1–2 min per side until pink and cooked through.",
      "Toss warm shrimp with mango, bell pepper, and dressing.",
      "Spoon into lettuce cups. Top with mint leaves and crushed peanuts.",
    ],
  },
  {
    id: "harissa-chicken-flatbread",
    title: "Harissa Chicken Flatbread",
    cuisine: "Moroccan",
    mealType: ["lunch"],
    cookTime: 18,
    prepTime: 10,
    servings: 2,
    macros: { calories: 575, protein: 40, carbs: 50, fat: 22 },
    tags: ["high-protein", "spicy", "quick", "dairy-free"],
    source: "seed",
    ingredients: [
      { amount: "12 oz", item: "chicken breast, thinly sliced", perishable: true, shelfDays: 2 },
      { amount: "2", item: "flatbreads or naan" },
      { amount: "2 tbsp", item: "harissa paste" },
      { amount: "1 tbsp", item: "olive oil" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "smoked paprika" },
      { amount: "1 cup", item: "cherry tomatoes, halved", perishable: true, shelfDays: 5 },
      { amount: "½", item: "red onion, thinly sliced", perishable: true, shelfDays: 14 },
      { amount: "¼ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
      { amount: "3 tbsp", item: "tzatziki or yogurt sauce", perishable: true, shelfDays: 5 },
    ],
    steps: [
      "Toss chicken with harissa, cumin, paprika, and olive oil.",
      "Sear in a hot skillet over medium-high, 3–4 min per side until cooked and charred at edges.",
      "Warm flatbreads in a dry pan 1 min per side.",
      "Spread a thin layer of harissa on each flatbread. Top with chicken, tomatoes, and red onion.",
      "Drizzle with tzatziki and finish with fresh cilantro.",
    ],
  },
  {
    id: "lentil-soup",
    title: "Turkish Red Lentil Soup",
    cuisine: "Turkish",
    mealType: ["lunch"],
    cookTime: 30,
    prepTime: 10,
    servings: 2,
    macros: { calories: 420, protein: 18, carbs: 60, fat: 12 },
    tags: ["vegan", "dairy-free", "vegetarian", "meal-prep", "gluten-free"],
    source: "seed",
    ingredients: [
      { amount: "¾ cup", item: "red lentils, rinsed" },
      { amount: "1", item: "medium onion, diced", perishable: true, shelfDays: 14 },
      { amount: "2", item: "garlic cloves, minced" },
      { amount: "1", item: "carrot, diced", perishable: true, shelfDays: 10 },
      { amount: "1 can (14 oz)", item: "diced tomatoes" },
      { amount: "4 cups", item: "vegetable broth" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "smoked paprika" },
      { amount: "½ tsp", item: "turmeric" },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "1", item: "lemon, juiced" },
      { amount: "crusty bread", item: "to serve" },
    ],
    steps: [
      "Heat olive oil in a large pot. Sauté onion and carrot over medium until soft, 6 min.",
      "Add garlic, cumin, paprika, and turmeric; cook 1 min until fragrant.",
      "Stir in lentils, tomatoes, and broth. Bring to a boil, then simmer 20–25 min until lentils are very soft.",
      "Use an immersion blender to blend half the soup for a creamy texture. Stir to combine.",
      "Season with lemon juice and salt. Serve with crusty bread.",
    ],
  },
  {
    id: "bibimbap-lunch",
    title: "Beef & Veggie Bibimbap",
    cuisine: "Korean",
    mealType: ["lunch"],
    cookTime: 22,
    prepTime: 15,
    servings: 2,
    macros: { calories: 515, protein: 28, carbs: 64, fat: 14 },
    tags: ["dairy-free", "meal-prep", "balanced", "high-protein"],
    source: "seed",
    ingredients: [
      { amount: "1½ cups", item: "short-grain white rice, dry" },
      { amount: "8 oz", item: "beef sirloin, thinly sliced", perishable: true, shelfDays: 2 },
      { amount: "2", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "1 cup", item: "baby spinach", perishable: true, shelfDays: 5 },
      { amount: "1", item: "carrot, julienned", perishable: true, shelfDays: 10 },
      { amount: "½ cup", item: "bean sprouts", perishable: true, shelfDays: 3 },
      { amount: "2 tbsp", item: "gochujang" },
      { amount: "1 tbsp", item: "sesame oil" },
      { amount: "1 tbsp", item: "soy sauce" },
      { amount: "1 tsp", item: "sesame seeds" },
    ],
    steps: [
      "Cook rice. Marinate beef in soy sauce, sesame oil, and a pinch of sugar for 10 min. Sauté 3 min.",
      "Blanch spinach 30 sec; squeeze dry and season with sesame oil and salt.",
      "Stir-fry carrots until tender. Blanch bean sprouts 1 min; drain.",
      "Fry eggs sunny-side up in a lightly oiled pan.",
      "Divide rice into bowls. Arrange beef and vegetables in sections. Place egg in centre.",
      "Serve with gochujang. Mix everything together before eating.",
    ],
  },
  {
    id: "chicken-caesar-salad",
    title: "Grilled Chicken Caesar Salad",
    cuisine: "Italian-American",
    mealType: ["lunch"],
    cookTime: 12,
    prepTime: 10,
    servings: 2,
    macros: { calories: 390, protein: 38, carbs: 18, fat: 20 },
    tags: ["high-protein", "low-carb", "quick"],
    source: "seed",
    ingredients: [
      { amount: "12 oz", item: "chicken breast, boneless skinless", perishable: true, shelfDays: 2 },
      { amount: "1 large head", item: "romaine lettuce, chopped", perishable: true, shelfDays: 5 },
      { amount: "¼ cup", item: "Parmesan cheese, grated", perishable: true, shelfDays: 30 },
      { amount: "¼ cup", item: "croutons" },
      { amount: "3 tbsp", item: "Caesar dressing" },
      { amount: "1 tsp", item: "lemon juice" },
      { amount: "½ tsp", item: "black pepper" },
    ],
    steps: [
      "Season chicken with salt, pepper, and garlic powder. Grill or pan-sear 5–6 min per side until cooked through.",
      "Rest 5 min, then slice.",
      "Toss romaine with Caesar dressing and lemon juice.",
      "Divide salad between plates. Top with chicken, croutons, and Parmesan.",
    ],
  },
  {
    id: "black-bean-burrito-bowl",
    title: "Black Bean & Veggie Burrito Bowl",
    cuisine: "Mexican",
    mealType: ["lunch"],
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    macros: { calories: 510, protein: 20, carbs: 72, fat: 14 },
    tags: ["vegan", "vegetarian", "dairy-free", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "¾ cup", item: "brown rice, dry" },
      { amount: "1 can (14 oz)", item: "black beans, drained and rinsed" },
      { amount: "1", item: "red bell pepper, diced", perishable: true, shelfDays: 7 },
      { amount: "1 cup", item: "corn kernels (fresh or frozen)" },
      { amount: "1", item: "avocado, diced", perishable: true, shelfDays: 2 },
      { amount: "½ cup", item: "salsa" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "smoked paprika" },
      { amount: "1", item: "lime, juiced", perishable: true, shelfDays: 7 },
      { amount: "¼ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
    ],
    steps: [
      "Cook rice. Sauté bell pepper and corn in olive oil with cumin and paprika until tender, 6 min.",
      "Warm black beans with a pinch of salt and cumin.",
      "Assemble bowls: rice, beans, sautéed veg, avocado, and salsa.",
      "Finish with lime juice and cilantro.",
    ],
  },
  {
    id: "soba-noodle-bowl",
    title: "Cold Soba Noodle Bowl with Edamame",
    cuisine: "Japanese",
    mealType: ["lunch"],
    cookTime: 10,
    prepTime: 10,
    servings: 2,
    macros: { calories: 425, protein: 22, carbs: 60, fat: 8 },
    tags: ["vegan", "dairy-free", "quick", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "8 oz", item: "soba noodles" },
      { amount: "1 cup", item: "shelled edamame, cooked" },
      { amount: "1", item: "cucumber, thinly sliced", perishable: true, shelfDays: 7 },
      { amount: "1", item: "carrot, shredded", perishable: true, shelfDays: 10 },
      { amount: "2 tbsp", item: "soy sauce" },
      { amount: "1 tbsp", item: "rice vinegar" },
      { amount: "1 tbsp", item: "sesame oil" },
      { amount: "1 tsp", item: "honey" },
      { amount: "1 tsp", item: "fresh ginger, grated" },
      { amount: "1 tbsp", item: "sesame seeds" },
      { amount: "2", item: "scallions, sliced", perishable: true, shelfDays: 7 },
    ],
    steps: [
      "Cook soba noodles per package directions (4–5 min). Rinse immediately under cold water.",
      "Whisk soy sauce, rice vinegar, sesame oil, honey, and ginger for the dressing.",
      "Toss noodles with dressing. Divide into bowls.",
      "Top with edamame, cucumber, carrot, scallions, and sesame seeds.",
    ],
  },
  {
    id: "spicy-thai-noodle-salad",
    title: "Spicy Thai Peanut Noodle Salad",
    cuisine: "Thai",
    mealType: ["lunch"],
    cookTime: 10,
    prepTime: 15,
    servings: 2,
    macros: { calories: 460, protein: 18, carbs: 62, fat: 16 },
    tags: ["vegan", "dairy-free", "meal-prep", "quick"],
    source: "seed",
    ingredients: [
      { amount: "6 oz", item: "rice vermicelli noodles" },
      { amount: "1 cup", item: "shredded red cabbage", perishable: true, shelfDays: 7 },
      { amount: "1", item: "carrot, julienned", perishable: true, shelfDays: 10 },
      { amount: "1", item: "cucumber, julienned", perishable: true, shelfDays: 7 },
      { amount: "¼ cup", item: "fresh mint leaves", perishable: true, shelfDays: 4 },
      { amount: "3 tbsp", item: "peanut butter" },
      { amount: "2 tbsp", item: "soy sauce" },
      { amount: "1 tbsp", item: "rice vinegar" },
      { amount: "1 tbsp", item: "lime juice" },
      { amount: "1 tsp", item: "sriracha" },
      { amount: "2 tbsp", item: "roasted peanuts, crushed" },
    ],
    steps: [
      "Cook vermicelli per package directions. Rinse cold and drain.",
      "Whisk peanut butter, soy sauce, rice vinegar, lime juice, sriracha, and 2 tbsp water.",
      "Toss noodles with cabbage, carrot, cucumber, and dressing.",
      "Divide into bowls. Top with mint and crushed peanuts.",
    ],
  },
];

// ─── Dinner Recipes (10) ─────────────────────────────────────────

export const DINNER_RECIPES: Recipe[] = [
  {
    id: "miso-glazed-salmon",
    title: "Miso-Glazed Salmon",
    cuisine: "Japanese",
    mealType: ["dinner"],
    cookTime: 12,
    prepTime: 10,
    servings: 2,
    macros: { calories: 448, protein: 42, carbs: 18, fat: 22 },
    tags: ["seafood", "gluten-free", "high-protein", "quick"],
    source: "seed",
    ingredients: [
      { amount: "2", item: "salmon fillets (6 oz each)", perishable: true, shelfDays: 2 },
      { amount: "2 tbsp", item: "white miso paste" },
      { amount: "1 tbsp", item: "mirin" },
      { amount: "1 tbsp", item: "sake or dry white wine" },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "1 tsp", item: "honey" },
      { amount: "1 tbsp", item: "soy sauce (low sodium)" },
      { amount: "2 cups", item: "jasmine rice, cooked" },
      { amount: "1", item: "scallion, thinly sliced", perishable: true, shelfDays: 7 },
      { amount: "1 tsp", item: "sesame seeds" },
    ],
    steps: [
      "Whisk together miso, mirin, sake, sesame oil, honey, and soy sauce.",
      "Pat salmon dry. Spread glaze over fillets. Marinate 10 minutes.",
      "Preheat broiler to high. Line a baking sheet with foil.",
      "Broil salmon skin-side down 10–12 minutes until caramelized.",
      "Serve over jasmine rice, garnished with scallions and sesame seeds.",
    ],
  },
  {
    id: "lamb-kofta",
    title: "Lamb Kofta with Tahini & Flatbread",
    cuisine: "Lebanese",
    mealType: ["dinner"],
    cookTime: 18,
    prepTime: 15,
    servings: 2,
    macros: { calories: 485, protein: 36, carbs: 38, fat: 22 },
    tags: ["high-protein", "dairy-free", "quick", "weeknight"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "ground lamb (or beef)", perishable: true, shelfDays: 2 },
      { amount: "½", item: "onion, grated" },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "coriander" },
      { amount: "½ tsp", item: "cinnamon" },
      { amount: "½ tsp", item: "cayenne" },
      { amount: "¼ cup", item: "fresh parsley, chopped", perishable: true, shelfDays: 5 },
      { amount: "2", item: "flatbreads or pita" },
      { amount: "3 tbsp", item: "tahini" },
      { amount: "2 tbsp", item: "lemon juice" },
      { amount: "½ cup", item: "cherry tomatoes, halved", perishable: true, shelfDays: 5 },
    ],
    steps: [
      "Mix lamb, onion, garlic, cumin, coriander, cinnamon, cayenne, and parsley. Season well.",
      "Shape into 8 oval koftas. Thread onto skewers if desired.",
      "Grill or pan-fry over medium-high heat 3–4 min per side until cooked through and charred.",
      "Whisk tahini with lemon juice, 2 tbsp water, and salt until pourable.",
      "Serve kofta on warm flatbread with tomatoes and a generous drizzle of tahini.",
    ],
  },
  {
    id: "chicken-tikka-masala",
    title: "Chicken Tikka Masala",
    cuisine: "Indian",
    mealType: ["dinner"],
    cookTime: 35,
    prepTime: 15,
    servings: 2,
    macros: { calories: 490, protein: 44, carbs: 32, fat: 20 },
    tags: ["chicken", "curry", "gluten-free", "high-protein"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "boneless skinless chicken breast, cubed", perishable: true, shelfDays: 2 },
      { amount: "½ cup", item: "plain yogurt", perishable: true, shelfDays: 7 },
      { amount: "1 can (14 oz)", item: "crushed tomatoes" },
      { amount: "½ cup", item: "coconut cream", perishable: true, shelfDays: 5 },
      { amount: "1", item: "medium onion, diced", perishable: true, shelfDays: 14 },
      { amount: "4", item: "garlic cloves, minced" },
      { amount: "1 tbsp", item: "fresh ginger, grated" },
      { amount: "2 tsp", item: "garam masala" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "turmeric" },
      { amount: "1 tsp", item: "smoked paprika" },
      { amount: "1½ cups", item: "basmati rice, cooked" },
    ],
    steps: [
      "Marinate chicken in yogurt, half the garam masala, cumin, and a pinch of salt for 15 min.",
      "Sear chicken in batches over high heat until charred on edges. Set aside.",
      "Sauté onion in the same pan until golden, 6 min. Add garlic, ginger, and remaining spices; cook 2 min.",
      "Add crushed tomatoes; simmer 10 min. Stir in coconut cream.",
      "Return chicken to the sauce. Simmer 8 min until cooked through.",
      "Serve over basmati rice with naan if desired.",
    ],
  },
  {
    id: "shrimp-pad-thai",
    title: "Shrimp Pad Thai",
    cuisine: "Thai",
    mealType: ["dinner"],
    cookTime: 20,
    prepTime: 15,
    servings: 2,
    macros: { calories: 545, protein: 36, carbs: 66, fat: 14 },
    tags: ["seafood", "noodles", "dairy-free", "quick"],
    source: "seed",
    ingredients: [
      { amount: "8 oz", item: "flat rice noodles" },
      { amount: "12 oz", item: "large shrimp, peeled and deveined", perishable: true, shelfDays: 2 },
      { amount: "2", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "1 cup", item: "bean sprouts", perishable: true, shelfDays: 3 },
      { amount: "3", item: "scallions, sliced", perishable: true, shelfDays: 7 },
      { amount: "3 tbsp", item: "fish sauce" },
      { amount: "2 tbsp", item: "tamarind paste" },
      { amount: "1 tbsp", item: "oyster sauce" },
      { amount: "1 tbsp", item: "brown sugar" },
      { amount: "3 tbsp", item: "roasted peanuts, crushed" },
      { amount: "1", item: "lime, wedged" },
    ],
    steps: [
      "Soak rice noodles in warm water 20 min; drain.",
      "Whisk fish sauce, tamarind, oyster sauce, and sugar for the pad thai sauce.",
      "Stir-fry garlic and shallots 30 sec. Add shrimp; cook 2 min until pink.",
      "Push to the sides, scramble eggs in the centre until just set.",
      "Add noodles and sauce; toss everything together 2–3 min. Add sprouts and scallions.",
      "Serve topped with peanuts and lime wedges.",
    ],
  },
  {
    id: "beef-bulgogi",
    title: "Korean Beef Bulgogi",
    cuisine: "Korean",
    mealType: ["dinner"],
    cookTime: 15,
    prepTime: 15,
    servings: 2,
    macros: { calories: 480, protein: 38, carbs: 36, fat: 20 },
    tags: ["beef", "dairy-free", "high-protein", "quick"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "beef ribeye or sirloin, thinly sliced", perishable: true, shelfDays: 2 },
      { amount: "3 tbsp", item: "soy sauce" },
      { amount: "2 tbsp", item: "pear or apple juice" },
      { amount: "1 tbsp", item: "sesame oil" },
      { amount: "1 tbsp", item: "brown sugar" },
      { amount: "4", item: "garlic cloves, minced" },
      { amount: "1 tsp", item: "fresh ginger, grated" },
      { amount: "3", item: "scallions, sliced", perishable: true, shelfDays: 7 },
      { amount: "1 tbsp", item: "sesame seeds" },
      { amount: "1½ cups", item: "short-grain rice, cooked" },
    ],
    steps: [
      "Marinate beef in soy sauce, pear juice, sesame oil, sugar, garlic, and ginger for 15 min.",
      "Heat a cast-iron skillet or grill pan over high heat until very hot.",
      "Cook beef in a single layer 1–2 min per side (work in batches — don't crowd).",
      "Garnish with scallions and sesame seeds. Serve with steamed rice.",
    ],
  },
  {
    id: "peruvian-chicken",
    title: "Peruvian-Style Roast Chicken Thighs",
    cuisine: "Peruvian",
    mealType: ["dinner"],
    cookTime: 30,
    prepTime: 12,
    servings: 2,
    macros: { calories: 465, protein: 42, carbs: 20, fat: 24 },
    tags: ["chicken", "gluten-free", "high-protein", "spicy"],
    source: "seed",
    ingredients: [
      { amount: "4", item: "bone-in, skin-on chicken thighs", perishable: true, shelfDays: 2 },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "2 tbsp", item: "soy sauce" },
      { amount: "1 tbsp", item: "lime juice" },
      { amount: "1 tbsp", item: "olive oil" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "smoked paprika" },
      { amount: "½ tsp", item: "turmeric" },
      { amount: "½ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
      { amount: "1", item: "jalapeño, seeded", perishable: true, shelfDays: 7 },
      { amount: "3 tbsp", item: "mayonnaise" },
    ],
    steps: [
      "Whisk garlic, soy sauce, lime juice, olive oil, cumin, paprika, and turmeric. Coat chicken and marinate 15 min.",
      "Heat an oven-safe skillet over medium-high. Sear chicken skin-side down 4–5 min until golden.",
      "Flip and roast at 425°F for 20–22 min until juices run clear.",
      "Blend cilantro, jalapeño, mayo, lime juice, and salt into a green sauce.",
      "Serve chicken with the green sauce and rice or roasted potatoes.",
    ],
  },
  {
    id: "chickpea-tagine",
    title: "Moroccan Chickpea Tagine",
    cuisine: "Moroccan",
    mealType: ["dinner"],
    cookTime: 30,
    prepTime: 10,
    servings: 2,
    macros: { calories: 415, protein: 18, carbs: 60, fat: 12 },
    tags: ["vegan", "vegetarian", "dairy-free", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "1 can (14 oz)", item: "chickpeas, drained and rinsed" },
      { amount: "1 can (14 oz)", item: "crushed tomatoes" },
      { amount: "1", item: "zucchini, diced", perishable: true, shelfDays: 5 },
      { amount: "1", item: "medium onion, diced", perishable: true, shelfDays: 14 },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "1 tsp", item: "cinnamon" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "turmeric" },
      { amount: "½ tsp", item: "smoked paprika" },
      { amount: "¼ cup", item: "raisins or dried apricots, chopped" },
      { amount: "1 cup", item: "couscous, dry" },
      { amount: "¼ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
    ],
    steps: [
      "Sauté onion in olive oil over medium 5 min. Add garlic and all spices; cook 1 min.",
      "Add tomatoes, chickpeas, zucchini, and raisins. Stir well.",
      "Simmer 20 min until sauce thickens and vegetables are tender.",
      "Pour 1 cup boiling water over couscous. Cover 5 min, then fluff with a fork.",
      "Serve tagine over couscous, topped with fresh cilantro.",
    ],
  },
  {
    id: "spaghetti-carbonara",
    title: "Spaghetti Carbonara",
    cuisine: "Italian",
    mealType: ["dinner"],
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    macros: { calories: 555, protein: 28, carbs: 58, fat: 22 },
    tags: ["quick", "high-protein", "weeknight"],
    source: "seed",
    ingredients: [
      { amount: "8 oz", item: "spaghetti" },
      { amount: "4 oz", item: "pancetta or guanciale, diced", perishable: true, shelfDays: 5 },
      { amount: "3", item: "egg yolks", perishable: true, shelfDays: 21 },
      { amount: "1", item: "whole egg", perishable: true, shelfDays: 21 },
      { amount: "½ cup", item: "Pecorino Romano, finely grated", perishable: true, shelfDays: 30 },
      { amount: "¼ cup", item: "Parmesan, finely grated", perishable: true, shelfDays: 30 },
      { amount: "1 tsp", item: "coarsely cracked black pepper" },
    ],
    steps: [
      "Cook spaghetti in well-salted water until very al dente. Reserve 1 cup pasta water.",
      "Fry pancetta in a wide pan over medium until crispy. Remove from heat.",
      "Whisk egg yolks, whole egg, and both cheeses until combined.",
      "Add hot pasta to the pan with pancetta. Remove from heat completely.",
      "Add egg mixture and toss rapidly, adding pasta water a splash at a time until glossy and creamy — not scrambled.",
      "Finish with cracked black pepper. Serve immediately.",
    ],
  },
  {
    id: "white-bean-kale-soup",
    title: "Tuscan White Bean & Kale Soup",
    cuisine: "Italian",
    mealType: ["dinner"],
    cookTime: 25,
    prepTime: 10,
    servings: 2,
    macros: { calories: 395, protein: 17, carbs: 52, fat: 12 },
    tags: ["vegan", "vegetarian", "dairy-free", "high-fiber", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "1 can (14 oz)", item: "cannellini beans, drained and rinsed" },
      { amount: "3 cups", item: "lacinato kale, roughly chopped", perishable: true, shelfDays: 7 },
      { amount: "1", item: "medium onion, diced", perishable: true, shelfDays: 14 },
      { amount: "4", item: "garlic cloves, minced" },
      { amount: "1 can (14 oz)", item: "diced tomatoes" },
      { amount: "3 cups", item: "vegetable broth" },
      { amount: "1 sprig", item: "fresh rosemary", perishable: true, shelfDays: 10 },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "½ tsp", item: "red pepper flakes" },
      { amount: "2 slices", item: "crusty bread, toasted" },
    ],
    steps: [
      "Heat olive oil in a large pot over medium. Cook onion until soft, 5 min. Add garlic and red pepper flakes; cook 1 min.",
      "Add diced tomatoes, beans, broth, and rosemary sprig. Bring to a boil.",
      "Use a fork to lightly mash some of the beans directly in the pot to thicken the broth.",
      "Add kale. Simmer 10 min until tender. Remove rosemary.",
      "Season generously with salt and pepper. Serve with toasted bread.",
    ],
  },
  {
    id: "cajun-salmon",
    title: "Cajun Blackened Salmon with Roasted Sweet Potato",
    cuisine: "American",
    mealType: ["dinner"],
    cookTime: 30,
    prepTime: 10,
    servings: 2,
    macros: { calories: 455, protein: 44, carbs: 22, fat: 22 },
    tags: ["seafood", "high-protein", "gluten-free", "spicy"],
    source: "seed",
    ingredients: [
      { amount: "2", item: "salmon fillets (6 oz each)", perishable: true, shelfDays: 2 },
      { amount: "1 large", item: "sweet potato, diced", perishable: true, shelfDays: 14 },
      { amount: "1 tbsp", item: "smoked paprika" },
      { amount: "1 tsp", item: "cayenne pepper" },
      { amount: "1 tsp", item: "garlic powder" },
      { amount: "1 tsp", item: "onion powder" },
      { amount: "½ tsp", item: "dried thyme" },
      { amount: "½ tsp", item: "dried oregano" },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "1", item: "lemon, sliced" },
    ],
    steps: [
      "Preheat oven to 425°F. Toss sweet potato with olive oil, salt, and pepper. Roast 20–25 min until tender.",
      "Mix paprika, cayenne, garlic powder, onion powder, thyme, and oregano.",
      "Pat salmon dry. Press seasoning firmly onto flesh side of each fillet.",
      "Heat an oven-safe skillet over high until smoking. Add oil, then salmon seasoned-side down.",
      "Sear 2–3 min without moving. Flip and finish in oven 4–5 min.",
      "Serve with roasted sweet potato and lemon wedges.",
    ],
  },
];

// ─── Cheat Day Recipes (9 total — 3 per meal type) ───────────────

export const CHEAT_DAY_RECIPES: Recipe[] = [
  // ── Breakfast cheats (3) ──
  {
    id: "eggs-benedict",
    title: "Eggs Benedict with Hollandaise",
    cuisine: "French-American",
    mealType: ["breakfast"],
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    macros: { calories: 760, protein: 28, carbs: 44, fat: 52 },
    tags: ["cheat-day", "indulgent", "breakfast", "high-protein"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "4", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "4 slices", item: "Canadian bacon or ham", perishable: true, shelfDays: 5 },
      { amount: "2", item: "English muffins, split and toasted" },
      { amount: "3", item: "egg yolks", perishable: true, shelfDays: 21 },
      { amount: "½ cup", item: "unsalted butter, melted" },
      { amount: "1 tbsp", item: "lemon juice" },
      { amount: "1 tbsp", item: "white vinegar" },
      { amount: "1 pinch", item: "cayenne pepper" },
      { amount: "1 tbsp", item: "fresh chives, chopped", perishable: true, shelfDays: 7 },
    ],
    steps: [
      "Hollandaise: whisk egg yolks and lemon juice in a heatproof bowl over a pot of barely simmering water.",
      "Whisk vigorously 3–4 min until pale and thick. Slowly drizzle in melted butter, whisking constantly. Season with cayenne and salt. Keep warm.",
      "Warm Canadian bacon in a skillet 1 min per side.",
      "Poach eggs: simmer water with vinegar. Swirl gently; slide eggs in. Poach 3 min.",
      "Stack: muffin → Canadian bacon → poached egg → generous hollandaise. Garnish with chives.",
    ],
  },
  {
    id: "chocolate-chip-pancakes",
    title: "Chocolate Chip Pancake Stack with Maple Butter",
    cuisine: "American",
    mealType: ["breakfast"],
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    macros: { calories: 720, protein: 14, carbs: 96, fat: 30 },
    tags: ["cheat-day", "breakfast", "indulgent", "sweet"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "1½ cups", item: "all-purpose flour" },
      { amount: "2 tsp", item: "baking powder" },
      { amount: "2 tbsp", item: "sugar" },
      { amount: "1 cup", item: "whole milk", perishable: true, shelfDays: 7 },
      { amount: "2", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "3 tbsp", item: "melted butter" },
      { amount: "½ cup", item: "chocolate chips" },
      { amount: "3 tbsp", item: "unsalted butter, softened" },
      { amount: "3 tbsp", item: "maple syrup" },
      { amount: "1 pinch", item: "sea salt" },
    ],
    steps: [
      "Make maple butter: whip softened butter with maple syrup and sea salt. Set aside.",
      "Whisk flour, baking powder, sugar, and a pinch of salt.",
      "Combine milk, eggs, and melted butter. Pour wet into dry; stir until just combined (lumps are fine).",
      "Fold in chocolate chips.",
      "Ladle batter onto a buttered griddle over medium. Cook until bubbles form, 2–3 min, then flip.",
      "Stack high and top with maple butter and extra maple syrup.",
    ],
  },
  {
    id: "full-english-breakfast",
    title: "Full English Breakfast",
    cuisine: "British",
    mealType: ["breakfast"],
    cookTime: 20,
    prepTime: 5,
    servings: 2,
    macros: { calories: 780, protein: 38, carbs: 44, fat: 46 },
    tags: ["cheat-day", "breakfast", "indulgent", "high-protein"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "4", item: "pork sausages", perishable: true, shelfDays: 3 },
      { amount: "4 rashers", item: "back bacon", perishable: true, shelfDays: 5 },
      { amount: "4", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "2", item: "large ripe tomatoes, halved", perishable: true, shelfDays: 4 },
      { amount: "1 can (14 oz)", item: "baked beans" },
      { amount: "4", item: "button mushrooms, sliced", perishable: true, shelfDays: 5 },
      { amount: "4 slices", item: "thick white bread, toasted" },
      { amount: "2 tbsp", item: "unsalted butter" },
    ],
    steps: [
      "Grill or fry sausages over medium heat, turning until golden all over, 10–12 min.",
      "Fry bacon in the same pan until crispy. Set aside.",
      "Cook mushrooms and tomatoes (cut-side down) in the bacon fat.",
      "Heat baked beans in a small pot.",
      "Fry or scramble eggs in butter.",
      "Arrange everything on two warm plates with hot buttered toast.",
    ],
  },

  // ── Lunch cheats (3) ──
  {
    id: "smash-burger",
    title: "Double Smash Burger",
    cuisine: "American",
    mealType: ["lunch"],
    cookTime: 15,
    prepTime: 10,
    servings: 2,
    macros: { calories: 820, protein: 48, carbs: 52, fat: 46 },
    tags: ["cheat-day", "beef", "indulgent", "quick"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "12 oz", item: "80/20 ground beef", perishable: true, shelfDays: 2 },
      { amount: "2", item: "brioche buns" },
      { amount: "4 slices", item: "American cheese", perishable: true, shelfDays: 14 },
      { amount: "2 tbsp", item: "unsalted butter" },
      { amount: "¼ cup", item: "diced white onion" },
      { amount: "2 tbsp", item: "special sauce (mayo + ketchup + pickle juice)" },
      { amount: "¼ cup", item: "shredded iceberg lettuce", perishable: true, shelfDays: 5 },
    ],
    steps: [
      "Divide beef into 4 loose balls (3 oz each). Do not pack tightly.",
      "Heat cast iron skillet over high until smoking. Add butter.",
      "Add onion to skillet. Place beef ball on top and smash hard with spatula.",
      "Season with salt. Cook 90 sec until a crust forms. Flip and add cheese.",
      "Stack two patties per bun with special sauce and lettuce.",
    ],
  },
  {
    id: "korean-fried-chicken-bao",
    title: "Korean Fried Chicken Bao Buns",
    cuisine: "Korean",
    mealType: ["lunch"],
    cookTime: 25,
    prepTime: 15,
    servings: 2,
    macros: { calories: 790, protein: 36, carbs: 84, fat: 34 },
    tags: ["cheat-day", "indulgent", "chicken", "spicy"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "12 oz", item: "chicken thighs, boneless, cut into strips", perishable: true, shelfDays: 2 },
      { amount: "4", item: "steamed bao buns (store-bought)" },
      { amount: "¾ cup", item: "cornstarch" },
      { amount: "2", item: "eggs, beaten", perishable: true, shelfDays: 21 },
      { amount: "2 cups", item: "neutral oil, for frying" },
      { amount: "3 tbsp", item: "gochujang" },
      { amount: "2 tbsp", item: "honey" },
      { amount: "1 tbsp", item: "soy sauce" },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "2 tbsp", item: "mayonnaise" },
      { amount: "1 tsp", item: "sriracha" },
      { amount: "¼ cup", item: "pickled cucumber slices", perishable: true, shelfDays: 14 },
      { amount: "2", item: "scallions, sliced", perishable: true, shelfDays: 7 },
    ],
    steps: [
      "Coat chicken in egg then cornstarch. Fry in 350°F oil in batches 4–5 min until golden and cooked through. Drain.",
      "Mix gochujang, honey, soy sauce, and sesame oil in a bowl. Toss fried chicken in sauce.",
      "Stir together mayo and sriracha for spicy mayo.",
      "Steam bao buns following package instructions.",
      "Fill buns with saucy chicken, spicy mayo, pickled cucumber, and scallions.",
    ],
  },
  {
    id: "fish-and-chips",
    title: "Beer-Battered Fish & Chips",
    cuisine: "British",
    mealType: ["lunch"],
    cookTime: 30,
    prepTime: 15,
    servings: 2,
    macros: { calories: 830, protein: 40, carbs: 84, fat: 38 },
    tags: ["cheat-day", "indulgent", "seafood"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "2", item: "white fish fillets (cod or haddock, 6 oz each)", perishable: true, shelfDays: 2 },
      { amount: "3 large", item: "Russet potatoes, cut into thick wedges", perishable: true, shelfDays: 14 },
      { amount: "1 cup", item: "all-purpose flour (plus extra for dusting)" },
      { amount: "1 tsp", item: "baking powder" },
      { amount: "¾ cup", item: "cold beer or sparkling water" },
      { amount: "2 cups", item: "neutral oil, for frying" },
      { amount: "3 tbsp", item: "mayonnaise" },
      { amount: "1 tbsp", item: "capers, chopped" },
      { amount: "1 tbsp", item: "cornichons, chopped" },
      { amount: "1 tbsp", item: "lemon juice" },
      { amount: "malt vinegar and lemon", item: "to serve" },
    ],
    steps: [
      "Parboil potato wedges 5 min; drain and pat dry. Fry at 325°F for 5 min until pale. Drain.",
      "Make tartar sauce: mix mayo, capers, cornichons, and lemon juice. Refrigerate.",
      "Whisk flour, baking powder, salt, and cold beer until just combined (some lumps are fine).",
      "Increase oil to 375°F. Re-fry chips until golden and crisp, 3–4 min. Season with salt.",
      "Dust fish in flour, dip in batter, and fry 4–5 min per side until deeply golden.",
      "Serve with chips, tartar sauce, malt vinegar, and lemon wedges.",
    ],
  },

  // ── Dinner cheats (3) ──
  {
    id: "pepperoni-pizza",
    title: "New York Style Pepperoni Pizza",
    cuisine: "Italian-American",
    mealType: ["dinner"],
    cookTime: 12,
    prepTime: 20,
    servings: 2,
    macros: { calories: 760, protein: 32, carbs: 88, fat: 30 },
    tags: ["cheat-day", "pizza", "indulgent"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "1 lb", item: "store-bought pizza dough" },
      { amount: "½ cup", item: "crushed San Marzano tomatoes" },
      { amount: "2 cups", item: "low-moisture mozzarella, shredded", perishable: true, shelfDays: 7 },
      { amount: "2 oz", item: "cup pepperoni" },
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "1 tsp", item: "dried oregano" },
      { amount: "½ tsp", item: "red pepper flakes" },
    ],
    steps: [
      "Place a pizza stone or heavy sheet pan in the oven at 500°F for 30 min.",
      "Stretch dough thin on a lightly floured surface.",
      "Spread sauce lightly, add cheese and pepperoni.",
      "Slide onto the hot surface. Bake 10–12 min until charred and bubbling.",
      "Drizzle with olive oil and scatter oregano and red pepper flakes. Slice and serve.",
    ],
  },
  {
    id: "birria-tacos",
    title: "Birria Tacos with Consommé",
    cuisine: "Mexican",
    mealType: ["dinner"],
    cookTime: 50,
    prepTime: 20,
    servings: 2,
    macros: { calories: 810, protein: 48, carbs: 68, fat: 36 },
    tags: ["cheat-day", "beef", "indulgent", "spicy"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "1 lb", item: "beef chuck, cut into chunks", perishable: true, shelfDays: 2 },
      { amount: "3", item: "guajillo chilies, stemmed and seeded" },
      { amount: "2", item: "ancho chilies, stemmed and seeded" },
      { amount: "1 can (14 oz)", item: "fire-roasted diced tomatoes" },
      { amount: "4", item: "garlic cloves" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tsp", item: "dried oregano" },
      { amount: "1", item: "cinnamon stick" },
      { amount: "2 cups", item: "beef broth" },
      { amount: "8", item: "small corn tortillas" },
      { amount: "1 cup", item: "mozzarella or Oaxaca cheese, shredded", perishable: true, shelfDays: 7 },
      { amount: "½ cup", item: "white onion, finely diced" },
      { amount: "¼ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
      { amount: "1", item: "lime, wedged" },
    ],
    steps: [
      "Toast dried chilies in a dry pan 30 sec per side. Soak in hot water 10 min; drain.",
      "Blend chilies, tomatoes, garlic, cumin, oregano, and cinnamon with 1 cup broth until smooth.",
      "Season beef generously. Sear in a pot over high heat until browned all over.",
      "Pour chili sauce and remaining broth over beef. Simmer covered 40 min until very tender.",
      "Shred beef. Reserve the consommé (cooking liquid) in a bowl for dipping.",
      "Dip tortillas in consommé fat, fry in a hot skillet, add cheese and beef, fold. Fry until crispy.",
      "Serve with onion, cilantro, lime, and a cup of consommé for dipping.",
    ],
  },
  {
    id: "truffle-mac-cheese",
    title: "Truffle Mac & Cheese",
    cuisine: "American",
    mealType: ["dinner"],
    cookTime: 25,
    prepTime: 10,
    servings: 2,
    macros: { calories: 720, protein: 28, carbs: 72, fat: 36 },
    tags: ["cheat-day", "indulgent", "vegetarian"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "8 oz", item: "cavatappi or elbow macaroni" },
      { amount: "2 tbsp", item: "unsalted butter" },
      { amount: "2 tbsp", item: "all-purpose flour" },
      { amount: "1½ cups", item: "whole milk", perishable: true, shelfDays: 7 },
      { amount: "1 cup", item: "sharp white cheddar, shredded", perishable: true, shelfDays: 14 },
      { amount: "½ cup", item: "Gruyère, shredded", perishable: true, shelfDays: 14 },
      { amount: "¼ cup", item: "Parmesan, grated", perishable: true, shelfDays: 30 },
      { amount: "1 tsp", item: "truffle oil" },
      { amount: "½ cup", item: "panko breadcrumbs" },
      { amount: "1 tbsp", item: "fresh chives, chopped", perishable: true, shelfDays: 7 },
    ],
    steps: [
      "Cook pasta in salted water until just al dente. Drain, reserving ¼ cup pasta water.",
      "Melt butter in a saucepan over medium. Whisk in flour; cook 1 min.",
      "Gradually whisk in milk; cook until thickened, 4–5 min.",
      "Remove from heat. Stir in cheddar, Gruyère, and half the Parmesan until melted.",
      "Add truffle oil and pasta. Loosen with pasta water if needed.",
      "Top with panko, remaining Parmesan, and a knob of butter. Broil 2–3 min until golden. Garnish with chives.",
    ],
  },
];

// Extended seed packs — 100 extra meals + 40 snacks (type-only imports
// in those files, so no circular-import issue at runtime).
import { BREAKFAST_RECIPES_2 } from "./seed-breakfasts";
import { LUNCH_RECIPES_2 } from "./seed-lunches";
import { DINNER_RECIPES_2 } from "./seed-dinners";
import { CHEAT_RECIPES_2 } from "./seed-cheats";
import { SNACK_RECIPES } from "./seed-snacks";

export { SNACK_RECIPES };

export const ALL_BREAKFASTS: Recipe[] = [...BREAKFAST_RECIPES, ...BREAKFAST_RECIPES_2];
export const ALL_LUNCHES: Recipe[]    = [...LUNCH_RECIPES, ...LUNCH_RECIPES_2];
export const ALL_DINNERS: Recipe[]    = [...DINNER_RECIPES, ...DINNER_RECIPES_2];
export const ALL_CHEATS: Recipe[]     = [...CHEAT_DAY_RECIPES, ...CHEAT_RECIPES_2];

export const ALL_RECIPES: Recipe[] = [
  ...ALL_BREAKFASTS,
  ...ALL_LUNCHES,
  ...ALL_DINNERS,
  ...ALL_CHEATS,
  ...SNACK_RECIPES,
];

// Helper to get a recipe by id
export function getRecipeById(id: string): Recipe | undefined {
  return ALL_RECIPES.find((r) => r.id === id);
}

export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Deterministic Fisher-Yates shuffle — same seed always produces the same order,
// different seeds produce completely different orderings.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  // LCG: fast, reproducible, good distribution for small arrays
  let s = ((seed * 1664525 + 1013904223) >>> 0);
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 1664525 + 1013904223) >>> 0);
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Build a default week plan (Sun–Sat).
// Each weekStart ISO date produces a unique, deterministic shuffle of all recipes
// so every week looks completely different from the last.
export function buildDefaultWeekPlan(weekStart: string): WeekPlan {
  // Derive a stable integer seed from the week — noon UTC avoids DST edge cases
  const weekNum = Math.floor(
    new Date(weekStart + "T12:00:00Z").getTime() / (7 * 24 * 60 * 60 * 1000)
  );

  // Each slot type gets a different seed offset so their shuffles are independent
  const breakfasts = seededShuffle(ALL_BREAKFASTS, weekNum);
  const lunches    = seededShuffle(ALL_LUNCHES,    weekNum + 31);
  const dinners    = seededShuffle(ALL_DINNERS,    weekNum + 67);
  const amSnacks   = seededShuffle(SNACK_RECIPES,  weekNum + 101);
  const pmSnacks   = seededShuffle(SNACK_RECIPES,  weekNum + 149);

  return {
    weekStart,
    days: WEEK_DAYS.map((day, i) => ({
      day,
      isCheatDay: false,
      meals: {
        breakfast:      { recipe: breakfasts[i % breakfasts.length] },
        morningSnack:   { recipe: amSnacks[i   % amSnacks.length]   },
        lunch:          { recipe: lunches[i    % lunches.length]    },
        afternoonSnack: { recipe: pmSnacks[i   % pmSnacks.length]   },
        dinner:         { recipe: dinners[i    % dinners.length]    },
      },
    })),
  };
}

/**
 * Backfills snack slots on plans saved before snacks existed.
 * Older localStorage plans only have breakfast/lunch/dinner keys.
 */
export function normalizeWeekPlan(plan: WeekPlan): WeekPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      meals: {
        breakfast:      day.meals.breakfast      ?? { recipe: null },
        morningSnack:   day.meals.morningSnack   ?? { recipe: null },
        lunch:          day.meals.lunch          ?? { recipe: null },
        afternoonSnack: day.meals.afternoonSnack ?? { recipe: null },
        dinner:         day.meals.dinner         ?? { recipe: null },
      },
    })),
  };
}

// Perishable shelf life labels
export function shelfLifeLabel(days: number): { label: string; urgency: "low" | "medium" | "high" } {
  if (days <= 2) return { label: `${days}d`, urgency: "high" };
  if (days <= 5) return { label: `${days}d`, urgency: "medium" };
  return { label: `${days}d`, urgency: "low" };
}
