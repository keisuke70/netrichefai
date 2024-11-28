"use client";

import { useState, useEffect } from "react";
import { fetchFilteredRecipes, updateRecipeTitle } from "@/lib/actions";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { Recipe } from "@/lib/definitions";
import {
  fetchUserCuisineNames,
  fetchUniqueCategoryNamesByUserId,
  fetchUserDietaryRestrictionNames,
} from "@/lib/actions";

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

  // Fetch recipes whenever filters change
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);

      const fetchRecipes = async () => {
        setIsLoading(true);
        try {
          const fetchedRecipes = await fetchFilteredRecipes(
            userId,
            categoryFilter !== "all" ? categoryFilter : undefined,
            cuisineFilter !== "all" ? cuisineFilter : undefined,
            dietaryFilter !== "all" ? dietaryFilter : undefined
          );
          setRecipes(fetchedRecipes);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRecipes();
    }
  }, [status, session, cuisineFilter, categoryFilter, dietaryFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [cuisineFilter, categoryFilter, dietaryFilter]);

  const totalPages = Math.ceil(recipes.length / recipesPerPage);

  // Get current recipes for the page
  const startIndex = (page - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const currentRecipes = recipes.slice(startIndex, endIndex);

  const clearHistory = () => {
    setRecipes([]);
  };

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

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Cuisine" />
            </SelectTrigger>
            <SelectContent>
              {cuisineOptions.map((cuisine, index) => (
                <SelectItem
                  key={index}
                  value={cuisine === "All Cuisines" ? "all" : cuisine}
                >
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category, index) => (
                <SelectItem
                  key={index}
                  value={category === "All Categories" ? "all" : category}
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dietaryFilter} onValueChange={setDietaryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Dietary Restrictions" />
            </SelectTrigger>
            <SelectContent>
              {dietaryOptions.map((diet, index) => (
                <SelectItem
                  key={index}
                  value={diet === "All Diets" ? "all" : diet}
                >
                  {diet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div>Loading recipes...</div>
      ) : (
        <div>
          {recipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentRecipes.map((recipe) => (
                  <Card key={recipe.id} className="flex flex-col">
                    <CardHeader>
                      {editingId === recipe.id ? (
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="border rounded p-2 mr-2 flex-grow"
                          />
                          <button
                            onClick={() =>
                              handleEditClick(recipe.id!, recipe.title)
                            }
                            className="text-blue-500 hover:underline"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CardTitle>{recipe.title}</CardTitle>
                          <button
                            onClick={() =>
                              handleEditClick(recipe.id!, recipe.title)
                            }
                            className="ml-2 text-blue-500 hover:underline text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-gray-600 mb-2">
                        {recipe.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{recipe.cooking_time} mins</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <a href={`/recipe/${recipe.id}`}>View Recipe</a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4">
                <Button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div>No recipes found.</div>
          )}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="mt-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Clear History</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Recipe History</DialogTitle>
                <DialogDescription>
                  Are you sure you want to clear your entire recipe history?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={clearHistory}>
                  Clear History
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
