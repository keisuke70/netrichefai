"use server";

import { sql, db } from "@vercel/postgres";
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
import format from "pg-format";

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

// Example implementation (you'll need to adjust this to match your schema)
export async function fetchDetailedRecipe(recipeId: number) {
  // Fetch basic recipe info
  const recipeResult = await sql`
    SELECT * FROM recipes WHERE id = ${recipeId};
  `;
  const recipe = recipeResult.rows[0] as Recipe;

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // Fetch categories
  const categoriesResult = await sql`
    SELECT c.name FROM categories c
    JOIN recipe_categories rc ON c.id = rc.category_id
    WHERE rc.recipe_id = ${recipeId};
  `;
  const recipeCategories = categoriesResult.rows.map((row) => row.name);

  // Fetch cuisines
  const cuisinesResult = await sql`
    SELECT cu.name FROM cuisines cu
    JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
    WHERE rc.recipe_id = ${recipeId};
  `;
  const recipeCuisines = cuisinesResult.rows.map((row) => row.name);

  // Fetch dietary restrictions
  const dietaryResult = await sql`
    SELECT d.name FROM dietary_restrictions d
    JOIN recipe_dietary_restrictions rdr ON d.id = rdr.dietary_id
    WHERE rdr.recipe_id = ${recipeId};
  `;
  const recipeDietaryRestrictions = dietaryResult.rows.map((row) => row.name);

  // Fetch ingredients and their allergens
  const ingredientsResult = await sql`
    SELECT i.id, i.name, i.storage_temp, pi.shelf_life FROM ingredients i
    JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
    LEFT JOIN perishable_ingredients pi ON i.id = pi.id
    WHERE ri.recipe_id = ${recipeId};
  `;
  const ingredients = await Promise.all(
    ingredientsResult.rows.map(async (ingredient) => {
      const allergensResult = await sql`
        SELECT a.name FROM allergens a
        JOIN ingredient_allergens ia ON a.id = ia.allergen_id
        WHERE ia.ingredient_id = ${ingredient.id};
      `;
      const allergens = allergensResult.rows.map((row) => row.name);
      return {
        name: ingredient.name,
        allergens,
        storage_temp: ingredient.storage_temp,
        shelf_life: ingredient.shelf_life,
      };
    })
  );

  // Fetch steps
  const stepsResult = await sql`
    SELECT description FROM recipe_steps
    WHERE recipe_id = ${recipeId}
    ORDER BY step_num;
  `;
  const steps = stepsResult.rows.map((row) => row.description);

  // Fetch nutrition facts
  const nutritionResult = await sql`
    SELECT calories, proteins, fats FROM nutrition_facts
    WHERE recipe_id = ${recipeId};
  `;
  const nutritionFacts = nutritionResult.rows[0] || null;

  return {
    ...recipe,
    category: recipeCategories,
    cuisines: recipeCuisines,
    dietaryRestrictions: recipeDietaryRestrictions,
    ingredients,
    steps,
    nutritionFacts,
  };
}

// Fetch recipe steps
export async function fetchRecipeSteps(
  recipeId: number
): Promise<RecipeStep[]> {
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
export async function fetchNutritionFacts(
  recipeId: number
): Promise<NutritionFact | null> {
  const { rows } = await sql<NutritionFact>`
    SELECT nutrition_id, recipe_id, calories, proteins, fats
    FROM nutrition_facts
    WHERE recipe_id = ${recipeId};
  `;
  return rows.length > 0 ? rows[0] : null;
}

// Fetch ingredients of a recipe
export async function fetchRecipeIngredients(
  recipeId: number
): Promise<Ingredient[]> {
  const { rows } = await sql`
    SELECT i.id, i.name, i.storage_temp
    FROM ingredients i
    JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = ${recipeId};
  `;
  return rows as Ingredient[];
}

// Fetch perishable ingredients of a recipe
export async function fetchPerishableIngredients(
  recipeId: number
): Promise<PerishableIngredient[]> {
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
export async function fetchAllergens(
  ingredientId: number
): Promise<Allergen[]> {
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
export async function fetchDietaryRestrictions(): Promise<
  DietaryRestriction[]
> {
  const { rows } = await sql<DietaryRestriction>`
    SELECT id, name, description
    FROM dietary_restrictions;
  `;
  return rows;
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
    console.error(
      "Error fetching cuisine with the most popular recipes:",
      error
    );
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
export async function searchRecipes(
  filters: string
): Promise<{ id: number; title: string }[]> {
  try {
    const query = `
      SELECT id, title
      FROM recipes
      WHERE ${filters};
    `;
    const { rows } = await sql<{ id: number; title: string }>([
      query,
    ] as unknown as TemplateStringsArray);
    return rows;
  } catch (error) {
    console.error("Error searching recipes:", error);
    throw new Error("Failed to search recipes.");
  }
}

// Project recipe attributes
export async function projectRecipeAttributes(
  attributes: string[]
): Promise<Record<string, any>[]> {
  try {
    const selectedAttributes = attributes.join(", ");
    const query = `
      SELECT ${selectedAttributes}
      FROM recipes;
    `;
    const { rows } = await sql<Record<string, any>>([
      query,
    ] as unknown as TemplateStringsArray);
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
    const { rows } = await sql<Record<string, any>>([
      query,
    ] as unknown as TemplateStringsArray);
    return rows;
  } catch (error) {
    console.error("Error fetching recipes by dietary restrictions:", error);
    throw new Error("Failed to fetch recipes by dietary restrictions.");
  }
}

export async function detailedRecipeExists(recipeId: number): Promise<boolean> {
  const stepsResult = await sql`
    SELECT 1 FROM recipe_steps WHERE recipe_id = ${recipeId} LIMIT 1;
  `;
  return stepsResult.rows.length > 0;
}

// Don't touch below
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

export async function fetchUserDietaryRestrictionNames(
  userId: number
): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT DISTINCT dr.name
      FROM dietary_restrictions dr
      JOIN recipe_dietary_restrictions rdr ON dr.id = rdr.dietary_id
      JOIN recipes r ON rdr.recipe_id = r.id
      WHERE r.user_id = ${userId};
    `;
    return rows.map((row) => row.name);
  } catch (error) {
    console.error("Error fetching dietary restriction names for user:", error);
    throw new Error("Failed to fetch dietary restriction names.");
  }
}

export async function fetchUserCuisineNames(userId: number): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT DISTINCT c.name
      FROM cuisines c
      JOIN recipe_cuisines rc ON c.id = rc.cuisine_id
      JOIN recipes r ON rc.recipe_id = r.id
      WHERE r.user_id = ${userId};
    `;
    return rows.map((row) => row.name);
  } catch (error) {
    console.error("Error fetching cuisine names for user:", error);
    throw new Error("Failed to fetch cuisine names.");
  }
}

export async function fetchUniqueCategoryNamesByUserId(
  userId: number
): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT DISTINCT c.name
      FROM categories c
      JOIN recipe_categories rc ON c.id = rc.category_id
      JOIN recipes r ON rc.recipe_id = r.id
      WHERE r.user_id = ${userId};
    `;
    return rows.map((row) => row.name);
  } catch (error) {
    console.error("Error fetching unique category names by user ID:", error);
    throw new Error("Failed to fetch unique category names.");
  }
}

export async function updateRecipeTitle(
  recipeId: number,
  newTitle: string
): Promise<number> {
  try {
    const result = await sql`
      UPDATE recipes
      SET title = ${newTitle}
      WHERE id = ${recipeId};
    `;

    const updatedRows = result.rowCount ?? 0;

    return updatedRows > 0 ? 1 : 0;
  } catch (error) {
    console.error("Error updating recipe title:", error);
    return 0;
  }
}

export async function fetchCustomNutritionFacts(
  recipeId: number,
  showCalories: boolean,
  showProteins: boolean,
  showFats: boolean
): Promise<Record<string, number | null> | null> {
  try {
    // Determine which attributes to select based on the boolean flags
    const selectedAttributes: string[] = [];
    if (showCalories) selectedAttributes.push("calories");
    if (showProteins) selectedAttributes.push("proteins");
    if (showFats) selectedAttributes.push("fats");

    // If no attributes are selected, return null immediately
    if (selectedAttributes.length === 0) {
      return null;
    }

    // Validate the selected attributes against allowed columns
    const validColumns = ["calories", "proteins", "fats"];
    const columns = selectedAttributes.filter((col) =>
      validColumns.includes(col)
    );

    if (columns.length === 0) {
      return null;
    }

    // Use pg-format to safely format the query with dynamic column names
    const query = format(
      "SELECT %I FROM nutrition_facts WHERE recipe_id = %L;",
      columns,
      recipeId
    );
    const client = await db.connect();
    // Execute the query using sql.unsafe
    const { rows } = await client.query(query);

    // Return the first row or null if no data exists
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching custom nutrition facts:", error);
    throw new Error("Failed to fetch custom nutrition facts.");
  }
}

export async function fetchFilteredRecipes(
  userId: number,
  category?: string,
  cuisine?: string,
  dietaryRestriction?: string
): Promise<Recipe[]> {
  try {
    let query= "";
    // Define the base query
    // Add dynamic filters
    if (category) {
      query += ` AND c.name = $${category}`;
    }
    if (cuisine) {
      query += ` AND cu.name = $${cuisine}`;
    }
    if (dietaryRestriction) {
      query += ` AND dr.name = $${dietaryRestriction}`;
    }

    // Execute the query with sql template
    const { rows } = await sql<Recipe>`
      SELECT DISTINCT r.id, r.user_id, r.title, r.description, r.cooking_time
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
      LEFT JOIN categories c ON rc.category_id = c.id
      LEFT JOIN recipe_cuisines rcu ON r.id = rcu.recipe_id
      LEFT JOIN cuisines cu ON rcu.cuisine_id = cu.id
      LEFT JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
      LEFT JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
      WHERE r.user_id = ${userId} ${query}
    `;
    return rows;
  } catch (error) {
    console.error("Error fetching filtered recipes:", error);
    throw new Error("Failed to fetch filtered recipes.");
  }
}
