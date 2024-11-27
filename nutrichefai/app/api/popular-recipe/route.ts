import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
  }

  try {
    const { rows } = await sql`
      SELECT r.id, r.title, r.popularity
      FROM recipes r
      JOIN recipe_categories rc ON r.id = rc.recipe_id
      WHERE rc.category_id = ${categoryId}
      ORDER BY r.popularity DESC
      LIMIT 1;
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch popular recipe." }, { status: 500 });
  }
}

export async function fetchCuisineWithMostPopularRecipes(): Promise<{
    cuisine: string;
    average_popularity: number;
  }> {
    try {
      const { rows } = await sql`
        SELECT 
          cu.name AS cuisine, 
          AVG(r.popularity) AS average_popularity
        FROM cuisines cu
        JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
        JOIN recipes r ON rc.recipe_id = r.id
        GROUP BY cu.name
        HAVING AVG(r.popularity) > 0
        ORDER BY average_popularity DESC
        LIMIT 1;
      `;
  
      if (rows.length === 0) {
        throw new Error("No cuisines found with popular recipes.");
      }
  
      return {
        cuisine: rows[0].cuisine,
        average_popularity: parseFloat(rows[0].average_popularity),
      };
    } catch (error) {
      console.error("Error fetching cuisine with the most popular recipes:", error);
      throw new Error("Failed to fetch cuisine with the most popular recipes.");
    }
  }
