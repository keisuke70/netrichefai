'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button'; // shadcnui Button component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // shadcnui Card components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // shadcnui Table components
import { PieChartIcon as ChartPieIcon, XIcon } from 'lucide-react'; // Icons from lucide-react
import { numOfRecipesByCategory } from '@/lib/actions';

interface RecipesByCategoryProps {
  userId: number;
}

interface RecipeCategoryCount {
  category: string;
  recipe_count: number;
}

export default function RecipesByCategory({ userId }: RecipesByCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipeData, setRecipeData] = useState<RecipeCategoryCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown

  const fetchRecipeCounts = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await numOfRecipesByCategory(userId);
      setRecipeData(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Error fetching recipe counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Button Positioned Next to Filters */}
      <Button
        onClick={fetchRecipeCounts}
        variant="secondary"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-md"
      >
        {isOpen ? (
          <XIcon className="h-5 w-5 text-primary" /> // Close Icon
        ) : (
          <ChartPieIcon className="h-5 w-5 text-primary" /> // Open Icon
        )}
        <span>{isOpen ? 'Close Statistics' : 'Recipe Statistics'}</span>
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-[320px]">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Recipes By Category</CardTitle>
              <CardDescription>
                Total number of recipes grouped by category
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
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipeData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.recipe_count}
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
