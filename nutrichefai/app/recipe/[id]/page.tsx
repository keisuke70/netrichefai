"use client";

import { useEffect, useState } from "react";
import { Recipe } from "@/lib/definitions";
import { useParams } from "next/navigation";
import {
  Clock,
  Utensils,
  Globe,
  Leaf,
  List,
  ChefHat,
  Info,
} from "lucide-react";
import { fetchCustomNutritionFacts } from "@/lib/actions";

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
};

export default function RecipeDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const [detailedRecipe, setDetailedRecipe] = useState<DetailedRecipe | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCalories, setShowCalories] = useState(true);
  const [showProteins, setShowProteins] = useState(true);
  const [showFats, setShowFats] = useState(true);
  const [nutritionFacts, setNutritionFacts] = useState<Record<
    string,
    number | null
  > | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    const fetchNutritionFacts = async () => {
      try {
        const facts = await fetchCustomNutritionFacts(
          parseInt(id, 10),
          showCalories,
          showProteins,
          showFats
        );
        console.log(facts);
        setNutritionFacts(facts);
      } catch (error) {
        console.error("Error fetching nutrition facts:", error);
      }
    };
    fetchNutritionFacts();
  }, [id, showCalories, showProteins, showFats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!detailedRecipe) {
    return (
      <div className="flex items-center justify-center h-screen">
        Recipe not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h1 className="text-4xl font-bold mb-2">{detailedRecipe.title}</h1>
          <p className="text-lg opacity-90">{detailedRecipe.description}</p>
        </div>

        <div className="p-6 space-y-8">
          <RecipeSection
            icon={<Utensils className="w-6 h-6" />}
            title="Categories"
          >
            {detailedRecipe.category.join(", ")}
          </RecipeSection>

          <RecipeSection icon={<Globe className="w-6 h-6" />} title="Cuisines">
            {detailedRecipe.cuisines.join(", ")}
          </RecipeSection>

          <RecipeSection
            icon={<Leaf className="w-6 h-6" />}
            title="Dietary Restrictions"
          >
            {detailedRecipe.dietaryRestrictions.join(", ") || "None"}
          </RecipeSection>

          <RecipeSection
            icon={<Clock className="w-6 h-6" />}
            title="Cooking Time"
          >
            {detailedRecipe.cooking_time} minutes
          </RecipeSection>

          <RecipeSection
            icon={<List className="w-6 h-6" />}
            title="Ingredients"
          >
            <ul className="list-disc list-inside space-y-2">
              {detailedRecipe.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.name}
                  {ingredient.allergens && ingredient.allergens.length > 0 && (
                    <span className="text-red-500 ml-2 text-sm">
                      (Allergens: {ingredient.allergens.join(", ")})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </RecipeSection>

          <RecipeSection
            icon={<ChefHat className="w-6 h-6" />}
            title="Instructions"
          >
            <ol className="list-decimal list-inside space-y-4">
              {detailedRecipe.steps.map((step, index) => (
                <li key={index} className="pl-2">
                  <span className="font-medium">Step {index + 1}:</span> {step}
                </li>
              ))}
            </ol>
          </RecipeSection>

          {/* Selection Controls for Nutrition Facts */}
          <RecipeSection
            icon={<Info className="w-6 h-6" />}
            title="Select Nutrition Facts You Want To  See"
          >
            <div className="ml-8">
              <label className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={showCalories}
                  onChange={(e) => setShowCalories(e.target.checked)}
                />
                <span className="ml-2">Calories</span>
              </label>
              <label className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={showProteins}
                  onChange={(e) => setShowProteins(e.target.checked)}
                />
                <span className="ml-2">Proteins</span>
              </label>
              <label className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={showFats}
                  onChange={(e) => setShowFats(e.target.checked)}
                />
                <span className="ml-2">Fats</span>
              </label>
            </div>
          </RecipeSection>

          {/* Display Nutrition Facts */}
          {nutritionFacts && Object.keys(nutritionFacts).length > 0 && (
            <RecipeSection
              icon={<Info className="w-6 h-6" />}
              title="Nutrition Facts"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                {nutritionFacts.calories !== undefined && (
                  <NutritionFact
                    label="Calories"
                    value={nutritionFacts.calories as number}
                    unit=""
                  />
                )}
                {nutritionFacts.proteins !== undefined && (
                  <NutritionFact
                    label="Proteins"
                    value={nutritionFacts.proteins as number}
                    unit="g"
                  />
                )}
                {nutritionFacts.fats !== undefined && (
                  <NutritionFact
                    label="Fats"
                    value={nutritionFacts.fats as number}
                    unit="g"
                  />
                )}
              </div>
            </RecipeSection>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h2>
      <div className="ml-8">{children}</div>
    </div>
  );
}

function NutritionFact({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="text-lg font-semibold">
        {value}
        {unit}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
