export type MealType = "breakfast" | "lunch" | "dinner";

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
  mealType: MealType[];
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
};

export type DayPlan = {
  day: string;
  isCheatDay: boolean;
  meals: {
    breakfast: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
  };
};

export type WeekPlan = {
  weekStart: string; // ISO date of Sunday
  days: DayPlan[];
};

// ─── Seed recipes ───────────────────────────────────────────────

export const BREAKFAST_RECIPES: Recipe[] = [
  {
    id: "greek-yogurt-parfait",
    title: "Greek Yogurt Parfait",
    cuisine: "American",
    mealType: ["breakfast"],
    cookTime: 0,
    prepTime: 5,
    servings: 2,
    macros: { calories: 320, protein: 24, carbs: 38, fat: 7 },
    tags: ["quick", "high-protein", "vegetarian", "no-cook"],
    source: "seed",
    ingredients: [
      { amount: "2 cups", item: "full-fat Greek yogurt", perishable: true, shelfDays: 7 },
      { amount: "1 cup", item: "mixed berries (fresh or frozen)", perishable: true, shelfDays: 4 },
      { amount: "¼ cup", item: "granola" },
      { amount: "2 tbsp", item: "honey" },
      { amount: "2 tbsp", item: "chia seeds" },
    ],
    steps: [
      "Layer Greek yogurt in two glasses or bowls.",
      "Top with mixed berries, granola, and chia seeds.",
      "Drizzle with honey and serve immediately.",
    ],
  },
  {
    id: "avocado-egg-toast",
    title: "Avocado & Poached Egg Toast",
    cuisine: "American",
    mealType: ["breakfast"],
    cookTime: 8,
    prepTime: 5,
    servings: 2,
    macros: { calories: 390, protein: 18, carbs: 32, fat: 22 },
    tags: ["vegetarian", "high-protein", "quick"],
    source: "seed",
    ingredients: [
      { amount: "2 slices", item: "sourdough or whole-grain bread" },
      { amount: "1 large", item: "ripe avocado", perishable: true, shelfDays: 2 },
      { amount: "2", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "1 tbsp", item: "white vinegar" },
      { amount: "½ tsp", item: "red pepper flakes" },
      { amount: "1 tsp", item: "lemon juice" },
    ],
    steps: [
      "Toast bread until golden and crisp.",
      "Mash avocado with lemon juice, salt, and pepper. Spread on toast.",
      "Bring a pot of water to a gentle simmer. Add vinegar.",
      "Crack each egg into a small cup, then slide into the water. Poach 3–4 min.",
      "Place a poached egg on each toast. Sprinkle with red pepper flakes and flaky salt.",
    ],
  },
  {
    id: "overnight-oats",
    title: "Overnight Oats with Banana & Peanut Butter",
    cuisine: "American",
    mealType: ["breakfast"],
    cookTime: 0,
    prepTime: 5,
    servings: 2,
    macros: { calories: 445, protein: 16, carbs: 62, fat: 14 },
    tags: ["meal-prep", "vegetarian", "dairy-free", "no-cook"],
    source: "seed",
    ingredients: [
      { amount: "1 cup", item: "rolled oats" },
      { amount: "1½ cups", item: "oat milk or almond milk" },
      { amount: "2 tbsp", item: "natural peanut butter" },
      { amount: "2 tbsp", item: "chia seeds" },
      { amount: "1", item: "banana, sliced", perishable: true, shelfDays: 3 },
      { amount: "1 tbsp", item: "maple syrup" },
      { amount: "½ tsp", item: "vanilla extract" },
    ],
    steps: [
      "Mix oats, milk, chia seeds, peanut butter, maple syrup, and vanilla in a jar or container.",
      "Stir well until peanut butter is incorporated. Refrigerate overnight (at least 6 hours).",
      "In the morning, stir again and top with sliced banana. Add more milk if too thick.",
    ],
  },
];

export const LUNCH_RECIPES: Recipe[] = [
  {
    id: "mediterranean-grain-bowl",
    title: "Mediterranean Grain Bowl",
    cuisine: "Mediterranean",
    mealType: ["lunch"],
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    macros: { calories: 480, protein: 22, carbs: 58, fat: 18 },
    tags: ["vegetarian", "meal-prep", "high-protein", "mediterranean"],
    source: "seed",
    ingredients: [
      { amount: "1 cup", item: "farro or quinoa, dry" },
      { amount: "1 can (14 oz)", item: "chickpeas, rinsed" },
      { amount: "1 cup", item: "cherry tomatoes, halved", perishable: true, shelfDays: 5 },
      { amount: "½", item: "cucumber, diced", perishable: true, shelfDays: 7 },
      { amount: "¼ cup", item: "kalamata olives" },
      { amount: "2 oz", item: "feta cheese, crumbled", perishable: true, shelfDays: 7 },
      { amount: "3 tbsp", item: "olive oil" },
      { amount: "2 tbsp", item: "lemon juice" },
      { amount: "1 tsp", item: "dried oregano" },
    ],
    steps: [
      "Cook farro according to package directions. Cool slightly.",
      "Whisk olive oil, lemon juice, oregano, salt, and pepper to make dressing.",
      "Toss chickpeas in a dry skillet over medium-high until slightly crisp, 5 min.",
      "Assemble bowls: grain, tomatoes, cucumber, olives, crispy chickpeas. Drizzle dressing.",
      "Top with feta and serve at room temperature or chilled.",
    ],
  },
  {
    id: "turkey-avocado-wrap",
    title: "Turkey & Avocado Wrap",
    cuisine: "American",
    mealType: ["lunch"],
    cookTime: 0,
    prepTime: 8,
    servings: 2,
    macros: { calories: 420, protein: 32, carbs: 38, fat: 16 },
    tags: ["quick", "high-protein", "dairy-free", "no-cook"],
    source: "seed",
    ingredients: [
      { amount: "2", item: "large whole-wheat tortillas" },
      { amount: "8 oz", item: "sliced turkey breast, deli", perishable: true, shelfDays: 4 },
      { amount: "1", item: "avocado, sliced", perishable: true, shelfDays: 2 },
      { amount: "1 cup", item: "romaine lettuce, shredded", perishable: true, shelfDays: 5 },
      { amount: "2", item: "Roma tomatoes, sliced", perishable: true, shelfDays: 4 },
      { amount: "2 tbsp", item: "Dijon mustard" },
      { amount: "1 tbsp", item: "lemon juice" },
    ],
    steps: [
      "Lay tortillas flat. Spread Dijon mustard over each.",
      "Layer turkey, avocado, lettuce, and tomato. Season with salt and pepper.",
      "Drizzle with lemon juice. Roll tightly, tucking in the sides.",
      "Slice in half and serve immediately or wrap for later.",
    ],
  },
  {
    id: "spicy-thai-noodle-salad",
    title: "Spicy Thai Noodle Salad",
    cuisine: "Thai",
    mealType: ["lunch"],
    cookTime: 10,
    prepTime: 15,
    servings: 2,
    macros: { calories: 460, protein: 18, carbs: 64, fat: 14 },
    tags: ["dairy-free", "vegan", "meal-prep", "quick"],
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
      "Cook vermicelli noodles per package directions. Rinse with cold water and drain.",
      "Whisk peanut butter, soy sauce, rice vinegar, lime juice, sriracha, and 2 tbsp water.",
      "Toss noodles with cabbage, carrot, cucumber, and dressing.",
      "Divide into bowls, top with mint and crushed peanuts.",
    ],
  },
];

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
    id: "chicken-tinga-tacos",
    title: "Chicken Tinga Tacos",
    cuisine: "Mexican",
    mealType: ["dinner"],
    cookTime: 25,
    prepTime: 10,
    servings: 2,
    macros: { calories: 520, protein: 38, carbs: 48, fat: 16 },
    tags: ["chicken", "spicy", "dairy-free", "weeknight"],
    source: "seed",
    ingredients: [
      { amount: "12 oz", item: "boneless skinless chicken thighs", perishable: true, shelfDays: 2 },
      { amount: "1 can (14 oz)", item: "fire-roasted diced tomatoes" },
      { amount: "2–3", item: "chipotle peppers in adobo sauce" },
      { amount: "1", item: "medium white onion, sliced", perishable: true, shelfDays: 14 },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "6", item: "small corn tortillas" },
      { amount: "1", item: "avocado, sliced", perishable: true, shelfDays: 2 },
      { amount: "¼ cup", item: "fresh cilantro", perishable: true, shelfDays: 4 },
    ],
    steps: [
      "Season chicken with salt, pepper, cumin, and oregano.",
      "Sear chicken 4–5 min per side. Remove and shred.",
      "Sauté onion until softened. Add garlic 1 min more.",
      "Blend tomatoes and chipotle smooth. Pour in and simmer.",
      "Add shredded chicken; simmer 8–10 min until thickened.",
      "Fill warm tortillas with tinga, avocado, cilantro, and lime.",
    ],
  },
  {
    id: "greek-turkey-meatballs",
    title: "Greek Turkey Meatballs with Tzatziki",
    cuisine: "Greek",
    mealType: ["dinner"],
    cookTime: 20,
    prepTime: 15,
    servings: 2,
    macros: { calories: 482, protein: 44, carbs: 28, fat: 19 },
    tags: ["turkey", "mediterranean", "high-protein", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "12 oz", item: "ground turkey (93% lean)", perishable: true, shelfDays: 2 },
      { amount: "1", item: "egg", perishable: true, shelfDays: 21 },
      { amount: "½ cup", item: "Greek yogurt", perishable: true, shelfDays: 7 },
      { amount: "½", item: "cucumber, grated", perishable: true, shelfDays: 7 },
      { amount: "1 cup", item: "cherry tomatoes", perishable: true, shelfDays: 5 },
      { amount: "2", item: "pita breads, warmed" },
    ],
    steps: [
      "Make tzatziki: combine yogurt, grated cucumber, lemon juice, garlic, dill. Refrigerate.",
      "Mix turkey, panko, egg, herbs, garlic, oregano. Form 12 meatballs.",
      "Sear in an oven-safe skillet, then bake at 400°F for 10–12 min.",
      "Serve over warm pita with tzatziki and tomatoes.",
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
    macros: { calories: 548, protein: 36, carbs: 68, fat: 14 },
    tags: ["seafood", "noodles", "dairy-free", "quick"],
    source: "seed",
    ingredients: [
      { amount: "8 oz", item: "flat rice noodles" },
      { amount: "12 oz", item: "large shrimp, peeled", perishable: true, shelfDays: 2 },
      { amount: "2", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "1 cup", item: "bean sprouts", perishable: true, shelfDays: 3 },
      { amount: "3", item: "scallions", perishable: true, shelfDays: 7 },
      { amount: "3 tbsp", item: "roasted peanuts, crushed" },
    ],
    steps: [
      "Soak rice noodles in warm water 20 min; drain.",
      "Mix fish sauce, tamarind, oyster sauce, and sugar — pad thai sauce.",
      "Stir-fry garlic and shallots 30 sec. Add shrimp; cook 2 min.",
      "Push aside, scramble eggs in center.",
      "Add noodles and sauce; toss 2–3 min. Add sprouts and scallions.",
      "Serve with peanuts and lime wedges.",
    ],
  },
  {
    id: "chicken-tikka-masala",
    title: "Chicken Tikka Masala with Cauliflower Rice",
    cuisine: "Indian",
    mealType: ["dinner"],
    cookTime: 35,
    prepTime: 15,
    servings: 2,
    macros: { calories: 492, protein: 46, carbs: 22, fat: 24 },
    tags: ["chicken", "curry", "low-carb", "gluten-free"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "boneless skinless chicken breast", perishable: true, shelfDays: 2 },
      { amount: "½ cup", item: "Greek yogurt", perishable: true, shelfDays: 7 },
      { amount: "1 can (14 oz)", item: "crushed tomatoes" },
      { amount: "½ cup", item: "heavy cream or coconut cream", perishable: true, shelfDays: 5 },
      { amount: "1 head", item: "cauliflower, riced", perishable: true, shelfDays: 5 },
    ],
    steps: [
      "Marinate chicken in yogurt and spices 15 min.",
      "Sear chicken until charred. Set aside.",
      "Sauté onion, garlic, ginger. Add tomato paste and spices.",
      "Add crushed tomatoes; simmer 10 min. Stir in cream and chicken.",
      "Sauté riced cauliflower 5–6 min. Serve tikka masala on top.",
    ],
  },
];

// Cheat day recipes
export const CHEAT_DAY_RECIPES: Recipe[] = [
  {
    id: "smash-burger",
    title: "Double Smash Burger",
    cuisine: "American",
    mealType: ["lunch", "dinner"],
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
    ],
    steps: [
      "Divide beef into 4 loose balls (3 oz each). Don't pack tightly.",
      "Heat cast iron skillet over high until smoking. Add butter.",
      "Add onion to skillet. Place beef ball on top, smash hard with spatula.",
      "Season with salt. Cook 90 seconds until crust forms. Flip, add cheese.",
      "Stack two patties per bun. Add sauce and toppings.",
    ],
  },
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
    ],
    steps: [
      "Place pizza stone or sheet pan in oven at 500°F for 30 min.",
      "Stretch dough thin on a floured surface.",
      "Spread sauce lightly, add cheese and pepperoni.",
      "Slide onto the hot surface. Bake 10–12 min until charred and bubbling.",
    ],
  },
  {
    id: "french-toast-stack",
    title: "Brioche French Toast Stack",
    cuisine: "French",
    mealType: ["breakfast"],
    cookTime: 10,
    prepTime: 5,
    servings: 2,
    macros: { calories: 680, protein: 18, carbs: 78, fat: 34 },
    tags: ["cheat-day", "breakfast", "indulgent", "sweet"],
    source: "seed",
    isCheatDay: true,
    ingredients: [
      { amount: "4 slices", item: "thick-cut brioche bread" },
      { amount: "3", item: "eggs", perishable: true, shelfDays: 21 },
      { amount: "½ cup", item: "heavy cream", perishable: true, shelfDays: 5 },
      { amount: "1 tsp", item: "vanilla extract" },
      { amount: "1 tsp", item: "cinnamon" },
      { amount: "2 tbsp", item: "unsalted butter" },
      { amount: "2 tbsp", item: "maple syrup" },
      { amount: "½ cup", item: "fresh strawberries", perishable: true, shelfDays: 3 },
    ],
    steps: [
      "Whisk eggs, cream, vanilla, cinnamon, and a pinch of salt.",
      "Soak brioche in egg mixture 30 sec per side.",
      "Melt butter in a skillet over medium. Cook slices 2–3 min per side until golden.",
      "Stack and top with maple syrup and fresh strawberries.",
    ],
  },
];

export const ALL_RECIPES: Recipe[] = [
  ...BREAKFAST_RECIPES,
  ...LUNCH_RECIPES,
  ...DINNER_RECIPES,
  ...CHEAT_DAY_RECIPES,
];

// Helper to get a recipe by id
export function getRecipeById(id: string): Recipe | undefined {
  return ALL_RECIPES.find((r) => r.id === id);
}

// Build a default week plan (Sun–Sat)
export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function buildDefaultWeekPlan(weekStart: string): WeekPlan {
  return {
    weekStart,
    days: WEEK_DAYS.map((day, i) => ({
      day,
      isCheatDay: false,
      meals: {
        breakfast: { recipe: BREAKFAST_RECIPES[i % BREAKFAST_RECIPES.length] },
        lunch: { recipe: LUNCH_RECIPES[i % LUNCH_RECIPES.length] },
        dinner: { recipe: i < 5 ? DINNER_RECIPES[i] : null },
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
