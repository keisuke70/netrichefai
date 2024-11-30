import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { Recipe } from "@/lib/definitions";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const recipeSchema = z.object({
  recipes: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      cooking_time: z.number(),
    })
  ),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredients =
    searchParams
      .get("ingredients")
      ?.split(",")
      .map((ing) => ing.trim()) || [];
  const session = await auth();
  const userId = session?.user?.id;

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  console.log("User ID:", userId);
  if (!userId) {
    return NextResponse.json(
      { error: "userid is not available" },
      { status: 400 }
    );
  }

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "Ingredients are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch recipe suggestions from OpenAI
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Please respond with a JSON object containing a "recipes" key with an array of recipes. Example structure:
          {
            "recipes": [
              { "title": "Recipe Name", "description": "Description", "cooking_time": time in min }
            ]
          }
          Based on the ingredients: ${ingredients.join(
            ", "
          )}, recommend 3 recipes.`,
        },
      ],
      response_format: zodResponseFormat(
        recipeSchema,
        "recipe_recommendations"
      ),
    });

    const parsedResponse = completion.choices[0].message.parsed;

    // Prepare recipes for insertion
    const recipes: Recipe[] = parsedResponse.recipes.map((recipe: Recipe) => ({
      user_id: userId,
      title: recipe.title,
      description: recipe.description,
      cooking_time: recipe.cooking_time,
    }));

    // Insert recipes into the database individually and append IDs to the recipe objects
    for (const recipe of recipes) {
      const insertResult = await sql`
        INSERT INTO recipes (user_id, title, description, cooking_time)
        VALUES (
          ${recipe.user_id},
          ${recipe.title},
          ${recipe.description},
          ${recipe.cooking_time}
        )
        RETURNING id;
      `;

      recipe.id = insertResult.rows[0].id;
    }

    return NextResponse.json({ recipes }, { status: 200 });
  } catch (error) {
    console.error("Error generating recipes:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
