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
import { maxCuisineAppearance } from "@/lib/actions"; 

interface CuisineCount {
  cuisine: string;
  count: number;
}

interface MostFrequentCuisineProps {
  userId: number;
}

export default function MostFrequentCuisine({
  userId,
}: MostFrequentCuisineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeData, setRecipeData] = useState<CuisineCount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCuisineData = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await maxCuisineAppearance(userId);
      setRecipeData(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching most frequent cuisine:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <Button
        onClick={fetchCuisineData}
        variant="secondary"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-md"
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <ChartPieIcon className="h-5 w-5" />
        )}
        <span>{isOpen ? "Close Statistics" : "Most Frequent Cuisine"}</span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-[320px]">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Most Frequent Cuisine</CardTitle>
              <CardDescription>
                The cuisine with the highest recipe count
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading statistics...
                </div>
              ) : recipeData ? (
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    Cuisine:{" "}
                    <span className="font-semibold">{recipeData.cuisine}</span>
                  </p>
                  <p className="text-lg font-medium">
                    Count:{" "}
                    <span className="font-semibold">{recipeData.count}</span>
                  </p>
                </div>
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
