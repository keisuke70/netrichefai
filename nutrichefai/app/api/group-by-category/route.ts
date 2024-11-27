import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT c.name AS category, COUNT(r.id) AS recipe_count
      FROM categories c
      LEFT JOIN recipe_categories rc ON c.id = rc.category_id
      LEFT JOIN recipes r ON rc.recipe_id = r.id
      GROUP BY c.name;
    `;

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch category group data." }, { status: 500 });
  }
}
