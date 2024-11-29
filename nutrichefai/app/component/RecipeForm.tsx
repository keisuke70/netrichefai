"use client";

import React from "react";
import { useActionState } from "react";
import { insertRecipe } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecipeFormProps {
  userId: string;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ userId }) => {
  const initialState: any = {
    errors: undefined,
    message: null,
  };

  const [state, formAction] = useActionState(insertRecipe, initialState);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Add New Recipe</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <input type="hidden" name="user_id" value={userId} />

          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title</Label>
            <Input type="text" name="title" id="title" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea name="description" id="description" rows={2} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooking_time">Cooking Time (in minutes)</Label>
            <Input
              type="number"
              name="cooking_time"
              id="cooking_time"
              required
            />
          </div>

          {state?.errors && (
            <div className="text-destructive text-sm">
              {Object.entries(state.errors).map(([key, errorMessages]) => (
                <p key={key}>
                  {Array.isArray(errorMessages)
                    ? errorMessages.join(", ")
                    : String(errorMessages)}
                </p>
              ))}
            </div>
          )}

          {state?.message && (
            <p aria-live="polite" className="text-green-600 text-sm">
              {state.message}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Add Recipe
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RecipeForm;
