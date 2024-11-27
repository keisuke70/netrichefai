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
