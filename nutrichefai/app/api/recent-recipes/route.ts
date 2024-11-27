import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);

  try {
    const { rows } = await sql`
      SELECT id, title, created_at
      FROM recipes
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recent recipes." }, { status: 500 });
  }
}
