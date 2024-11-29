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

    await client.sql`
      INSERT INTO recipes (user_id, title, description, cooking_time)
      VALUES
        (1, 'Vegan Buddha Bowl', 'A healthy bowl with quinoa, roasted vegetables, and tahini dressing.', 30),
        (1, 'Chicken Tikka Masala', 'A flavorful Indian dish with creamy tomato curry and marinated chicken.', 45),
        (1, 'Gluten-Free Pancakes', 'Fluffy pancakes made with almond flour and a hint of vanilla.', 20);
    `;
    await client.sql`
      INSERT INTO user (id, email, password)
      VALUES
        (1, jordan2002222@gmail.com, Yk20020221);
    `;

    await client.sql`
      INSERT INTO recipe_categories (recipe_id, category_id)
      VALUES
        (1, 1), -- Healthy Eating
        (2, 2), -- Indian Cuisine
        (3, 3); -- Breakfast
    `;

    await client.sql`
      INSERT INTO recipe_cuisines (recipe_id, cuisine_id)
      VALUES
        (1, 4), -- Fusion
        (2, 5), -- Indian
        (3, 6); -- American
    `;

    await client.sql`
      INSERT INTO recipe_dietary_restrictions (recipe_id, dietary_id)
      VALUES
        (1, 1),
        (1, 2),
        (1, 3),
        (1, 4),
        (1, 5),
        (1, 6),
        (1, 7),  
        (1, 8),
        (1, 9),
        (1, 10),
        (1, 11),
        (1, 12),
        (1, 13),
        (1, 14),
        (1, 15),
        (2, 1),
        (2, 2),
        (2, 3),
        (2, 4),
        (2, 5),
        (2, 6),
        (2, 7),
        (2, 8),
        (2, 9),
        (2, 10),
        (2, 11),
        (2, 12),
        (2, 13),
        (2, 14),
        (2, 15),
        (3, 1),
        (3, 2),
        (3, 3),
        (3, 4),
        (3, 5),
        (3, 6),
        (3, 7),
        (3, 8),
        (3, 9),
        (3, 10),
        (3, 11),
        (3, 12),
        (3, 13),
        (3, 14),
        (3, 15); 
    `;

    await client.sql`
      INSERT INTO ingredients (name, storage_temp)
      VALUES
        ('Quinoa', 25), -- Non-perishable
        ('Broccoli', 5), -- Perishable
        ('Chicken Breast', -2), -- Perishable
        ('Tomato', 8), -- Perishable
        ('Almond Flour', 25), -- Non-perishable
        ('Vanilla Extract', 25), -- Non-perishable
        ('Tahini', 25), -- Non-perishable
        ('Yogurt', 5), -- Perishable
        ('Milk', 5); -- Perishable
    `;

    await client.sql`
      INSERT INTO perishable_ingredients (id, shelf_life)
      VALUES
        (2, 7), -- Broccoli
        (3, 3), -- Chicken Breast
        (4, 5), -- Tomato
        (8, 7), -- Yogurt
        (9, 5); -- Milk
    `;

    await client.sql`
      INSERT INTO allergens (name)
      VALUES
        ('Sesame'), -- Tahini
        ('Dairy'), -- Yogurt, Milk
        ('Tree Nuts'); -- Almond Flour
    `;

    await client.sql`
      INSERT INTO ingredient_allergens (ingredient_id, allergen_id)
      VALUES
        (7, 1), -- Tahini -> Sesame
        (8, 2), -- Yogurt -> Dairy
        (9, 2), -- Milk -> Dairy
        (5, 3); -- Almond Flour -> Tree Nuts
    `;

    await client.sql`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id)
      VALUES
        (1, 1), -- Buddha Bowl -> Quinoa
        (1, 2), -- Buddha Bowl -> Broccoli
        (1, 7), -- Buddha Bowl -> Tahini
        (2, 3), -- Tikka Masala -> Chicken Breast
        (2, 4), -- Tikka Masala -> Tomato
        (2, 8), -- Tikka Masala -> Yogurt
        (3, 5), -- Pancakes -> Almond Flour
        (3, 6), -- Pancakes -> Vanilla Extract
        (3, 9); -- Pancakes -> Milk
    `;

    await client.sql`
      INSERT INTO recipe_steps (recipe_id, step_num, description)
      VALUES
        (1, 1, 'Cook quinoa according to package instructions.'),
        (1, 2, 'Roast broccoli with olive oil in the oven.'),
        (1, 3, 'Assemble the bowl and drizzle with tahini dressing.'),
        (2, 1, 'Marinate chicken in yogurt and spices.'),
        (2, 2, 'Cook chicken in a skillet until golden brown.'),
        (2, 3, 'Prepare a creamy tomato-based curry sauce and simmer chicken in it.'),
        (3, 1, 'Mix almond flour, eggs, vanilla, and milk in a bowl.'),
        (3, 2, 'Heat a skillet and pour batter to form pancakes.'),
        (3, 3, 'Cook until golden brown on both sides.');
    `;

    await client.sql`
      INSERT INTO nutrition_facts (recipe_id, calories, proteins, fats)
      VALUES
        (1, 450, 12, 15), -- Buddha Bowl
        (2, 600, 40, 20), -- Tikka Masala
        (3, 300, 10, 10); -- Pancakes
    `;
      
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
