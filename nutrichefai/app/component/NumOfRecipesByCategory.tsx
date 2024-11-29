'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PieChartIcon as ChartPieIcon, XIcon } from 'lucide-react'
import { numOfRecipesByCategory } from '@/lib/actions'

interface RecipesByCategoryProps {
  userId: number
}

interface RecipeCategoryCount {
  category: string
  recipe_count: number
}

export default function RecipesByCategory({ userId }: RecipesByCategoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [recipeData, setRecipeData] = useState<RecipeCategoryCount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchRecipeCounts = async () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await numOfRecipesByCategory(userId)
      setRecipeData(data)
      setIsOpen(true)
    } catch (error) {
      console.error('Error fetching recipe counts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={fetchRecipeCounts}
        size="icon"
        variant="secondary"
        className="h-12 w-12 rounded-full shadow-lg"
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <ChartPieIcon className="h-5 w-5" />
        )}
        <span className="sr-only">
          {isOpen ? 'Close Statistics' : 'Show Recipe Statistics'}
        </span>
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 min-w-[320px]">
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
  )
}
