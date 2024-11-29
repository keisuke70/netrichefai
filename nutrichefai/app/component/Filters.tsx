import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NumOfRecipesByCategory from "./NumOfRecipesByCategory";

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  cuisineFilter: string;
  setCuisineFilter: React.Dispatch<React.SetStateAction<string>>;
  cuisineOptions: string[];
  categoryFilter: string;
  setCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  categoryOptions: string[];
  dietaryFilter: string;
  setDietaryFilter: React.Dispatch<React.SetStateAction<string>>;
  dietaryOptions: string[];
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  cuisineFilter,
  setCuisineFilter,
  cuisineOptions,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
  dietaryFilter,
  setDietaryFilter,
  dietaryOptions,
}) => {
  return (
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
        
        
        
        
        
        <div>

<div>
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


    <NumOfRecipesByCategory userId={userId} />

        </div>





 

      </div>
    </div>
  );
};

export default Filters;
