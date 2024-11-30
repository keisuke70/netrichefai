"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartIcon as ChartPieIcon, XIcon } from "lucide-react";
import { getRecipesForAllDietaryRestrictions } from "@/lib/actions";

interface Recipe {
  recipeId: number;
  recipeTitle: string;
}

interface RecipesForAllDietaryRestrictionsProps {
  userId: number; // Receive userId as a prop
}

export default function RecipesForAllDietaryRestrictions({
  userId,
}: RecipesForAllDietaryRestrictionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecipesData = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getRecipesForAllDietaryRestrictions(userId);
      setRecipes(data);
      setIsOpen(true);
    } catch (error) {
      console.error(
        "Error fetching recipes for all dietary restrictions:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <Button
        onClick={fetchRecipesData}
        variant="secondary"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-md"
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <ChartPieIcon className="h-5 w-5" />
        )}
        <span>
          {isOpen ? "Close Recipes" : "Recipes for All Dietary Restrictions"}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-[320px]">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Recipes for All Dietary Restrictions</CardTitle>
              <CardDescription>
                Recipes that satisfy all dietary restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading recipes...
                </div>
              ) : recipes && recipes.length > 0 ? (
                <ul className="space-y-2">
                  {recipes.map((recipe) => (
                    <li
                      key={recipe.recipeId}
                      className="flex justify-between border-b py-2"
                    >
                      <span className="font-medium">{recipe.recipeTitle}</span>
                      <span className="text-sm text-muted-foreground">
                        ID: {recipe.recipeId}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No recipes available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
