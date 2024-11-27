import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { Recipe } from "@/lib/definitions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const recipeSchema = z.array(
  z.object({
    title: z.string(),
    description: z.string(),
    cooking_time: z.number(),
  })
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredients = searchParams.get("ingredients")?.split(",").map((ing) => ing.trim()) || [];

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "Ingredients are required" },
      { status: 400 }
    );
  }

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Please respond with a JSON array format. Example structure:
          [
            { "title": "Recipe Name", "overview": "Description", "cooking_time": "Cooking Time", "ingredients": ["Ingredient1", "Ingredient2"] }
          ]
          Based on the ingredients: ${ingredients.join(", ")}, recommend 3 recipes.`,
        },
      ],
      response_format: zodResponseFormat(recipeSchema, "recipe_recommendations"),
      temperature: 0.7,
      max_tokens: 500,
    });

    const recommendations: Recipe[] = completion.choices[0].message.parsed;

    const recipes = recommendations.map((recipe: Recipe, index: number) => ({
      id: `recipe-${index + 1}`,
      title: recipe.title,
      description: recipe.description,
      cooking_time: recipe.cookingTime,
    }));

    return NextResponse.json({ recipes }, { status: 200 });
  } catch (error) {
    console.error("Error generating recipes:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
