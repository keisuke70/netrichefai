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

// Fetch user recipes with pagination
export async function fetchUserRecipes(
  userId: number,
  page: number = 1,
  limit: number = 5
): Promise<{ recipes: Recipe[]; totalCount: number }> {
  const offset = (page - 1) * limit;

  const { rows } = await sql`
    SELECT 
      r.id, 
      r.user_id, 
      r.title, 
      r.description, 
      r.cooking_time AS "cooking_time"
    FROM recipes r
    WHERE r.user_id = ${userId}
    ORDER BY r.id ASC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const totalCount = parseInt(
    (
      await sql`
        SELECT COUNT(*) AS total_count
        FROM recipes
        WHERE user_id = ${userId};
      `
    ).rows[0]?.total_count || "0",
    10
  );

  return { recipes: rows as Recipe[], totalCount };
}

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

// User signup
export async function signup(formData: FormData): Promise<string | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { rows: existingUser } = await sql`
    SELECT id
    FROM users
    WHERE email = ${email};
  `;

  if (existingUser.length > 0) {
    return "This email is already used.";
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO users (email, password)
    VALUES (${email}, ${hashedPassword});
  `;

  await signIn("credentials", {
    redirect: true,
    redirectTo: "/",
    email,
    password,
  });
}

// User authentication
export async function authenticate(formData: FormData): Promise<string | void> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
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


export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);

  try {
    const { rows } = await sql`
      SELECT id, title, created_at
      FROM recipes
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recent recipes." }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  try {
    const { id, name, email } = await req.json();

    if (!id || (!name && !email)) {
      return NextResponse.json({ error: "ID and at least one field to update are required." }, { status: 400 });
    }

    await sql`
      UPDATE users
      SET 
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email)
      WHERE id = ${id};
    `;

    return NextResponse.json({ message: "User updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}