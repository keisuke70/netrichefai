// Base type for recipes, containing common properties
export type Recipe = {
    id?: number; // Unique identifier for the recipe
    user_id?: number;
    title: string; // Recipe title
    description: string; // Brief description of the recipe
    cooking_time: number;
  };
  
  // // Type for a general recipe, extending BaseRecipe
  // export type Recipe = BaseRecipe & {
  //   cookingTime: number; // Time required to prepare the recipe
  //   cuisine: string[]; // Array of cuisines (e.g., "Italian", "Japanese")
  //   category: string; // Recipe category (e.g., "Dessert", "Main Dish")
  //   dietaryRestrictions: string[]; // Array of dietary restrictions (e.g., "Vegan")
  // };
  
  // // Type for a detailed recipe, extending Recipe
  // export type DetailedRecipe = Recipe & {
  //   ingredients: { name: string; allergens: string[] }[]; // List of ingredients and their allergens
  //   steps: string[]; // List of preparation steps
  // };

  // Type for a detailed recipe, extending Recipe
  export type NutritionFact = {
    nutrition_id: number;
    recipe_id: number;
    calories: number;
    proteins: number;
    fats: number;
  };
  
  // Type for an individual recipe step
  export type RecipeStep = {
    recipe_id: number; // ID of the associated recipe
    step_num: number; // Step number in the recipe
    description: string; // Description of the step
  };
  
  // Type for a general ingredient
  export type Ingredient = {
    id: number; // Unique identifier for the ingredient
    name: string; // Name of the ingredient
    storage_temp: number;
  };
  
  // Type for a perishable ingredient, extending Ingredient
  export type PerishableIngredient = Ingredient & {
    shelf_life: number; // Shelf life of the ingredient in days
  };
  
  // Type for mapping recipes to their ingredients
  export type RecipeIngredient = {
    recipe_id: number; // ID of the recipe
    ingredient_id: number; // ID of the ingredient
  };
  
  // Type for an allergen
  export type Allergen = {
    id: number; // Unique identifier for the allergen
    name: string; // Name of the allergen
  };
  
  // Type for mapping ingredients to allergens
  export type IngredientAllergen = {
    ingredient_id: number; // ID of the ingredient
    allergen_id: number; // ID of the allergen
  };
  
  // Type for a recipe category
  export type Category = {
    id: number; // Unique identifier for the category
    name: string; // Name of the category
  };
  
  // Type for mapping recipes to categories
  export type RecipeCategory = {
    recipe_id: number; // ID of the recipe
    category_id: number; // ID of the category
  };
  
  // Type for a cuisine
  export type Cuisine = {
    id: number; // Unique identifier for the cuisine
    name: string; // Name of the cuisine
  };
  
  // Type for mapping recipes to cuisines
  export type RecipeCuisine = {
    recipe_id: number; // ID of the recipe
    cuisine_id: number; // ID of the cuisine
  };
  
  // Type for a dietary restriction
  export type DietaryRestriction = {
    id: number; // Unique identifier for the restriction
    name: string; // Name of the restriction
    description: string;
  };
  
  // Type for mapping recipes to dietary restrictions
  export type RecipeDietaryRestriction = {
    recipe_id: number; // ID of the recipe
    dietary_id: number; // ID of the dietary restriction
  };
  
  // Type for a user
  export type User = {
    id: number;
    email: string; 
    password: string;
  };

