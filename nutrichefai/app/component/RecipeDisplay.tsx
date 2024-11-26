import { Recipe } from "../../lib/definitions";
import RecipeCard from "./RecipeCard";

interface RecipeDisplayProps {
  recipes: Recipe[];
}

const RecipeDisplay = ({ recipes }: RecipeDisplayProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Generated Recipes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
};

export default RecipeDisplay;
