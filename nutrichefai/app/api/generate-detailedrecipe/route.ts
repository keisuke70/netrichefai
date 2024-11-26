import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sql } from "@vercel/postgres";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    // Fetch basic recipe info
    const recipeResult = await sql`SELECT * FROM recipes WHERE id = ${recipeId};`;
    const recipe = recipeResult.rows[0];

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Use ChatGPT to generate detailed recipe information
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Please respond in a JSON format with the following structure:
          {
            "category": ["Main Dish", "Side Dish"],
            "cuisines": ["American", "Italian"],
            "dietaryRestrictions": ["Vegetarian", "Gluten-Free"],
            "ingredients": [
              { "name": "Ingredient1", "allergens": ["Allergen1", "Allergen2"] },
              { "name": "Ingredient2", "allergens": [] }
            ],
            "steps": ["Step 1", "Step 2", "Step 3"]
          }
            
          Provide detailed information for the recipe titled '${recipe.title}'. Include:
          - Category (choose from: Main Dish, Side Dish, Salad, Soup, Noodle, Grilled or Roasted, Fried, Dessert, Snack, Bread),
          - Cuisines (choose from: American, Japanese, Korean, Chinese, Indian, Vietnamese, Italian, French, Mexican, Spanish, Thai, Greek, Turkish, Russian, German, Brazilian, Middle Eastern, African, British),
          - Dietary Restrictions (choose from: Vegetarian, Vegan, Gluten-Free, Low-Calorie, Low-Fat, Low-Carb, High-Protein, Kosher, Halal, Lactose-Free, Nut-Free, Low-Sodium),
          - Ingredients with potential allergens,
          - Step-by-step instructions.
          Make sure the response follows the exact JSON structure as shown above.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });      

    // Parse detailed info from ChatGPT response
    let detailedInfo;
    try {
      console.log("ChatGPT API Response:", completion.choices[0].message.content);
      detailedInfo = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error("Failed to parse JSON response from ChatGPT:", e);
      return NextResponse.json(
        { error: "ChatGPT response is not valid JSON" },
        { status: 500 }
      );
    }   
    const { category, cuisines, dietaryRestrictions, ingredients, steps } = detailedInfo;

    /*
    // Insert categories
    await Promise.all(
      (category || []).map(async (cat: string) => {
        await sql`
          INSERT INTO recipe_categories (recipe_id, category_id)
          SELECT ${recipeId}, id FROM categories WHERE name = ${cat}
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    // Insert cuisines
    await Promise.all(
      (cuisines || []).map(async (cuisine: string) => {
        await sql`
          INSERT INTO recipe_cuisines (recipe_id, cuisine_id)
          SELECT ${recipeId}, id FROM cuisines WHERE name = ${cuisine}
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    // Insert dietary restrictions
    await Promise.all(
      (dietaryRestrictions || []).map(async (restriction: string) => {
        await sql`
          INSERT INTO recipe_dietary_restrictions (recipe_id, dietary_id)
          SELECT ${recipeId}, id FROM dietary_restrictions WHERE name = ${restriction}
          ON CONFLICT DO NOTHING;
        `;
      })
    );

    // Insert ingredients and allergens
    await Promise.all(
      (ingredients || []).map(async (ingredient: any) => {
        const ingredientResult = await sql`
          INSERT INTO ingredients (name, storage_temp)
          VALUES (${ingredient.name}, ${ingredient.storage_temp})
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

        // Insert allergens for the ingredient
        await Promise.all(
          (ingredient.allergens || []).map(async (allergen: string) => {
            await sql`
              INSERT INTO ingredient_allergens (ingredient_id, allergen_id)
              SELECT ${ingredientId}, id FROM allergens WHERE name = ${allergen}
              ON CONFLICT DO NOTHING;
            `;
          })
        );
      })
    );

    // Insert recipe steps
    await Promise.all(
      (steps || []).map(async (step: string, index: number) => {
        await sql`
          INSERT INTO recipe_steps (recipe_id, step_num, description)
          VALUES (${recipeId}, ${index + 1}, ${step})
          ON CONFLICT DO NOTHING;
        `;
      })
    );
    */

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
