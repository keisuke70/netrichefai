import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sql } from "@vercel/postgres";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredients = searchParams.get("ingredients")?.split(",") || [];
  console.log("Received ingredients:", ingredients);

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "Ingredients are required" },
      { status: 400 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Please respond with a JSON array format. Here’s an example structure:
          [
            { "title": "Recipe Name", "overview": "Description", "cooking_time": "Cooking Time", "ingredients": ["Ingredient1", "Ingredient2"] }
          ]
          Based on the ingredients: ${ingredients.join(", ")}, recommend 3 recipes.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    console.log("GPT response content:", completion.choices[0].message.content);

    let responseText = completion.choices[0].message.content.trim();

    if (responseText.startsWith("```json")) {
      responseText = responseText.slice(7, -3).trim(); // ```json ... ``` 제거
    } else if (responseText.startsWith("```")) {
      responseText = responseText.slice(3, -3).trim(); // ``` ... ``` 제거
    }
  
    const recommendations = JSON.parse(responseText);
    console.log("Parsed recommendations:", recommendations);

    const recipes = recommendations.map((recipe: any) => ({
      id: recipe.id || Math.random().toString(36).substr(2, 9), 
      title: recipe.title,
      description: recipe.overview, 
      cooking_time: recipe.cooking_time,
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
