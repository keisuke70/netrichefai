import { sql } from '@vercel/postgres';
import {
    Recipe,
    RecipeStep,
    NutritionFact,
    Ingredient,
    PerishableIngredient,
    Allergen,
    Category,
    Cuisine,
    DietaryRestriction,
} from './definitions';

export async function fetchRecipeByUser(user_id: number): Promise<Recipe[]> {
    try {
        const data = await sql<Recipe>`
            SELECT recipes.id, recipes.title, recipes.overview, recipes.cooking_time
            FROM recipes
            JOIN user_recipes ON recipes.id = user_recipes.recipe_id
            WHERE user_recipes.user_id = ${user_id}
        `;

        return data.rows as Recipe[];
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch recipes.');
    }
}

export async function fetchRecipeSteps(recipe_id: number): Promise<RecipeStep[]> {
    try {
        const data = await sql<RecipeStep>`
            SELECT recipe_steps.step_num, recipe_steps.description
            FROM recipe_steps
            WHERE recipe_steps.recipe_id = ${recipe_id}
            ORDER BY recipe_steps.step_num ASC
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch recipe steps');
    }
}

export async function fetchNutritionFact(recipe_id: number): Promise<NutritionFact | null> {
    try {
        const data = await sql<NutritionFact>`
            SELECT nutrition_facts.recipe_id, nutrition_facts.calories, nutrition_facts.proteins, nutrition_facts.fats
            FROM nutrition_facts
            WHERE nutrition_facts.recipe_id = ${recipe_id}
            LIMIT 1
        `;

        return data.rows[0] || null;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch nutrition fact.');
    }
}

export async function fetchIngredients(recipe_id: number): Promise<Ingredient[]> {
    try {
        const data = await sql<Ingredient>`
            SELECT ingredients.id, ingredients.name, ingredients.storage_temp
            FROM ingredients
            JOIN recipe_ingredients ON ingredients.id = recipe_ingredients.ingredient_id
            WHERE recipe_ingredients.recipe_id = ${recipe_id}
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch ingredients.');
    }
}

export async function fetchPerishableIngredients(recipe_id: number): Promise<(Ingredient & PerishableIngredient)[]> {
    try {
        const data = await sql<(Ingredient & PerishableIngredient)>`
            SELECT ingredients.id, ingredients.name, ingredients.storage_temp, perishable_ingredients.shelf_life
            FROM ingredients
            JOIN recipe_ingredients ON ingredients.id = recipe_ingredients.ingredient_id
            JOIN perishable_ingredients ON ingredients.id = perishable_ingredients.id
            WHERE recipe_ingredients.recipe_id = ${recipe_id}
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch perishable ingredients.');
    }
}

export async function fetchAllergens(ingredient_id: number): Promise<Allergen[]> {
    try {
        const data = await sql<Allergen>`
            SELECT allergens.id, allergens.name
            FROM allergens
            JOIN ingredient_allergens ON allergens.id = ingredient_allergens.allergen_id
            WHERE ingredient_allergens.ingredient_id = ${ingredient_id}
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch allergens.');
    }
}

export async function fetchCategories(): Promise<Category[]> {
    try {
        const data = await sql<Category>`
            SELECT id, name
            FROM categories
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch categories.');
    }
}

export async function fetchCuisines(): Promise<Cuisine[]> {
    try {
        const data = await sql<Cuisine>`
            SELECT id, name
            FROM cuisines
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch cuisines.');
    }
}

export async function fetchDietaryRestrictions(): Promise<DietaryRestriction[]> {
    try {
        const data = await sql<DietaryRestriction>`
            SELECT id, name
            FROM dietary_restrictions
        `;

        return data.rows;
    } catch (error) {
        console.error('Database Error: ', error);
        throw new Error('Failed to fetch dietary restrictions.');
    }
}