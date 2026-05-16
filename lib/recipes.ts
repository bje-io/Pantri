export type Macro = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Ingredient = {
  amount: string;
  item: string;
};

export type Recipe = {
  id: string;
  title: string;
  cuisine: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  macros: Macro;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  source: "seed" | "ai" | "user";
};

export type MealPlanDay = {
  day: string;
  date?: string;
  recipe: Recipe;
};

export const SEED_RECIPES: Recipe[] = [
  {
    id: "miso-glazed-salmon",
    title: "Miso-Glazed Salmon",
    cuisine: "Japanese",
    cookTime: 12,
    prepTime: 10,
    servings: 2,
    macros: { calories: 448, protein: 42, carbs: 18, fat: 22 },
    tags: ["seafood", "gluten-free", "high-protein", "quick"],
    source: "seed",
    ingredients: [
      { amount: "2", item: "salmon fillets (6 oz each)" },
      { amount: "2 tbsp", item: "white miso paste" },
      { amount: "1 tbsp", item: "mirin" },
      { amount: "1 tbsp", item: "sake or dry white wine" },
      { amount: "1 tsp", item: "sesame oil" },
      { amount: "1 tsp", item: "honey" },
      { amount: "1 tbsp", item: "soy sauce (low sodium)" },
      { amount: "2 cups", item: "jasmine rice, cooked" },
      { amount: "1", item: "scallion, thinly sliced" },
      { amount: "1 tsp", item: "sesame seeds" },
    ],
    steps: [
      "Whisk together miso, mirin, sake, sesame oil, honey, and soy sauce in a small bowl to form the glaze.",
      "Pat salmon fillets dry with paper towels. Spread glaze evenly over the top of each fillet. Marinate for 10 minutes.",
      "Preheat oven broiler to high. Line a baking sheet with foil and lightly oil.",
      "Place salmon skin-side down on the prepared baking sheet. Broil 6–8 inches from heat for 10–12 minutes until caramelized and cooked through.",
      "Serve over jasmine rice, garnished with scallions and sesame seeds.",
    ],
  },
  {
    id: "chicken-tinga-tacos",
    title: "Chicken Tinga Tacos",
    cuisine: "Mexican",
    cookTime: 25,
    prepTime: 10,
    servings: 2,
    macros: { calories: 520, protein: 38, carbs: 48, fat: 16 },
    tags: ["chicken", "spicy", "dairy-free", "weeknight"],
    source: "seed",
    ingredients: [
      { amount: "12 oz", item: "boneless skinless chicken thighs" },
      { amount: "1 can (14 oz)", item: "fire-roasted diced tomatoes" },
      { amount: "2–3", item: "chipotle peppers in adobo sauce" },
      { amount: "1", item: "medium white onion, sliced" },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "1 tsp", item: "dried oregano" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "6", item: "small corn tortillas" },
      { amount: "1", item: "avocado, sliced" },
      { amount: "¼ cup", item: "fresh cilantro, chopped" },
      { amount: "1", item: "lime, cut into wedges" },
    ],
    steps: [
      "Season chicken thighs with salt, pepper, cumin, and oregano.",
      "Heat oil in a skillet over medium-high. Sear chicken 4–5 minutes per side until golden. Remove and shred.",
      "In the same pan, sauté onion until softened, about 3 minutes. Add garlic and cook 1 minute.",
      "Blend tomatoes and chipotle peppers until smooth. Pour into the pan, bring to a simmer.",
      "Add shredded chicken back to the sauce. Simmer 8–10 minutes until thickened.",
      "Warm tortillas on a dry skillet. Fill with chicken tinga, avocado, cilantro, and a squeeze of lime.",
    ],
  },
  {
    id: "greek-turkey-meatballs",
    title: "Greek Turkey Meatballs with Tzatziki",
    cuisine: "Greek",
    cookTime: 20,
    prepTime: 15,
    servings: 2,
    macros: { calories: 482, protein: 44, carbs: 28, fat: 19 },
    tags: ["turkey", "mediterranean", "high-protein", "meal-prep"],
    source: "seed",
    ingredients: [
      { amount: "12 oz", item: "ground turkey (93% lean)" },
      { amount: "¼ cup", item: "panko breadcrumbs" },
      { amount: "1", item: "egg" },
      { amount: "2 tbsp", item: "fresh dill, chopped" },
      { amount: "2 tbsp", item: "fresh mint, chopped" },
      { amount: "2", item: "garlic cloves, minced" },
      { amount: "½ tsp", item: "dried oregano" },
      { amount: "½ cup", item: "Greek yogurt (full fat)" },
      { amount: "½", item: "cucumber, grated and drained" },
      { amount: "1 tbsp", item: "lemon juice" },
      { amount: "1 tsp", item: "olive oil" },
      { amount: "1 cup", item: "cherry tomatoes, halved" },
      { amount: "½ cup", item: "cucumber, diced" },
      { amount: "2", item: "pita breads, warmed" },
    ],
    steps: [
      "Make tzatziki: combine Greek yogurt, grated cucumber (squeezed dry), lemon juice, 1 clove minced garlic, 1 tbsp dill, olive oil, salt. Refrigerate.",
      "Mix ground turkey, panko, egg, remaining dill, mint, garlic, oregano, salt, and pepper until combined. Form into 12 meatballs.",
      "Heat oil in an oven-safe skillet over medium-high. Brown meatballs on all sides, about 4 minutes.",
      "Transfer to 400°F oven and bake 10–12 minutes until cooked through (165°F internal).",
      "Serve meatballs over warm pita with tzatziki, cherry tomatoes, and diced cucumber.",
    ],
  },
  {
    id: "shrimp-pad-thai",
    title: "Shrimp Pad Thai",
    cuisine: "Thai",
    cookTime: 20,
    prepTime: 15,
    servings: 2,
    macros: { calories: 548, protein: 36, carbs: 68, fat: 14 },
    tags: ["seafood", "noodles", "dairy-free", "quick"],
    source: "seed",
    ingredients: [
      { amount: "8 oz", item: "rice noodles (flat, medium width)" },
      { amount: "12 oz", item: "large shrimp, peeled and deveined" },
      { amount: "2", item: "eggs" },
      { amount: "3 tbsp", item: "fish sauce" },
      { amount: "2 tbsp", item: "tamarind paste" },
      { amount: "1 tbsp", item: "oyster sauce" },
      { amount: "2 tsp", item: "palm or brown sugar" },
      { amount: "3", item: "garlic cloves, minced" },
      { amount: "2", item: "shallots, thinly sliced" },
      { amount: "1 cup", item: "bean sprouts" },
      { amount: "3", item: "scallions, cut into 1-inch pieces" },
      { amount: "3 tbsp", item: "roasted peanuts, crushed" },
      { amount: "1", item: "lime, wedged" },
      { amount: "1 tbsp", item: "neutral oil" },
    ],
    steps: [
      "Soak rice noodles in warm water for 20 minutes until pliable, drain well.",
      "Mix fish sauce, tamarind paste, oyster sauce, and sugar in a bowl — this is the pad thai sauce.",
      "Heat wok or large skillet over high heat until smoking. Add oil, then garlic and shallots; stir-fry 30 seconds.",
      "Add shrimp and cook 2 minutes until pink. Push to the side, crack eggs into the center; scramble until just set.",
      "Add drained noodles and sauce. Toss everything together for 2–3 minutes until noodles absorb the sauce.",
      "Add bean sprouts and scallions, toss for 30 seconds. Serve with peanuts and lime wedges.",
    ],
  },
  {
    id: "chicken-tikka-masala",
    title: "Chicken Tikka Masala with Cauliflower Rice",
    cuisine: "Indian",
    cookTime: 35,
    prepTime: 15,
    servings: 2,
    macros: { calories: 492, protein: 46, carbs: 22, fat: 24 },
    tags: ["chicken", "curry", "low-carb", "gluten-free"],
    source: "seed",
    ingredients: [
      { amount: "14 oz", item: "boneless skinless chicken breast, cubed" },
      { amount: "½ cup", item: "plain Greek yogurt" },
      { amount: "2 tsp", item: "garam masala" },
      { amount: "1 tsp", item: "turmeric" },
      { amount: "1 tsp", item: "cumin" },
      { amount: "1 tbsp", item: "neutral oil" },
      { amount: "1", item: "medium onion, diced" },
      { amount: "4", item: "garlic cloves, minced" },
      { amount: "1 tbsp", item: "fresh ginger, grated" },
      { amount: "1 tbsp", item: "tomato paste" },
      { amount: "1 can (14 oz)", item: "crushed tomatoes" },
      { amount: "½ cup", item: "heavy cream or coconut cream" },
      { amount: "1 tsp", item: "kashmiri chili powder" },
      { amount: "1 head", item: "cauliflower, riced" },
      { amount: "2 tbsp", item: "fresh cilantro, chopped" },
    ],
    steps: [
      "Marinate chicken in yogurt, 1 tsp garam masala, ½ tsp turmeric, and salt for at least 15 minutes.",
      "Heat oil in a heavy pan over high. Cook chicken in batches until charred on the outside, about 5 minutes. Set aside.",
      "Reduce heat to medium. Sauté onion 5 minutes until golden. Add garlic and ginger, cook 2 minutes.",
      "Add tomato paste, remaining spices, and chili powder; toast 1 minute. Pour in crushed tomatoes.",
      "Simmer sauce 10 minutes until thickened. Stir in cream and chicken; simmer 5 more minutes.",
      "Pulse cauliflower in a food processor until rice-sized. Sauté in a dry pan 5–6 minutes until tender.",
      "Serve tikka masala over cauliflower rice, garnished with fresh cilantro.",
    ],
  },
];

export const WEEKLY_MEAL_PLAN: MealPlanDay[] = [
  { day: "Monday", recipe: SEED_RECIPES[0] },
  { day: "Tuesday", recipe: SEED_RECIPES[1] },
  { day: "Wednesday", recipe: SEED_RECIPES[2] },
  { day: "Thursday", recipe: SEED_RECIPES[3] },
  { day: "Friday", recipe: SEED_RECIPES[4] },
];
