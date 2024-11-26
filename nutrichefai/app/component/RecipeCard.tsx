import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recipe } from "../../lib/definitions"

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard = ({ recipe }: RecipeCardProps) => (
  <Card className="h-full flex flex-col">
    <CardHeader>
      <CardTitle className="text-xl">{recipe.title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <CardDescription className="line-clamp-5">
        {recipe.description}
      </CardDescription>
      <p className="text-sm text-gray-500 mt-2">
        Cooking Time: {recipe.cooking_time}
      </p>
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full">
        <Link href={`/recipe/${recipe.id}`} legacyBehavior>
          <a>View This Recipe!</a>
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default RecipeCard;
