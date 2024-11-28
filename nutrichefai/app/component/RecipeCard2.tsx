import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recipe } from "../../lib/definitions";
import { Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  editingId: number | null;
  editedTitle: string;
  setEditedTitle: React.Dispatch<React.SetStateAction<string>>;
  handleEditClick: (recipeId: number, currentTitle: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  editingId,
  editedTitle,
  setEditedTitle,
  handleEditClick,
}) => {
  return (
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
              onClick={() => handleEditClick(recipe.id!, recipe.title)}
              className="text-blue-500 hover:underline"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <CardTitle>{recipe.title}</CardTitle>
            <button
              onClick={() => handleEditClick(recipe.id!, recipe.title)}
              className="ml-2 text-blue-500 hover:underline text-sm"
            >
              Edit
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>{recipe.cooking_time} mins</span>
        </div>
      </CardContent>
      <CardFooter>
        {" "}
        <Button asChild className="w-full">
          <Link href={`/recipe/${recipe.id}`} legacyBehavior>
            <a>View This Recipe!</a>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;
