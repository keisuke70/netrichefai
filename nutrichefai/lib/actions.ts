"use server";

import { db, sql } from "@vercel/postgres";
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
import { z } from "zod";

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

//Insert a new recipe
//2.1.1 INSERT

const recipeSchema = z.object({
  user_id: z
    .string()
    .regex(/^\d+$/, "Invalid user ID. Must be a number.")
    .transform(Number),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  cooking_time: z
    .string()
    .regex(/^\d+$/, "Cooking time must be a valid number.")
    .transform(Number), // Ensure it's converted to a number
});

export async function insertRecipe(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  recipeId?: number;
  errors?: Record<string, string[]>;
}> {
  // Parse and validate form data
  const validatedFields = recipeSchema.safeParse({
    user_id: formData.get("user_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    cooking_time: formData.get("cooking_time"),
  });

  // Return errors if validation fails
  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please correct the errors and try again.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  try {
    // Insert recipe into the database
    const { rows } = await sql<{ id: number }>`
      INSERT INTO recipes (user_id, title, description, cooking_time)
      VALUES (${data.user_id}, ${data.title}, ${data.description}, ${data.cooking_time})
      RETURNING id;
    `;

    const recipeId = rows[0]?.id;

    return {
      message: "Recipe inserted successfully.",
      recipeId,
    };
  } catch (error) {
    console.error("Error inserting recipe:", error);
    throw new Error("Failed to insert recipe.");
  }
}

// 2.1.2 update
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

// 2.1.3 DELETE
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

// 2.1.4 Selection
export async function fetchFilteredRecipes(
  userId: number,
  category?: string,
  cuisine?: string,
  dietaryRestriction?: string
): Promise<Recipe[]> {
  try {
    // Initialize the base query and parameters array
    let baseQuery = `
      SELECT DISTINCT r.id, r.user_id, r.title, r.description, r.cooking_time
      FROM recipes r
      LEFT JOIN recipe_categories rc ON r.id = rc.recipe_id
      LEFT JOIN categories c ON rc.category_id = c.id
      LEFT JOIN recipe_cuisines rcu ON r.id = rcu.recipe_id
      LEFT JOIN cuisines cu ON rcu.cuisine_id = cu.id
      LEFT JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
      LEFT JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
      WHERE r.user_id = %L
    `;
    const queryParams: any[] = [userId];

    // Collect conditions
    const conditions: string[] = [];

    if (category) {
      conditions.push("c.name = %L");
      queryParams.push(category);
    }
    if (cuisine) {
      conditions.push("cu.name = %L");
      queryParams.push(cuisine);
    }
    if (dietaryRestriction) {
      conditions.push("dr.name = %L");
      queryParams.push(dietaryRestriction);
    }

    // If there are additional conditions, append them to the base query
    if (conditions.length > 0) {
      const whereClause = conditions.join(" AND ");
      baseQuery += ` AND ${whereClause}`;
    }

    // Use pg-format to safely format the query with parameters
    const formattedQuery = format(baseQuery, ...queryParams);

    const client = await db.connect();
    // Execute the query using sql.unsafe
    const { rows } = await client.query(formattedQuery);

    return rows;
  } catch (error) {
    console.error("Error fetching filtered recipes:", error);
    throw new Error("Failed to fetch filtered recipes.");
  }
}

// 2.1.5 projection
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

// 2.1.6 Join
export async function fetchRecipesByIngredient(
  ingredientName: string
): Promise<Recipe[]> {
  try {
    const { rows } = await sql<Recipe>`
      SELECT DISTINCT recipes.id, recipes.title, recipes.description, recipes.cooking_time
      FROM recipes
      INNER JOIN recipe_ingredients ON recipes.id = recipe_ingredients.recipe_id
      INNER JOIN ingredients ON recipe_ingredients.ingredient_id = ingredients.id
      WHERE ingredients.name ILIKE '%' || ${ingredientName} || '%';
    `;

    return rows;
  } catch (error) {
    console.error("Error fetching recipes by ingredient:", error);
    throw new Error("Failed to fetch recipes by ingredient.");
  }
}

// 2.1.7 Aggregation with GROUP BY
export async function numOfRecipesByCategory(
  userId: number
): Promise<{ category: string; recipe_count: number }[]> {
  try {
    const { rows } = await sql`
      SELECT 
        c.name AS category, 
        COUNT(r.id) AS recipe_count
      FROM categories c
      LEFT JOIN recipe_categories rc ON c.id = rc.category_id
      LEFT JOIN recipes r ON rc.recipe_id = r.id
      WHERE r.user_id = ${userId} -- Filter by userId
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


// 2.1.8 Aggregation with HAVING
export async function maxCuisineAppearance(userId: number): Promise<{ cuisine: string; count: number } | null> {
  if (!userId) {
    throw new Error("Recipe ID is required.");
  }

  try {
    const result = await sql`
      SELECT
        c.name AS cuisine,
        COUNT(rc.recipe_id) AS count
      FROM cuisines c
      JOIN recipe_cuisines rc ON c.id = rc.cuisine_id
      WHERE rc.recipe_id = ${userId} -- Filter by userId
      GROUP BY c.name
      HAVING COUNT(rc.recipe_id) > 0
      ORDER BY count DESC
      LIMIT 1;
    `;

    // If a result exists, return the cuisine and count
    if (result.rows.length > 0) {
      return {
        cuisine: result.rows[0].cuisine,
        count: parseInt(result.rows[0].count, 10),
      };
    }

    // If no cuisines exist, return null
    return null;
  } catch (error) {
    console.error("Error fetching max cuisine appearance:", error);
    throw new Error("Failed to fetch max cuisine appearance.");
  }
}


// Get the number of recipes that correspond to a category and a dietary restriction
//  Create a button or dropdown in the frontend 
// 2.1.9
export async function getRecipeCountsNestedAggregation(
  userId: number
): Promise<{ categoryRestriction: string; recipesNum: number }[]> {
  try {
    // Execute the nested aggregation query
    const { rows } = await sql<{ category_name: string; restriction_name: string; recipes_num: number }>`
      SELECT 
        cat.name AS category_name,
        dr.name AS restriction_name,
        COUNT(r.id) AS recipes_num
      FROM recipes r
      JOIN recipe_categories rc ON r.id = rc.recipe_id
      JOIN categories cat ON rc.category_id = cat.id
      JOIN recipe_dietary_restrictions rdr ON r.id = rdr.recipe_id
      JOIN dietary_restrictions dr ON rdr.dietary_id = dr.id
      WHERE r.user_id = ${userId}
      GROUP BY cat.name, dr.name
      HAVING COUNT(r.id) >= ALL (
        SELECT COUNT(r2.id)
        FROM recipes r2
        JOIN recipe_categories rc2 ON r2.id = rc2.recipe_id
        JOIN categories cat2 ON rc2.category_id = cat2.id
        JOIN recipe_dietary_restrictions rdr2 ON r2.id = rdr2.recipe_id
        JOIN dietary_restrictions dr2 ON rdr2.dietary_id = dr2.id
        WHERE r2.user_id = ${userId}
        GROUP BY cat2.name, dr2.name
      );
    `;

    // Transform the result into the desired output format
    const result = rows.map((row) => ({
      categoryRestriction: `${row.category_name}-${row.restriction_name}`,
      recipesNum: row.recipes_num,
    }));

    return result;
  } catch (error) {
    console.error('Error fetching recipe counts with nested aggregation:', error);
    throw new Error('Failed to fetch recipe counts.');
  }
}

// maybe for division function 2.1.10
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

// // Search recipes based on filters
// export async function searchRecipes(
//   filters: string
// ): Promise<{ id: number; title: string }[]> {
//   try {
//     const query = `
//       SELECT id, title
//       FROM recipes
//       WHERE ${filters};
//     `;
//     const { rows } = await sql<{ id: number; title: string }>([
//       query,
//     ] as unknown as TemplateStringsArray);
//     return rows;
//   } catch (error) {
//     console.error("Error searching recipes:", error);
//     throw new Error("Failed to search recipes.");
//   }
// }

// // Project recipe attributes
// export async function projectRecipeAttributes(
//   attributes: string[]
// ): Promise<Record<string, any>[]> {
//   try {
//     const selectedAttributes = attributes.join(", ");
//     const query = `
//       SELECT ${selectedAttributes}
//       FROM recipes;
//     `;
//     const { rows } = await sql<Record<string, any>>([
//       query,
//     ] as unknown as TemplateStringsArray);
//     return rows;
//   } catch (error) {
//     console.error("Error projecting attributes:", error);
//     throw new Error("Failed to project attributes.");
//   }
// }

// // Join recipes and categories
// export async function joinRecipesAndCategories(
//   categoryId: number
// ): Promise<{ recipe: string; category: string }[]> {
//   try {
//     const { rows } = await sql<{ recipe: string; category: string }>`
//       SELECT r.title AS recipe, c.name AS category
//       FROM recipes r
//       JOIN recipe_categories rc ON r.id = rc.recipe_id
//       JOIN categories c ON rc.category_id = c.id
//       WHERE c.id = ${categoryId};
//     `;
//     return rows;
//   } catch (error) {
//     console.error("Error joining recipes and categories:", error);
//     throw new Error("Failed to join recipes and categories.");
//   }
// }

// Get recipes grouped by cuisine
// export async function getRecipesGroupedByCuisine(): Promise<
//   { cuisine: string; recipe_count: number }[]
// > {
//   try {
//     const { rows } = await sql<{ cuisine: string; recipe_count: number }>`
//       SELECT cu.name AS cuisine, COUNT(r.id) AS recipe_count
//       FROM cuisines cu
//       LEFT JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
//       LEFT JOIN recipes r ON rc.recipe_id = r.id
//       GROUP BY cu.name
//       ORDER BY recipe_count DESC;
//     `;
//     return rows;
//   } catch (error) {
//     console.error("Error fetching recipes grouped by cuisine:", error);
//     throw new Error("Failed to fetch recipes grouped by cuisine.");
//   }
// }

// // Get popular cuisines with minimum popularity
// // ?????
// export async function getPopularCuisines(
//   minPopularity: number
// ): Promise<{ cuisine: string; average_popularity: number }[]> {
//   try {
//     const { rows } = await sql<{ cuisine: string; average_popularity: number }>`
//       SELECT cu.name AS cuisine, AVG(r.popularity) AS average_popularity
//       FROM cuisines cu
//       JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
//       JOIN recipes r ON rc.recipe_id = r.id
//       GROUP BY cu.name
//       HAVING AVG(r.popularity) > ${minPopularity}
//       ORDER BY average_popularity DESC;
//     `;
//     return rows;
//   } catch (error) {
//     console.error("Error fetching popular cuisines:", error);
//     throw new Error("Failed to fetch popular cuisines.");
//   }
// }

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

// Don't touch below
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

// for selecting options, we need this
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

// for selecting options, we need this
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

// for selecting options, we need this
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

export async function saveRecipeDetails(
  recipeId: number,
  recipeDetails: {
    category: string[];
    cuisines: string[];
    dietaryRestrictions: string[];
    ingredients: {
      name: string;
      allergens: string[];
      storage_temp?: number | null;
      shelf_life?: number | null;
    }[];
    steps: string[];
    nutritionFacts?: { calories: number; proteins: number; fats: number };
  }
): Promise<void> {
  const {
    category: recipeCategories,
    cuisines: recipeCuisines,
    dietaryRestrictions: recipeDietaryRestrictions,
    ingredients,
    steps,
    nutritionFacts,
  } = recipeDetails;

  try {
    // Insert categories
    for (const catName of recipeCategories) {
      await sql`
        INSERT INTO recipe_categories (recipe_id, category_id)
        SELECT ${recipeId}, id FROM categories WHERE name = ${catName}
        ON CONFLICT (recipe_id, category_id) DO NOTHING;
      `;
    }

    // Insert cuisines
    for (const cuisineName of recipeCuisines) {
      await sql`
        INSERT INTO recipe_cuisines (recipe_id, cuisine_id)
        SELECT ${recipeId}, id FROM cuisines WHERE name = ${cuisineName}
        ON CONFLICT (recipe_id, cuisine_id) DO NOTHING;
      `;
    }

    // Insert dietary restrictions
    for (const restrictionName of recipeDietaryRestrictions) {
      await sql`
        INSERT INTO recipe_dietary_restrictions (recipe_id, dietary_id)
        SELECT ${recipeId}, id FROM dietary_restrictions WHERE name = ${restrictionName}
        ON CONFLICT (recipe_id, dietary_id) DO NOTHING;
      `;
    }

    // Insert ingredients and allergens
    for (const ingredient of ingredients) {
      const ingredientResult = await sql`
        INSERT INTO ingredients (name, storage_temp)
        VALUES (${ingredient.name}, ${ingredient.storage_temp})
        ON CONFLICT (name) DO UPDATE SET storage_temp = EXCLUDED.storage_temp
        RETURNING id;
      `;

      const ingredientId = ingredientResult.rows[0]?.id;
      if (!ingredientId) continue;

      await sql`
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id)
        VALUES (${recipeId}, ${ingredientId})
        ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;
      `;

      if (
        ingredient.shelf_life !== undefined &&
        ingredient.shelf_life !== null
      ) {
        await sql`
          INSERT INTO perishable_ingredients (id, shelf_life)
          VALUES (${ingredientId}, ${ingredient.shelf_life})
          ON CONFLICT (id) DO UPDATE SET shelf_life = EXCLUDED.shelf_life;
        `;
      }

      for (const allergenName of ingredient.allergens) {
        await sql`
          INSERT INTO allergens (name)
          VALUES (${allergenName})
          ON CONFLICT (name) DO NOTHING;
        `;

        await sql`
          INSERT INTO ingredient_allergens (ingredient_id, allergen_id)
          SELECT ${ingredientId}, id FROM allergens WHERE name = ${allergenName}
          ON CONFLICT (ingredient_id, allergen_id) DO NOTHING;
        `;
      }
    }

    // Insert recipe steps
    for (const [index, step] of steps.entries()) {
      await sql`
        INSERT INTO recipe_steps (recipe_id, step_num, description)
        VALUES (${recipeId}, ${index + 1}, ${step})
        ON CONFLICT (recipe_id, step_num) DO UPDATE SET description = EXCLUDED.description;
      `;
    }

    // Insert nutrition facts
    if (nutritionFacts) {
      const { calories, proteins, fats } = nutritionFacts;
      await sql`
        INSERT INTO nutrition_facts (recipe_id, calories, proteins, fats)
        VALUES (${recipeId}, ${calories}, ${proteins}, ${fats})
        ON CONFLICT (recipe_id) DO UPDATE
        SET calories = EXCLUDED.calories,
            proteins = EXCLUDED.proteins,
            fats = EXCLUDED.fats;
      `;
    }
  } catch (error) {
    console.error("Error saving recipe details:", error);
    throw new Error("Failed to save recipe details.");
  }
}
