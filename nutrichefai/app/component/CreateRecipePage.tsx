"use client";

import React, { useState } from "react";
import RecipeForm from "./RecipeForm";

interface CreateRecipePageProps {
  userId: string | undefined;
}

const CreateRecipePage: React.FC<CreateRecipePageProps> = ({ userId }) => {
  const [showForm, setShowForm] = useState(false);

  const handleToggleForm = () => {
    setShowForm((prev) => !prev);
  };

  if (!userId) {
    return (
      <div className="text-center text-red-500">
        <p>User not authenticated. Please log in to create recipes.</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      {!showForm ? (
        <>
          <p>Do you want to create a recipe manually?</p>
          <button
            onClick={handleToggleForm}
            className="bg-blue-500 text-white py-2 px-4 rounded-md"
          >
            Yes, create recipe
          </button>
        </>
      ) : (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-4">
            Create a New Recipe
          </h2>
          <RecipeForm userId={userId!} />
          <div className="text-center mt-4">
            <button
              onClick={handleToggleForm}
              className="text-red-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRecipePage;
