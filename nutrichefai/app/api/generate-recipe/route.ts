import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

// Set up the OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is correctly set in your environment variables
});

// Define the Zod schema for the API response
const recipeSchema = z.array(
  z.object({
    title: z.string(),
    overview: z.string(),
    cooking_time: z.number(),
    ingredients: z.array(z.string()),
  })
);

// Infer the type from the Zod schema
type Recipe = z.infer<typeof recipeSchema>[number];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredients = searchParams.get("ingredients")?.split(",").map((ing) => ing.trim()) || [];

  console.log("Received ingredients:", ingredients);

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "Ingredients are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch a completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Please respond with a JSON array in the following structure:
          [
            { "title": "Recipe Name", "overview": "Description", "cooking_time": 30 }
          ]
          Based on the ingredients: ${ingredients.join(", ")}, recommend 3 recipes.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Parse the content of the completion
    const rawContent = completion.choices[0].message?.content;

    if (!rawContent) {
      throw new Error("No content returned from OpenAI");
    }

    console.log("Raw content from OpenAI:", rawContent);

    // Validate the content with Zod
    const recommendations = recipeSchema.parse(JSON.parse(rawContent));

    // Map the recipes to include unique IDs
    const recipes = recommendations.map((recipe, index) => ({
      id: `recipe-${index + 1}`,
      title: recipe.title,
      description: recipe.overview,
      cooking_time: recipe.cooking_time,
      ingredients: recipe.ingredients,
    }));

    console.log("Final recipes:", recipes);

    return NextResponse.json({ recipes }, { status: 200 });
  } catch (error) {
    console.error("Error generating recipes:", error);
    return NextResponse.json(
      { error: "Failed to generate recipes" },
      { status: 500 }
    );
  }
}
