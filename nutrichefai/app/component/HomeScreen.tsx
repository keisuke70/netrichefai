"use client";

import React, { useState } from "react";
import Banner from "./Banner";
import IngredientInput from "./IngredientInput";
import IngredientList from "./IngredientList";
import RecipeDisplay from "./RecipeDisplay";
import { Button } from "@/components/ui/button";
import { Recipe } from "../../lib/definitions";


const HomeScreen = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const addIngredient = (ingredient: string) => {
    setIngredients([...ingredients, ingredient]);
    console.log("Updated ingredients:", ingredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    console.log("Generating recipe with:", ingredients);
    console.log(`/api/generate-recipe?ingredients=${ingredients.join(",")}`);

    try {
      const response = await fetch(
        `/api/generate-recipe?ingredients=${ingredients.join(",")}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }

  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Banner />
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Add Your Ingredients</h2>
          <IngredientInput addIngredient={addIngredient} />
          <IngredientList
            ingredients={ingredients}
            removeIngredient={removeIngredient}
          />
          <Button
            onClick={generateRecipe}
            className="w-full py-3 text-lg font-semibold"
            disabled={ingredients.length === 0}
          >
            Generate Recipe
          </Button>
        </div>

        {recipes.length > 0 && (
          <div className="mt-8">
            <RecipeDisplay recipes={recipes} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
