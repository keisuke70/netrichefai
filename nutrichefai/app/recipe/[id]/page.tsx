"use client";

import { useEffect, useState } from "react";
import { Recipe } from "@/lib/definitions";
import { useParams } from "next/navigation";

type DetailedRecipe = Recipe & {
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
  nutritionFacts?: {
    calories: number;
    proteins: number;
    fats: number;
  };
};

export default function RecipeDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [detailedRecipe, setDetailedRecipe] = useState<DetailedRecipe | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(id);
    const fetchDetailedRecipe = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/generate-detailedrecipe?id=${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch recipe details");
        }
        const data = await response.json();
        setDetailedRecipe(data as DetailedRecipe);
      } catch (error) {
        console.error("Error fetching detailed recipe:", error);
        setError("Failed to load recipe details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailedRecipe();
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-8">Loading recipe details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!detailedRecipe) {
    return <div className="text-center py-8">Recipe not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4">{detailedRecipe.title}</h1>
      <p className="text-lg mb-6">{detailedRecipe.description}</p>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Categories</h2>
        <p>{detailedRecipe.category.join(", ")}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cuisines</h2>
        <p>{detailedRecipe.cuisines.join(", ")}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Dietary Restrictions</h2>
        <p>{detailedRecipe.dietaryRestrictions.join(", ") || "None"}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cooking Time</h2>
        <p>{detailedRecipe.cooking_time} minutes</p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
        <ul className="list-disc list-inside">
          {detailedRecipe.ingredients.map((ingredient, index) => (
            <li key={index}>
              {ingredient.name}
              {ingredient.allergens && ingredient.allergens.length > 0 && (
                <span className="text-red-500">
                  {" "}
                  (Allergens: {ingredient.allergens.join(", ")})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside">
          {detailedRecipe.steps.map((step, index) => (
            <li key={index} className="mb-2">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {detailedRecipe.nutritionFacts && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Nutrition Facts</h2>
          <p>Calories: {detailedRecipe.nutritionFacts.calories}</p>
          <p>Proteins: {detailedRecipe.nutritionFacts.proteins}g</p>
          <p>Fats: {detailedRecipe.nutritionFacts.fats}g</p>
        </div>
      )}
    </div>
  );
}
