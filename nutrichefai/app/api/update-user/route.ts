import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function PUT(req: NextRequest) {
  try {
    const { id, name, email } = await req.json();

    if (!id || (!name && !email)) {
      return NextResponse.json({ error: "ID and at least one field to update are required." }, { status: 400 });
    }

    await sql`
      UPDATE users
      SET 
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email)
      WHERE id = ${id};
    `;

    return NextResponse.json({ message: "User updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
