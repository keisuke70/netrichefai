import { db } from "@vercel/postgres";
import {
  categories,
  cuisines,
  dietaryRestrictions,
} from "../../../lib/placeholder-data";

export async function GET() {
  const client = await db.connect();

  try {
    await client.sql`BEGIN`;

    // Drop existing tables to allow re-running the script
    await client.sql`
      DROP TABLE IF EXISTS ingredient_allergens;
      DROP TABLE IF EXISTS perishable_ingredients;
      DROP TABLE IF EXISTS recipe_ingredients;
      DROP TABLE IF EXISTS recipe_steps;
      DROP TABLE IF EXISTS nutrition_facts;
      DROP TABLE IF EXISTS recipe_dietary_restrictions;
      DROP TABLE IF EXISTS recipe_cuisines;
      DROP TABLE IF EXISTS recipe_categories;
      DROP TABLE IF EXISTS allergens;
      DROP TABLE IF EXISTS dietary_restrictions;
      DROP TABLE IF EXISTS cuisines;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS ingredients;
      DROP TABLE IF EXISTS recipes;
      DROP TABLE IF EXISTS users;
    `;

    // Create tables
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        cooking_time INT NOT NULL
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS cuisines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS dietary_restrictions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS recipe_categories (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        category_id INT REFERENCES categories(id) ON DELETE CASCADE,
        PRIMARY KEY (recipe_id, category_id)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS recipe_cuisines (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        cuisine_id INT REFERENCES cuisines(id) ON DELETE CASCADE,
        PRIMARY KEY (recipe_id, cuisine_id)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS recipe_dietary_restrictions (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        dietary_id INT REFERENCES dietary_restrictions(id) ON DELETE CASCADE,
        PRIMARY KEY (recipe_id, dietary_id)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        storage_temp INT
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS perishable_ingredients (
        id INT REFERENCES ingredients(id) PRIMARY KEY,
        shelf_life INT NOT NULL
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS allergens (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS ingredient_allergens (
        ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
        allergen_id INT REFERENCES allergens(id) ON DELETE CASCADE,
        PRIMARY KEY (ingredient_id, allergen_id)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
        PRIMARY KEY (recipe_id, ingredient_id)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS recipe_steps (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        step_num INT NOT NULL,
        description TEXT NOT NULL,
        PRIMARY KEY (recipe_id, step_num)
      );
    `;

    await client.sql`
      CREATE TABLE IF NOT EXISTS nutrition_facts (
        nutrition_id SERIAL PRIMARY KEY,
        recipe_id INT UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
        calories INT NOT NULL,
        proteins INT NOT NULL,
        fats INT NOT NULL
      );
    `;

    // Insert data into Categories
    for (const category of categories) {
      await client.sql`
        INSERT INTO categories (name)
        VALUES (${category.name})
        ON CONFLICT (name) DO NOTHING;
      `;
    }

    // Insert data into Cuisines
    for (const cuisine of cuisines) {
      await client.sql`
        INSERT INTO cuisines (name)
        VALUES (${cuisine.name})
        ON CONFLICT (name) DO NOTHING;
      `;
    }

    // Insert data into Dietary Restrictions
    for (const restriction of dietaryRestrictions) {
      await client.sql`
        INSERT INTO dietary_restrictions (name, description)
        VALUES (${restriction.name}, ${restriction.description})
        ON CONFLICT (name) DO NOTHING;
      `;
    }

    await client.sql`COMMIT`;

    return new Response(
      JSON.stringify({ message: "Database seeded successfully!" }),
      { status: 200 }
    );
  } catch (error) {
    await client.sql`ROLLBACK`;
    console.error("Database seeding failed:", error);
    return new Response(JSON.stringify({ error: "Failed to seed database" }), {
      status: 500,
    });
  } finally {
    client.release();
  }
}
