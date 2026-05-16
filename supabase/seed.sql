-- Pantri seed data — 5 tested recipes for two people
-- Run after schema.sql

insert into recipes (id, title, cuisine, cook_time, prep_time, servings, source, tags, ingredients, steps, macros) values

(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Miso-Glazed Salmon',
  'Japanese',
  12, 10, 2, 'seed',
  array['seafood','gluten-free','high-protein','quick'],
  '[
    {"amount":"2","item":"salmon fillets (6 oz each)"},
    {"amount":"2 tbsp","item":"white miso paste"},
    {"amount":"1 tbsp","item":"mirin"},
    {"amount":"1 tbsp","item":"sake or dry white wine"},
    {"amount":"1 tsp","item":"sesame oil"},
    {"amount":"1 tsp","item":"honey"},
    {"amount":"1 tbsp","item":"soy sauce (low sodium)"},
    {"amount":"2 cups","item":"jasmine rice, cooked"},
    {"amount":"1","item":"scallion, thinly sliced"},
    {"amount":"1 tsp","item":"sesame seeds"}
  ]'::jsonb,
  '[
    "Whisk together miso, mirin, sake, sesame oil, honey, and soy sauce.",
    "Pat salmon dry. Spread glaze over fillets. Marinate 10 minutes.",
    "Preheat broiler to high. Line a baking sheet with foil.",
    "Broil salmon skin-side down 10–12 minutes until caramelized.",
    "Serve over jasmine rice, garnished with scallions and sesame seeds."
  ]'::jsonb,
  '{"calories":448,"protein":42,"carbs":18,"fat":22}'::jsonb
),

(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Chicken Tinga Tacos',
  'Mexican',
  25, 10, 2, 'seed',
  array['chicken','spicy','dairy-free','weeknight'],
  '[
    {"amount":"12 oz","item":"boneless skinless chicken thighs"},
    {"amount":"1 can (14 oz)","item":"fire-roasted diced tomatoes"},
    {"amount":"2–3","item":"chipotle peppers in adobo sauce"},
    {"amount":"1","item":"medium white onion, sliced"},
    {"amount":"3","item":"garlic cloves, minced"},
    {"amount":"1 tsp","item":"dried oregano"},
    {"amount":"1 tsp","item":"cumin"},
    {"amount":"6","item":"small corn tortillas"},
    {"amount":"1","item":"avocado, sliced"},
    {"amount":"¼ cup","item":"fresh cilantro, chopped"},
    {"amount":"1","item":"lime, cut into wedges"}
  ]'::jsonb,
  '[
    "Season chicken with salt, pepper, cumin, and oregano.",
    "Sear chicken in a hot oiled skillet 4–5 min per side. Remove and shred.",
    "Sauté onion until softened. Add garlic and cook 1 minute.",
    "Blend tomatoes and chipotle smooth. Pour into the pan and simmer.",
    "Add shredded chicken back; simmer 8–10 min until thickened.",
    "Fill warm tortillas with chicken tinga, avocado, cilantro, and lime."
  ]'::jsonb,
  '{"calories":520,"protein":38,"carbs":48,"fat":16}'::jsonb
),

(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Greek Turkey Meatballs with Tzatziki',
  'Greek',
  20, 15, 2, 'seed',
  array['turkey','mediterranean','high-protein','meal-prep'],
  '[
    {"amount":"12 oz","item":"ground turkey (93% lean)"},
    {"amount":"¼ cup","item":"panko breadcrumbs"},
    {"amount":"1","item":"egg"},
    {"amount":"2 tbsp","item":"fresh dill, chopped"},
    {"amount":"2 tbsp","item":"fresh mint, chopped"},
    {"amount":"2","item":"garlic cloves, minced"},
    {"amount":"½ tsp","item":"dried oregano"},
    {"amount":"½ cup","item":"Greek yogurt (full fat)"},
    {"amount":"½","item":"cucumber, grated and drained"},
    {"amount":"1 tbsp","item":"lemon juice"},
    {"amount":"1 cup","item":"cherry tomatoes, halved"},
    {"amount":"2","item":"pita breads, warmed"}
  ]'::jsonb,
  '[
    "Make tzatziki: combine yogurt, grated cucumber, lemon juice, garlic, dill, salt. Refrigerate.",
    "Mix turkey, panko, egg, herbs, garlic, oregano, salt, pepper. Form 12 meatballs.",
    "Sear meatballs in an oven-safe skillet over medium-high, about 4 minutes.",
    "Transfer to 400°F oven and bake 10–12 minutes to 165°F internal.",
    "Serve over warm pita with tzatziki, tomatoes, and cucumber."
  ]'::jsonb,
  '{"calories":482,"protein":44,"carbs":28,"fat":19}'::jsonb
),

(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'Shrimp Pad Thai',
  'Thai',
  20, 15, 2, 'seed',
  array['seafood','noodles','dairy-free','quick'],
  '[
    {"amount":"8 oz","item":"flat rice noodles"},
    {"amount":"12 oz","item":"large shrimp, peeled and deveined"},
    {"amount":"2","item":"eggs"},
    {"amount":"3 tbsp","item":"fish sauce"},
    {"amount":"2 tbsp","item":"tamarind paste"},
    {"amount":"1 tbsp","item":"oyster sauce"},
    {"amount":"2 tsp","item":"brown sugar"},
    {"amount":"3","item":"garlic cloves, minced"},
    {"amount":"2","item":"shallots, thinly sliced"},
    {"amount":"1 cup","item":"bean sprouts"},
    {"amount":"3","item":"scallions, cut into 1-inch pieces"},
    {"amount":"3 tbsp","item":"roasted peanuts, crushed"},
    {"amount":"1","item":"lime, wedged"}
  ]'::jsonb,
  '[
    "Soak rice noodles in warm water 20 minutes until pliable; drain.",
    "Mix fish sauce, tamarind, oyster sauce, and sugar — the pad thai sauce.",
    "Stir-fry garlic and shallots in a hot wok 30 seconds.",
    "Add shrimp; cook 2 min. Push aside, scramble eggs in center.",
    "Add noodles and sauce; toss 2–3 min until absorbed.",
    "Add sprouts and scallions, toss 30 sec. Serve with peanuts and lime."
  ]'::jsonb,
  '{"calories":548,"protein":36,"carbs":68,"fat":14}'::jsonb
),

(
  'a1b2c3d4-0005-0005-0005-000000000005',
  'Chicken Tikka Masala with Cauliflower Rice',
  'Indian',
  35, 15, 2, 'seed',
  array['chicken','curry','low-carb','gluten-free'],
  '[
    {"amount":"14 oz","item":"boneless skinless chicken breast, cubed"},
    {"amount":"½ cup","item":"plain Greek yogurt"},
    {"amount":"2 tsp","item":"garam masala"},
    {"amount":"1 tsp","item":"turmeric"},
    {"amount":"1 tsp","item":"cumin"},
    {"amount":"1","item":"medium onion, diced"},
    {"amount":"4","item":"garlic cloves, minced"},
    {"amount":"1 tbsp","item":"fresh ginger, grated"},
    {"amount":"1 tbsp","item":"tomato paste"},
    {"amount":"1 can (14 oz)","item":"crushed tomatoes"},
    {"amount":"½ cup","item":"heavy cream or coconut cream"},
    {"amount":"1 tsp","item":"kashmiri chili powder"},
    {"amount":"1 head","item":"cauliflower, riced"},
    {"amount":"2 tbsp","item":"fresh cilantro, chopped"}
  ]'::jsonb,
  '[
    "Marinate chicken in yogurt, 1 tsp garam masala, ½ tsp turmeric, salt — 15 minutes.",
    "Sear chicken in batches over high heat until charred, about 5 min. Set aside.",
    "Sauté onion 5 min until golden. Add garlic, ginger; cook 2 min.",
    "Add tomato paste and spices; toast 1 min. Add crushed tomatoes.",
    "Simmer sauce 10 min. Stir in cream and chicken; simmer 5 min more.",
    "Pulse cauliflower until rice-sized; sauté in dry pan 5–6 min.",
    "Serve tikka masala over cauliflower rice with fresh cilantro."
  ]'::jsonb,
  '{"calories":492,"protein":46,"carbs":22,"fat":24}'::jsonb
);
