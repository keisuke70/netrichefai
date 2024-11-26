import { db, VercelPoolClient } from '@vercel/postgres';
import { categories, cuisines, dietaryRestrictions } from '../../../lib/placeholder-data';

async function seedCategories(client: VercelPoolClient) {
    await client.sql`
        CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
    `;

    const insertedCategories = await Promise.all(
        categories.map((category) =>
            client.sql`
                INSERT INTO categories (id, name)
                VALUES (${category.id}, ${category.name})
                ON CONFLICT (id) DO NOTHING;
            `
        )
    );

    return insertedCategories;
}

async function seedCuisines(client: VercelPoolClient) {
    await client.sql`
        CREATE TABLE IF NOT EXISTS cuisines (
            id INT PRIMARY KEY,
            name VARCHAR (255) NOT NULL
        );
    `;

    const insertedCuisines = await Promise.all(
        cuisines.map((cuisine) =>
            client.sql`
                INSERT INTO cuisines (id, name)
                VALUES (${cuisine.id}, ${cuisine.name})
                ON CONFLICT (id) DO NOTHING;
            `
        )
    );

    return insertedCuisines;
}

async function seedDietaryRestrictions(client: VercelPoolClient) {
    await client.sql`
        CREATE TABLE IF NOT EXISTS dietary_restrictions (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT
        );
    `;

    const insertedDietaryRestrictions = await Promise.all(
        dietaryRestrictions.map((restriction) =>
            client.sql`
                INSERT INTO dietary_restrictions (id, name, description)
                VALUES (${restriction.id}, ${restriction.name}, ${restriction.description})
                ON CONFLICT (id) DO NOTHING;
            `
        )
    );

    return insertedDietaryRestrictions;
}

export async function GET() {
    const client = await db.connect(); // Initialize the client inside the function
    try {
        await client.sql`BEGIN`;

        // Seed the database
        await seedCategories(client);
        await seedCuisines(client);
        await seedDietaryRestrictions(client);

        await client.sql`COMMIT`;

        return Response.json({ message: 'Database seeded successfully' });
    } catch (error: any) {
        await client.sql`ROLLBACK`;
        console.error('Database seeding failed:', error);

        return Response.json(
            { error: 'Failed to seed database', details: error.message },
            { status: 500 }
        );
    } finally {
        client.release(); // Ensure the client is released after use
    }
}
