"use client";

import { useState, useEffect } from "react";
import {
  fetchFilteredRecipes,
  fetchRecipesByIngredient,
  updateRecipeTitle,
} from "@/lib/actions";
import { useSession } from "next-auth/react";
import { Recipe } from "@/lib/definitions";
import {
  fetchUserCuisineNames,
  fetchUniqueCategoryNamesByUserId,
  fetchUserDietaryRestrictionNames,
} from "@/lib/actions";
import Filters from "../component/Filters";
import RecipeList from "../component/RecipeList";
import PaginationControls from "../component/PaginationControls";

export default function RecipeHistory() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [cuisineOptions, setCuisineOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const recipesPerPage = 6;

  // Fetch filter options when the component mounts
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);

      const fetchFilters = async () => {
        try {
          const cuisines = await fetchUserCuisineNames(userId);
          const categories = await fetchUniqueCategoryNamesByUserId(userId);
          const dietaryRestrictions = await fetchUserDietaryRestrictionNames(
            userId
          );

          setCuisineOptions(["All Cuisines", ...cuisines]);
          setCategoryOptions(["All Categories", ...categories]);
          setDietaryOptions(["All Diets", ...dietaryRestrictions]);
        } catch (error) {
          console.error("Failed to fetch filter data:", error);
        }
      };

      fetchFilters();
    }
  }, [status, session]);

  // Fetch recipes whenever filters or search term change
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);

      const fetchRecipes = async () => {
        setIsLoading(true);
        try {
          let fetchedRecipes: Recipe[] = [];
          if (searchTerm.trim() !== "") {
            // Call fetchRecipesByIngredient if searchTerm is not empty
            fetchedRecipes = await fetchRecipesByIngredient(searchTerm.trim());
          } else {
            fetchedRecipes = await fetchFilteredRecipes(
              userId,
              categoryFilter !== "all" ? categoryFilter : undefined,
              cuisineFilter !== "all" ? cuisineFilter : undefined,
              dietaryFilter !== "all" ? dietaryFilter : undefined
            );
          }

          setRecipes(fetchedRecipes || []);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRecipes();
    }
  }, [
    status,
    session,
    cuisineFilter,
    categoryFilter,
    dietaryFilter,
    searchTerm,
  ]);

  // Reset page to 1 when filters or search term change
  useEffect(() => {
    setPage(1);
  }, [cuisineFilter, categoryFilter, dietaryFilter, searchTerm]);

  const totalPages = Math.ceil(recipes.length / recipesPerPage);

  // Get current recipes for the page
  const startIndex = (page - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const currentRecipes = recipes.slice(startIndex, endIndex);

  const handleEditClick = (recipeId: number, currentTitle: string) => {
    if (editingId === recipeId) {
      // Save the new title
      updateRecipeTitle(recipeId, editedTitle)
        .then(() => {
          setRecipes((prevRecipes) =>
            prevRecipes.map((recipe) =>
              recipe.id === recipeId
                ? { ...recipe, title: editedTitle }
                : recipe
            )
          );
          alert("Recipe title updated successfully!");
        })
        .catch((error) => {
          console.error("Error updating recipe title:", error);
          alert("Failed to update recipe title.");
        })
        .finally(() => {
          setEditingId(null);
        });
    } else {
      // Enter editing mode
      setEditingId(recipeId);
      setEditedTitle(currentTitle);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recipe History</h1>

      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cuisineFilter={cuisineFilter}
        setCuisineFilter={setCuisineFilter}
        cuisineOptions={cuisineOptions}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categoryOptions={categoryOptions}
        dietaryFilter={dietaryFilter}
        setDietaryFilter={setDietaryFilter}
        dietaryOptions={dietaryOptions}
      />

      {isLoading ? (
        <div>Loading recipes...</div>
      ) : (
        <div>
          {recipes.length > 0 ? (
            <>
              <RecipeList
                recipes={currentRecipes}
                setRecipes={setRecipes}
                editingId={editingId}
                editedTitle={editedTitle}
                setEditedTitle={setEditedTitle}
                handleEditClick={handleEditClick}
              />

              <PaginationControls
                page={page}
                setPage={setPage}
                totalPages={totalPages}
              />
            </>
          ) : (
            <div>No recipes found.</div>
          )}
        </div>
      )}
    </div>
  );
}
