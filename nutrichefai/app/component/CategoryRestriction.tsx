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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChartIcon as ChartPieIcon, XIcon } from "lucide-react";
import { getRecipeCountsNestedAggregation } from "@/lib/actions";

interface CategoryRestrictionProps {
  userId: number;
}

interface RecipeCount {
  categoryRestriction: string;
  recipesNum: number;
}

export default function CategoryRestriction({
  userId,
}: CategoryRestrictionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeData, setRecipeData] = useState<RecipeCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecipeCounts = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getRecipeCountsNestedAggregation(userId);
      setRecipeData(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching recipe counts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <Button
        onClick={fetchRecipeCounts}
        variant="secondary"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-md"
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <ChartPieIcon className="h-5 w-5" />
        )}
        <span>{isOpen ? "Close Statistics" : "Category-Restriction"}</span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-[320px]">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Recipe Distribution</CardTitle>
              <CardDescription>
                Recipes per category and dietary restriction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading statistics...
                </div>
              ) : recipeData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category-Restriction</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipeData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.categoryRestriction}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.recipesNum}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
