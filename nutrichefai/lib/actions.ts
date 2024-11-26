"use server";

import { sql } from "@vercel/postgres";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  cuisine: string[];
  category: string;
  dietaryRestrictions: string[];
}

export interface DetailedRecipe {
  id: string;
  title: string;
  description: string;
  category: string;
  cuisine: string[];
  dietaryRestrictions: string[];
  ingredients: { name: string; allergens: string[] }[];
  steps: string[];
}

export async function fetchUserRecipes(
  userId: number,
  page: number = 1,
  limit: number = 5
): Promise<{ recipes: Recipe[]; totalCount: number }> {
  const offset = (page - 1) * limit;

  const { rows } = await sql`
    SELECT 
      r.id, 
      r.title, 
      r.description, 
      r.cooking_time AS "cookingTime",
      ARRAY_AGG(DISTINCT c.name) AS cuisine,
      (
        SELECT cat.name
        FROM recipe_categories rcat
        JOIN categories cat ON rcat.category_id = cat.id
        WHERE rcat.recipe_id = r.id
        LIMIT 1
      ) AS category,
      ARRAY_AGG(DISTINCT dr.name) AS dietaryRestrictions
    FROM recipes r
    LEFT JOIN recipe_cuisines rc ON r.id = rc.recipe_id
    LEFT JOIN cuisines c ON rc.cuisine_id = c.id
    LEFT JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
    LEFT JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
    WHERE r.user_id = ${userId}
    GROUP BY r.id
    ORDER BY r.id ASC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const { rows: totalCountRows } = await sql`
    SELECT COUNT(*) AS total_count
    FROM recipes
    WHERE user_id = ${userId};
  `;

  const totalCount = parseInt(totalCountRows[0]?.total_count || "0", 10);

  const recipes: Recipe[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    cookingTime: row.cookingTime,
    cuisine: row.cuisine || [],
    category: row.category || "",
    dietaryRestrictions: row.dietaryRestrictions || [],
  }));

  return { recipes, totalCount };
}

export async function fetchDetailedRecipe(recipeId: string): Promise<DetailedRecipe> {
  // Fetch detailed recipe information
  const { rows: recipeRows } = await sql`
    SELECT 
      r.id, 
      r.title, 
      r.description, 
      (
        SELECT cat.name
        FROM recipe_categories rcat
        JOIN categories cat ON rcat.category_id = cat.id
        WHERE rcat.recipe_id = r.id
        LIMIT 1
      ) AS category,
      ARRAY_AGG(DISTINCT c.name) AS cuisine,
      ARRAY_AGG(DISTINCT dr.name) AS dietaryRestrictions
    FROM recipes r
    LEFT JOIN recipe_cuisines rc ON r.id = rc.recipe_id
    LEFT JOIN cuisines c ON rc.cuisine_id = c.id
    LEFT JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
    LEFT JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
    WHERE r.id = ${recipeId}
    GROUP BY r.id;
  `;

  if (recipeRows.length === 0) {
    throw new Error(`Recipe with ID ${recipeId} not found.`);
  }

  const recipe = recipeRows[0];

  // Fetch ingredients and allergens
  const { rows: ingredientRows } = await sql`
    SELECT 
      i.name AS ingredient_name,
      ARRAY_AGG(DISTINCT a.name) AS allergens
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    LEFT JOIN ingredient_allergens ia ON i.id = ia.ingredient_id
    LEFT JOIN allergens a ON ia.allergen_id = a.id
    WHERE ri.recipe_id = ${recipeId}
    GROUP BY i.id;
  `;

  const ingredients = ingredientRows.map((row) => ({
    name: row.ingredient_name,
    allergens: row.allergens || [],
  }));

  const { rows: stepRows } = await sql`
    SELECT step_num, description
    FROM recipe_steps
    WHERE recipe_id = ${recipeId}
    ORDER BY step_num ASC;
  `;

  const steps = stepRows.map((row) => row.description);

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    cuisine: recipe.cuisine || [],
    dietaryRestrictions: recipe.dietaryRestrictions || [],
    ingredients,
    steps,
  };
}
