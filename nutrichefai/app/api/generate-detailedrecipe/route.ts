import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  Recipe,
  Category,
  Cuisine,
  Ingredient,
  Allergen,
  DietaryRestriction
} from "@/lib/definitions";
import { Restriction } from "next/dist/lib/metadata/types/metadata-types";


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
    })
  ),
  steps: z.array(z.string()),
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
    const recipeResult = await sql`SELECT * FROM recipes WHERE id = ${recipeId};`;
    const recipe = recipeResult.rows[0];

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Provide detailed information for the recipe titled '${recipe.title}' in the following structured JSON format:
          {
            "category": ["Main Dish", "Side Dish"],
            "cuisines": ["American", "Italian"],
            "dietaryRestrictions": ["Vegetarian", "Gluten-Free"],
            "ingredients": [
              { "name": "Ingredient1", "allergens": ["Allergen1", "Allergen2"] },
              { "name": "Ingredient2", "allergens": [] }
            ],
            "steps": ["Step 1", "Step 2", "Step 3"]
          }`,
        },
      ],
      response_format: zodResponseFormat(detailedRecipeSchema, "detailed_recipe"),
    });

    const detailedInfo = completion.choices[0].message.parsed;

    const { category, cuisines, dietaryRestrictions, ingredients, steps } = detailedInfo;

    // Insert categories
    await Promise.all(
      category.map(async (cat: Category) => {
        await sql`
          INSERT INTO recipe_categories (recipe_id, category_id)
          SELECT ${recipeId}, id FROM categories WHERE name = ${cat.name}
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    // Insert cuisines
    await Promise.all(
      cuisines.map(async (cuisine: Cuisine) => {
        await sql`
          INSERT INTO recipe_cuisines (recipe_id, cuisine_id)
          SELECT ${recipeId}, id FROM cuisines WHERE name = ${cuisine.name}
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    // Insert dietary restrictions
    await Promise.all(
      dietaryRestrictions.map(async (restriction: DietaryRestriction) => {
        await sql`
          INSERT INTO recipe_dietary_restrictions (recipe_id, dietary_id)
          SELECT ${recipeId}, id FROM dietary_restrictions WHERE name = ${restriction.name}
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    // Insert ingredients and allergens
    await Promise.all(
      (detailedInfo.ingredients as Array<Ingredient & { allergens: string[] }>).map(
        async (ingredient: Ingredient & { allergens: string[] }) => {
          const ingredientResult = await sql`
            INSERT INTO ingredients (name)
            VALUES (${ingredient.name})
            ON CONFLICT (name) DO NOTHING
            RETURNING id;
          `;
    
          const ingredientId = ingredientResult.rows[0]?.id;
          if (!ingredientId) return;
    
          await sql`
            INSERT INTO recipe_ingredients (recipe_id, ingredient_id)
            VALUES (${recipeId}, ${ingredientId})
            ON CONFLICT DO NOTHING;
          `;
    
          await Promise.all(
            ingredient.allergens.map(async (allergen: string) => {
              await sql`
                INSERT INTO ingredient_allergens (ingredient_id, allergen_id)
                SELECT ${ingredientId}, id FROM allergens WHERE name = ${allergen}
                ON CONFLICT DO NOTHING;
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
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    return NextResponse.json(
      { ...recipe, ...detailedInfo },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating detailed recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate detailed recipe" },
      { status: 500 }
    );
  }
}
