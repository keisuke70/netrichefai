import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  categories,
  cuisines,
  dietaryRestrictions,
} from "@/lib/placeholder-data";
import { Recipe } from "@/lib/definitions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const detailedRecipeSchema = z.object({
  category: z.array(z.string()),
  cuisines: z.array(z.string()),
  dietaryRestrictions: z.array(z.string()),
  ingredients: z.array(
    z.object({
      name: z.string(),
      allergens: z.array(z.string()),
      storage_temp: z.number().nullable().optional(),
      shelf_life: z.number().nullable().optional(),
    })
  ),
  steps: z.array(z.string()),
  nutritionFacts: z
    .object({
      calories: z.number(),
      proteins: z.number(),
      fats: z.number(),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get("id");

  if (!recipeId) {
    return NextResponse.json(
      { error: "Recipe ID is required" },
      { status: 400 }
    );
  }

  try {
    const recipeResult = await sql`
      SELECT * FROM recipes WHERE id = ${recipeId};
    `;
    const recipe = recipeResult.rows[0] as Recipe;

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Prepare lists for the prompt
    const categoriesList = categories.map((c) => c.name).join(", ");
    const cuisinesList = cuisines.map((c) => c.name).join(", ");
    const dietaryRestrictionsList = dietaryRestrictions
      .map((d) => d.name)
      .join(", ");

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Provide detailed information for the recipe titled '${recipe.title}' in the following structured JSON format, ensuring that the "category", "cuisines", and "dietaryRestrictions" fields only include values from the provided lists.

Categories:
${categoriesList}

Cuisines:
${cuisinesList}

Dietary Restrictions:
${dietaryRestrictionsList}

Example format:
{
  "category": ["Main Dish", "Side Dish"],
  "cuisines": ["American", "Italian"],
  "dietaryRestrictions": ["Vegetarian", "Gluten-Free"],
  "ingredients": [
    { "name": "Ingredient1", "allergens": ["Allergen1", "Allergen2"], "storage_temp": 4, "shelf_life": 7 },
    { "name": "Ingredient2", "allergens": [], "storage_temp": null, "shelf_life": null }
  ],
  "steps": ["Step 1", "Step 2", "Step 3"],
  "nutritionFacts": { "calories": 200, "proteins": 10, "fats": 5 }
}`,
        },
      ],
      response_format: zodResponseFormat(
        detailedRecipeSchema,
        "detailed_recipe"
      ),
    });

    const detailedInfo = completion.choices[0].message.parsed;

    // Validate that categories, cuisines, and dietaryRestrictions are valid
    const validCategories = categories.map((c) => c.name);
    const validCuisines = cuisines.map((c) => c.name);
    const validDietaryRestrictions = dietaryRestrictions.map((d) => d.name);

    const {
      category: recipeCategories,
      cuisines: recipeCuisines,
      dietaryRestrictions: recipeDietaryRestrictions,
      ingredients,
      steps,
      nutritionFacts,
    } = detailedInfo;

    const invalidCategories = recipeCategories.filter(
      (c: string) => !validCategories.includes(c)
    );
    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: `Invalid categories: ${invalidCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const invalidCuisines = recipeCuisines.filter(
      (c: string) => !validCuisines.includes(c)
    );
    if (invalidCuisines.length > 0) {
      return NextResponse.json(
        { error: `Invalid cuisines: ${invalidCuisines.join(", ")}` },
        { status: 400 }
      );
    }

    const invalidDietaryRestrictions = recipeDietaryRestrictions.filter(
      (d: string) => !validDietaryRestrictions.includes(d)
    );
    if (invalidDietaryRestrictions.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid dietary restrictions: ${invalidDietaryRestrictions.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Insert categories
    await Promise.all(
      recipeCategories.map(async (catName: string) => {
        await sql`
          INSERT INTO recipe_categories (recipe_id, category_id)
          SELECT ${recipeId}, id FROM categories WHERE name = ${catName}
          ON CONFLICT (recipe_id, category_id) DO NOTHING;
        `;
      })
    );

    // Insert cuisines
    await Promise.all(
      recipeCuisines.map(async (cuisineName: string) => {
        await sql`
          INSERT INTO recipe_cuisines (recipe_id, cuisine_id)
          SELECT ${recipeId}, id FROM cuisines WHERE name = ${cuisineName}
          ON CONFLICT (recipe_id, cuisine_id) DO NOTHING;
        `;
      })
    );

    // Insert dietary restrictions
    await Promise.all(
      recipeDietaryRestrictions.map(async (restrictionName: string) => {
        await sql`
          INSERT INTO recipe_dietary_restrictions (recipe_id, dietary_id)
          SELECT ${recipeId}, id FROM dietary_restrictions WHERE name = ${restrictionName}
          ON CONFLICT (recipe_id, dietary_id) DO NOTHING;
        `;
      })
    );

    // Insert ingredients and allergens
    await Promise.all(
      ingredients.map(
        async (ingredient: {
          name: string;
          allergens: string[];
          storage_temp?: number | null;
          shelf_life?: number | null;
        }) => {
          const ingredientResult = await sql`
            INSERT INTO ingredients (name, storage_temp)
            VALUES (${ingredient.name}, ${ingredient.storage_temp})
            ON CONFLICT (name) DO UPDATE SET storage_temp = EXCLUDED.storage_temp
            RETURNING id;
          `;

          const ingredientId = ingredientResult.rows[0]?.id;
          if (!ingredientId) return;

          await sql`
            INSERT INTO recipe_ingredients (recipe_id, ingredient_id)
            VALUES (${recipeId}, ${ingredientId})
            ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;
          `;

          // Insert into perishable_ingredients if shelf_life is provided
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

          // Insert allergens into allergens table if not exist
          await Promise.all(
            ingredient.allergens.map(async (allergenName: string) => {
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
            })
          );
        }
      )
    );

    // Insert recipe steps
    await Promise.all(
      steps.map(async (step: string, index: number) => {
        await sql`
          INSERT INTO recipe_steps (recipe_id, step_num, description)
          VALUES (${recipeId}, ${index + 1}, ${step})
          ON CONFLICT (recipe_id, step_num) DO UPDATE SET description = EXCLUDED.description;
        `;
      })
    );
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

    return NextResponse.json({ ...recipe, ...detailedInfo }, { status: 200 });
  } catch (error) {
    console.error("Error generating detailed recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate detailed recipe" },
      { status: 500 }
    );
  }
}
