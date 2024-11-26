export type Recipe = {
    id: number;
    user_id: number;
    title: string;
    description: string;
    cooking_time: number;
}

export type RecipeStep = {
    recipe_id: number;
    step_num: number;
    description: string;
}

export type NutritionFact = {
    nutrition_id: number;
    recipe_id: number;
    calories: number;
    proteins: number;
    fats: number;
}

export type Ingredient = {
    id: number;
    name: string;
    storage_temp: number;
}

export type PerishableIngredient = {
    id: number;
    shelf_life: number;
}

export type RecipeIngredient = {
    recipe_id: number;
    ingredient_id: number;
}

export type Allergen = {
    id: number;
    name: string;
}

export type IngredientAllergen = {
    ingredient_id: number;
    allergen_id: number;
}

export type Category = {
    id: number;
    name: string;
}

export type RecipeCategory = {
    recipe_id: number;
    category_id: number;
}

export type Cuisine = {
    id: number;
    name: string;
}

export type RecipeCuisine = {
    recipe_id: number;
    cuisine_id: number;
}

export type DietaryRestriction = {
    id: number;
    name: string;
    description: string;
}

export type RecipeDietaryRestriction = {
    recipe_id: number;
    dietary_id: number;
}

export type User = {
    id: number;
    name: string;
}