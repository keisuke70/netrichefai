"use server";

import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
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
} from "./definitions";

// // Fetch user recipes with pagination
// export async function fetchUserRecipes(
//   userId: number,
//   page: number = 1,
//   limit: number = 5
// ): Promise<{ recipes: Recipe[]; totalCount: number }> {
//   const offset = (page - 1) * limit;

//   const { rows } = await sql`
//     SELECT 
//       r.id, 
//       r.user_id, 
//       r.title, 
//       r.description, 
//       r.cooking_time AS "cooking_time"
//     FROM recipes r
//     WHERE r.user_id = ${userId}
//     ORDER BY r.id ASC
//     LIMIT ${limit} OFFSET ${offset};
//   `;

//   const totalCount = parseInt(
//     (
//       await sql`
//         SELECT COUNT(*) AS total_count
//         FROM recipes
//         WHERE user_id = ${userId};
//       `
//     ).rows[0]?.total_count || "0",
//     10
//   );

//   return { recipes: rows as Recipe[], totalCount };
// }

// Fetch a single user's recipes without pagination
export async function fetchRecipeByUser(userId: number): Promise<Recipe[]> {
  const { rows } = await sql<Recipe>`
    SELECT 
      r.id, 
      r.user_id, 
      r.title, 
      r.description, 
      r.cooking_time AS "cooking_time"
    FROM recipes r
    WHERE r.user_id = ${userId};
  `;
  return rows;
}

// Fetch detailed recipe information
export async function fetchDetailedRecipe(recipeId: number) {
  const { rows: recipeRows } = await sql`
    SELECT 
      r.id, 
      r.user_id, 
      r.title, 
      r.description, 
      r.cooking_time AS "cooking_time"
    FROM recipes r
    WHERE r.id = ${recipeId};
  `;

  if (recipeRows.length === 0) {
    throw new Error(`Recipe with ID ${recipeId} not found.`);
  }

  const recipe = recipeRows[0];

  const { rows: ingredientRows } = await sql`
    SELECT 
      i.id,
      i.name,
      i.storage_temp,
      COALESCE(ARRAY_AGG(DISTINCT a.name), '{}') AS allergens
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    LEFT JOIN ingredient_allergens ia ON i.id = ia.ingredient_id
    LEFT JOIN allergens a ON ia.allergen_id = a.id
    WHERE ri.recipe_id = ${recipeId}
    GROUP BY i.id;
  `;

  const ingredients = ingredientRows.map((row) => ({
    id: row.id,
    name: row.name,
    storage_temp: row.storage_temp,
    allergens: row.allergens || [],
  }));

  const { rows: stepRows } = await sql`
    SELECT step_num, description
    FROM recipe_steps
    WHERE recipe_id = ${recipeId}
    ORDER BY step_num ASC;
  `;

  const steps = stepRows.map((row) => ({
    recipe_id: recipeId,
    step_num: row.step_num,
    description: row.description,
  }));

  return {
    ...recipe,
    ingredients,
    steps,
  };
}

// Fetch recipe steps
export async function fetchRecipeSteps(recipeId: number): Promise<RecipeStep[]> {
  const { rows } = await sql<RecipeStep>`
    SELECT 
      recipe_id, 
      step_num, 
      description
    FROM recipe_steps
    WHERE recipe_id = ${recipeId}
    ORDER BY step_num ASC;
  `;
  return rows;
}

// Fetch nutrition facts for a recipe
export async function fetchNutritionFacts(recipeId: number): Promise<NutritionFact | null> {
  const { rows } = await sql<NutritionFact>`
    SELECT nutrition_id, recipe_id, calories, proteins, fats
    FROM nutrition_facts
    WHERE recipe_id = ${recipeId};
  `;
  return rows.length > 0 ? rows[0] : null;
}

// Fetch ingredients of a recipe
export async function fetchRecipeIngredients(recipeId: number): Promise<Ingredient[]> {
  const { rows } = await sql`
    SELECT i.id, i.name, i.storage_temp
    FROM ingredients i
    JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = ${recipeId};
  `;
  return rows as Ingredient[];
}

// Fetch perishable ingredients of a recipe
export async function fetchPerishableIngredients(recipeId: number): Promise<PerishableIngredient[]> {
  const { rows } = await sql`
    SELECT 
      i.id, 
      i.name, 
      i.storage_temp, 
      pi.shelf_life
    FROM ingredients i
    JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
    JOIN perishable_ingredients pi ON i.id = pi.id
    WHERE ri.recipe_id = ${recipeId};
  `;
  return rows as PerishableIngredient[];
}

// Fetch allergens for an ingredient
export async function fetchAllergens(ingredientId: number): Promise<Allergen[]> {
  const { rows } = await sql`
    SELECT a.id, a.name
    FROM allergens a
    JOIN ingredient_allergens ia ON a.id = ia.allergen_id
    WHERE ia.ingredient_id = ${ingredientId};
  `;
  return rows as Allergen[];
}

// Fetch categories
export async function fetchCategories(): Promise<Category[]> {
  const { rows } = await sql<Category>`
    SELECT id, name
    FROM categories;
  `;
  return rows;
}

// Fetch cuisines
export async function fetchCuisines(): Promise<Cuisine[]> {
  const { rows } = await sql<Cuisine>`
    SELECT id, name
    FROM cuisines;
  `;
  return rows;
}

// Fetch dietary restrictions
export async function fetchDietaryRestrictions(): Promise<DietaryRestriction[]> {
  const { rows } = await sql<DietaryRestriction>`
    SELECT id, name, description
    FROM dietary_restrictions;
  `;
  return rows;
}


export async function signup(
  prevState: string | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Check if the email already exists
  const existingUser = await sql`SELECT * FROM users WHERE email = ${email};`;

  if (existingUser.rows.length > 0) {
    return `This email is already used`;
  }

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds set to 10

  // Store the user in the database with the hashed password
  await sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword});`;

  // Sign the user in using NextAuth's credentials provider
  await signIn("credentials", {
    redirect: true,
    redirectTo: "/",
    email,
    password,
  });
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    await signIn("credentials", {
      redirect: true,
      redirectTo: "/",
      email,
      password,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid credentials. Please try again.";
    }
    throw error;
  }
}
export async function deleteRecipe(recipeId: number): Promise<string> {
  try {
    if (!recipeId) {
      throw new Error("Recipe ID is required.");
    }

    await sql`
      DELETE FROM recipes
      WHERE id = ${recipeId};
    `;

    return "Recipe deleted successfully.";
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw new Error("Failed to delete the recipe. Please try again.");
  }
}

export async function numOfRecipesByCategory(): Promise<
  { category: string; recipe_count: number }[]
> {
  try {
    const { rows } = await sql`
      SELECT 
        c.name AS category, 
        COUNT(r.id) AS recipe_count
      FROM categories c
      LEFT JOIN recipe_categories rc ON c.id = rc.category_id
      LEFT JOIN recipes r ON rc.recipe_id = r.id
      GROUP BY c.name
      ORDER BY recipe_count DESC; -- Optional: Order by count, descending
    `;

    return rows.map((row) => ({
      category: row.category,
      recipe_count: parseInt(row.recipe_count, 10),
    }));
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    throw new Error("Failed to fetch recipes by category.");
  }
}

export async function fetchCuisineWithMostPopularRecipes(): Promise<{
  cuisine: string;
  average_popularity: number;
}> {
  try {
    const { rows } = await sql`
      SELECT 
        cu.name AS cuisine, 
        AVG(r.popularity) AS average_popularity
      FROM cuisines cu
      JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
      JOIN recipes r ON rc.recipe_id = r.id
      GROUP BY cu.name
      HAVING AVG(r.popularity) > 0
      ORDER BY average_popularity DESC
      LIMIT 1;
    `;

    if (rows.length === 0) {
      throw new Error("No cuisines found with popular recipes.");
    }

    return {
      cuisine: rows[0].cuisine,
      average_popularity: parseFloat(rows[0].average_popularity),
    };
  } catch (error) {
    console.error("Error fetching cuisine with the most popular recipes:", error);
    throw new Error("Failed to fetch cuisine with the most popular recipes.");
  }
}
// Insert a new recipe
export async function insertRecipe(data: {
  userId: number;
  title: string;
  description: string;
  cookingTime: number;
  categoryId: number;
}): Promise<{ message: string; recipeId?: number }> {
  try {
    const { rows: categoryRows } = await sql<{ id: number }>`
      SELECT id FROM categories WHERE id = ${data.categoryId};
    `;
    if (categoryRows.length === 0) {
      return { message: "Category does not exist." };
    }

    const { rows: recipeRows } = await sql<{ id: number }>`
      INSERT INTO recipes (user_id, title, description, cooking_time)
      VALUES (${data.userId}, ${data.title}, ${data.description}, ${data.cookingTime})
      RETURNING id;
    `;

    const recipeId = recipeRows[0].id;

    await sql`
      INSERT INTO recipe_categories (recipe_id, category_id)
      VALUES (${recipeId}, ${data.categoryId});
    `;

    return { message: "Recipe inserted successfully.", recipeId };
  } catch (error) {
    console.error("Error inserting recipe:", error);
    throw new Error("Failed to insert recipe.");
  }
}

// Search recipes based on filters
export async function searchRecipes(filters: string): Promise<{ id: number; title: string }[]> {
  try {
    const query = `
      SELECT id, title
      FROM recipes
      WHERE ${filters};
    `;
    const { rows } = await sql<{ id: number; title: string }>([query] as unknown as TemplateStringsArray);
    return rows;
  } catch (error) {
    console.error("Error searching recipes:", error);
    throw new Error("Failed to search recipes.");
  }
}



// Project recipe attributes
export async function projectRecipeAttributes(attributes: string[]): Promise<Record<string, any>[]> {
  try {
    const selectedAttributes = attributes.join(", ");
    const query = `
      SELECT ${selectedAttributes}
      FROM recipes;
    `;
    const { rows } = await sql<Record<string, any>>([query] as unknown as TemplateStringsArray);
    return rows;
  } catch (error) {
    console.error("Error projecting attributes:", error);
    throw new Error("Failed to project attributes.");
  }
}


// Join recipes and categories
export async function joinRecipesAndCategories(
  categoryId: number
): Promise<{ recipe: string; category: string }[]> {
  try {
    const { rows } = await sql<{ recipe: string; category: string }>`
      SELECT r.title AS recipe, c.name AS category
      FROM recipes r
      JOIN recipe_categories rc ON r.id = rc.recipe_id
      JOIN categories c ON rc.category_id = c.id
      WHERE c.id = ${categoryId};
    `;
    return rows;
  } catch (error) {
    console.error("Error joining recipes and categories:", error);
    throw new Error("Failed to join recipes and categories.");
  }
}

// Get recipes grouped by cuisine
export async function getRecipesGroupedByCuisine(): Promise<
  { cuisine: string; recipe_count: number }[]
> {
  try {
    const { rows } = await sql<{ cuisine: string; recipe_count: number }>`
      SELECT cu.name AS cuisine, COUNT(r.id) AS recipe_count
      FROM cuisines cu
      LEFT JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
      LEFT JOIN recipes r ON rc.recipe_id = r.id
      GROUP BY cu.name
      ORDER BY recipe_count DESC;
    `;
    return rows;
  } catch (error) {
    console.error("Error fetching recipes grouped by cuisine:", error);
    throw new Error("Failed to fetch recipes grouped by cuisine.");
  }
}

// Get popular cuisines with minimum popularity
export async function getPopularCuisines(
  minPopularity: number
): Promise<{ cuisine: string; average_popularity: number }[]> {
  try {
    const { rows } = await sql<{ cuisine: string; average_popularity: number }>`
      SELECT cu.name AS cuisine, AVG(r.popularity) AS average_popularity
      FROM cuisines cu
      JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
      JOIN recipes r ON rc.recipe_id = r.id
      GROUP BY cu.name
      HAVING AVG(r.popularity) > ${minPopularity}
      ORDER BY average_popularity DESC;
    `;
    return rows;
  } catch (error) {
    console.error("Error fetching popular cuisines:", error);
    throw new Error("Failed to fetch popular cuisines.");
  }
}

// Get cuisines with popularity above global average
export async function getCuisinesAboveGlobalAverage(): Promise<
  { cuisine: string; average_popularity: number }[]
> {
  try {
    const { rows } = await sql<{ cuisine: string; average_popularity: number }>`
      SELECT cu.name AS cuisine, AVG(r.popularity) AS average_popularity
      FROM cuisines cu
      JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
      JOIN recipes r ON rc.recipe_id = r.id
      GROUP BY cu.name
      HAVING AVG(r.popularity) > (
        SELECT AVG(r2.popularity) FROM recipes r2
      )
      ORDER BY average_popularity DESC;
    `;
    return rows;
  } catch (error) {
    console.error("Error fetching cuisines above global average:", error);
    throw new Error("Failed to fetch cuisines above global average.");
  }
}

export async function fetchRecipesByDietaryRestrictions(
  restrictions: string[]
): Promise<Record<string, any>[]> {
  try {
    // Join restrictions into a single quoted, comma-separated string
    const formattedRestrictions = restrictions.map((r) => `'${r}'`).join(", ");
    const query = `
      SELECT r.id, r.title, r.description, r.cooking_time
      FROM recipes r
      JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
      JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
      WHERE dr.name IN (${formattedRestrictions})
      GROUP BY r.id
      HAVING COUNT(DISTINCT dr.name) = ${restrictions.length};
    `;
    const { rows } = await sql<Record<string, any>>([query] as unknown as TemplateStringsArray);
    return rows;
  } catch (error) {
    console.error("Error fetching recipes by dietary restrictions:", error);
    throw new Error("Failed to fetch recipes by dietary restrictions.");
  }
}
