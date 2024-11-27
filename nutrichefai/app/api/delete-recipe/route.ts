import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Recipe ID is required." }, { status: 400 });
    }

    await sql`
      DELETE FROM recipes
      WHERE id = ${id};
    `;

    return NextResponse.json({ message: "Recipe deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete recipe." }, { status: 500 });
  }
}
