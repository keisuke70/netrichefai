// Base type for recipes, containing common properties
export type BaseRecipe = {
    id: string; // Unique identifier for the recipe
    title: string; // Recipe title
    description: string; // Brief description of the recipe
  };
  
  // Type for a general recipe, extending BaseRecipe
  export type Recipe = BaseRecipe & {
    cookingTime: number; // Time required to prepare the recipe
    cuisine: string[]; // Array of cuisines (e.g., "Italian", "Japanese")
    category: string; // Recipe category (e.g., "Dessert", "Main Dish")
    dietaryRestrictions: string[]; // Array of dietary restrictions (e.g., "Vegan")
  };
  
  // Type for a detailed recipe, extending Recipe
  export type DetailedRecipe = Recipe & {
    ingredients: { name: string; allergens: string[] }[]; // List of ingredients and their allergens
    steps: string[]; // List of preparation steps
  };
  
  // Type for an individual recipe step
  export type RecipeStep = {
    recipeId: string; // ID of the associated recipe
    stepNum: number; // Step number in the recipe
    description: string; // Description of the step
  };
  
  // Type for a general ingredient
  export type Ingredient = {
    id: string; // Unique identifier for the ingredient
    name: string; // Name of the ingredient
    storageTemp: number; // Recommended storage temperature for the ingredient
  };
  
  // Type for a perishable ingredient, extending Ingredient
  export type PerishableIngredient = Ingredient & {
    shelfLife: number; // Shelf life of the ingredient in days
  };
  
  // Type for mapping recipes to their ingredients
  export type RecipeIngredient = {
    recipeId: string; // ID of the recipe
    ingredientId: string; // ID of the ingredient
  };
  
  // Type for an allergen
  export type Allergen = {
    id: string; // Unique identifier for the allergen
    name: string; // Name of the allergen
  };
  
  // Type for mapping ingredients to allergens
  export type IngredientAllergen = {
    ingredientId: string; // ID of the ingredient
    allergenId: string; // ID of the allergen
  };
  
  // Type for a recipe category
  export type Category = {
    id: string; // Unique identifier for the category
    name: string; // Name of the category
  };
  
  // Type for mapping recipes to categories
  export type RecipeCategory = {
    recipeId: string; // ID of the recipe
    categoryId: string; // ID of the category
  };
  
  // Type for a cuisine
  export type Cuisine = {
    id: string; // Unique identifier for the cuisine
    name: string; // Name of the cuisine
  };
  
  // Type for mapping recipes to cuisines
  export type RecipeCuisine = {
    recipeId: string; // ID of the recipe
    cuisineId: string; // ID of the cuisine
  };
  
  // Type for a dietary restriction
  export type DietaryRestriction = {
    id: string; // Unique identifier for the restriction
    name: string; // Name of the restriction
  };
  
  // Type for mapping recipes to dietary restrictions
  export type RecipeDietaryRestriction = {
    recipeId: string; // ID of the recipe
    dietaryId: string; // ID of the dietary restriction
  };
  
  // Type for a user
  export type User = {
    id: string; // Unique identifier for the user
    name: string; // Name of the user
  };
  