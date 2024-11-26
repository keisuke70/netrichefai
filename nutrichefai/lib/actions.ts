"use server";

import { sql } from "@vercel/postgres"; // Import SQL client for interacting with PostgreSQL
import { Recipe, DetailedRecipe } from "./definitions"; // Import the types defined in `definitions.ts`
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcrypt";


// Function to fetch a paginated list of recipes for a specific user
export async function fetchUserRecipes(
  userId: number, // The ID of the user whose recipes are being fetched
  page: number = 1, // Default to the first page
  limit: number = 5 // Limit to 5 recipes per page
): Promise<{ recipes: Recipe[]; totalCount: number }> {
  const offset = (page - 1) * limit; // Calculate the starting point for pagination

  // SQL query to fetch recipes along with related information (cuisine, category, dietary restrictions)
  const { rows } = await sql`
    SELECT 
      r.id, 
      r.title, 
      r.description, 
      r.cooking_time AS "cookingTime", -- Convert database field to camelCase for TypeScript
      ARRAY_AGG(DISTINCT c.name) AS cuisine, -- Aggregate cuisines as an array
      (
        SELECT cat.name
        FROM recipe_categories rcat
        JOIN categories cat ON rcat.category_id = cat.id
        WHERE rcat.recipe_id = r.id
        LIMIT 1 -- Fetch only one category per recipe
      ) AS category,
      ARRAY_AGG(DISTINCT dr.name) AS dietaryRestrictions -- Aggregate dietary restrictions as an array
    FROM recipes r
    LEFT JOIN recipe_cuisines rc ON r.id = rc.recipe_id
    LEFT JOIN cuisines c ON rc.cuisine_id = c.id
    LEFT JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
    LEFT JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
    WHERE r.user_id = ${userId} -- Filter by the specific user ID
    GROUP BY r.id
    ORDER BY r.id ASC
    LIMIT ${limit} OFFSET ${offset}; -- Apply pagination
  `;

  // SQL query to fetch the total number of recipes for the user
  const totalCount = parseInt(
    (
      await sql`
        SELECT COUNT(*) AS total_count
        FROM recipes
        WHERE user_id = ${userId};
      `
    ).rows[0]?.total_count || "0", // Default to "0" if no rows are returned
    10
  );

  // Map SQL rows to the `Recipe` type
  const recipes: Recipe[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    cookingTime: row.cookingTime,
    cuisine: row.cuisine || [], // Default to an empty array if null
    category: row.category || "", // Default to an empty string if null
    dietaryRestrictions: row.dietaryRestrictions || [], // Default to an empty array if null
  }));

  return { recipes, totalCount }; // Return the recipes and the total count
}

// Function to fetch detailed information about a single recipe
export async function fetchDetailedRecipe(recipeId: string): Promise<DetailedRecipe> {
  // SQL query to fetch the recipe's basic details
  const { rows: recipeRows } = await sql`
    SELECT 
      r.id, 
      r.title, 
      r.description, 
      r.cooking_time AS "cookingTime", -- Include cookingTime
      (
        SELECT COALESCE(cat.name, '') -- Fetch category name or default to an empty string
        FROM recipe_categories rcat
        JOIN categories cat ON rcat.category_id = cat.id
        WHERE rcat.recipe_id = r.id
        LIMIT 1
      ) AS category,
      COALESCE(ARRAY_AGG(DISTINCT c.name), '{}') AS cuisine, -- Default to an empty array if null
      COALESCE(ARRAY_AGG(DISTINCT dr.name), '{}') AS dietaryRestrictions -- Default to an empty array if null
    FROM recipes r
    LEFT JOIN recipe_cuisines rc ON r.id = rc.recipe_id
    LEFT JOIN cuisines c ON rc.cuisine_id = c.id
    LEFT JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
    LEFT JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
    WHERE r.id = ${recipeId} -- Filter by the specific recipe ID
    GROUP BY r.id;
  `;

  // If no recipe is found, throw an error
  if (recipeRows.length === 0) {
    throw new Error(`Recipe with ID ${recipeId} not found.`);
  }

  const recipe = recipeRows[0]; // Extract the first (and only) row

  // SQL query to fetch the ingredients and allergens for the recipe
  const { rows: ingredientRows } = await sql`
    SELECT 
      i.name AS ingredient_name,
      COALESCE(ARRAY_AGG(DISTINCT a.name), '{}') AS allergens -- Default to an empty array if null
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    LEFT JOIN ingredient_allergens ia ON i.id = ia.ingredient_id
    LEFT JOIN allergens a ON ia.allergen_id = a.id
    WHERE ri.recipe_id = ${recipeId}
    GROUP BY i.id;
  `;

  // Map SQL rows to an array of ingredients
  const ingredients = ingredientRows.map((row) => ({
    name: row.ingredient_name,
    allergens: row.allergens || [], // Default to an empty array if null
  }));

  // SQL query to fetch the recipe's preparation steps
  const { rows: stepRows } = await sql`
    SELECT step_num, description
    FROM recipe_steps
    WHERE recipe_id = ${recipeId}
    ORDER BY step_num ASC; -- Ensure steps are returned in the correct order
  `;

  // Map SQL rows to an array of step descriptions
  const steps = stepRows.map((row) => row.description);

  // Return the detailed recipe object
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cookingTime: recipe.cookingTime || 0, // Default to 0 if null
    category: recipe.category || "", // Default to an empty string if null
    cuisine: recipe.cuisine || [], // Default to an empty array if null
    dietaryRestrictions: recipe.dietaryRestrictions || [], // Default to an empty array if null
    ingredients,
    steps,
  };
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