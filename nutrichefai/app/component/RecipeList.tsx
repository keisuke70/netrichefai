// ../component/RecipeList.tsx
import React from "react";
import RecipeCard from "./RecipeCard2";
import { Recipe } from "@/lib/definitions";

interface RecipeListProps {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>; // Accept setRecipes
  editingId: number | null;
  editedTitle: string;
  setEditedTitle: React.Dispatch<React.SetStateAction<string>>;
  handleEditClick: (recipeId: number, currentTitle: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  editingId,
  setRecipes,
  editedTitle,
  setEditedTitle,
  handleEditClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          setRecipes={setRecipes}
          editingId={editingId}
          editedTitle={editedTitle}
          setEditedTitle={setEditedTitle}
          handleEditClick={handleEditClick}
        />
      ))}
    </div>
  );
};

export default RecipeList;
