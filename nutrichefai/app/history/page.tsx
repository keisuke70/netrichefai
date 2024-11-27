"use client";

import { useState, useEffect } from "react";
import { fetchUserRecipes } from "@/lib/actions";
import { Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Import placeholder data
import {
  categories,
  cuisines,
  dietaryRestrictions,
} from "@/lib/placeholder-data";

export default function RecipeHistory() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dietaryFilter, setDietaryFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.id) {
      const userId = parseInt(session.user.id, 10);

      const fetchRecipes = async () => {
        setIsLoading(true);
        try {
          const { recipes, totalCount } = await fetchUserRecipes(
            userId!,
            page,
            5
          );
          setRecipes(recipes);
          setTotalCount(totalCount);
          console.log(recipes);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRecipes();
    }
  }, [status, session, page]);

  const totalPages = Math.ceil(totalCount / 5);

  const clearHistory = () => {
    setRecipes([]);
  };

  // Build lists for Select options
  const cuisineOptions = ["All Cuisines", ...cuisines.map((c) => c.name)];
  const categoryOptions = ["All Categories", ...categories.map((c) => c.name)];
  const dietaryOptions = [
    "All Diets",
    ...dietaryRestrictions.map((d) => d.name),
  ];

  // const filteredRecipes = recipes.filter(
  //   (recipe) =>
  //     recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
  //     (cuisineFilter === "all" || recipe.cuisines.includes(cuisineFilter)) &&
  //     (categoryFilter === "all" || recipe.category.includes(categoryFilter)) &&
  //     (dietaryFilter === "all" ||
  //       recipe.dietaryRestrictions.includes(dietaryFilter))
  // );

  const filteredRecipes = recipes; // No filtering for now

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recipe History</h1>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={() => setSearchTerm("")}>Clear</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Cuisine Filter */}
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

          {/* Category Filter */}
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

          {/* Dietary Restrictions Filter */}
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
          {filteredRecipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredRecipes.map((recipe) => (
                  <Card key={recipe.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{recipe.title}</CardTitle>
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
