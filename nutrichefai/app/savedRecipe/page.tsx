"use client";

import { useEffect, useState } from "react";
import { fetchDetailedRecipe, DetailedRecipe } from "@/lib/actions"; 
import { useSearchParams } from "next/navigation";

export default function RecipeDetailPage() {
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id"); // Get recipe ID from query parameters

  const [detailedRecipe, setDetailedRecipe] = useState<DetailedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError("Recipe ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchDetailedRecipe(recipeId);
        setDetailedRecipe(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load the recipe details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

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
        <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
        <ul className="list-disc list-inside">
          {detailedRecipe.ingredients.map((ingredient, index) => (
            <li key={index}>
              {ingredient.name}
              {ingredient.allergens.length > 0 && (
                <span className="text-red-500">
                  {" "}
                  (Allergens: {ingredient.allergens.join(", ")})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside">
          {detailedRecipe.steps.map((step, index) => (
            <li key={index} className="mb-2">
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
