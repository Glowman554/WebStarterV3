import { hashSync } from '@node-rs/bcrypt';
import { db, Users } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
    await db.insert(Users).values({
        username: 'admin',
        administrator: true,
        passwordHash: hashSync('admin'),
    });
}
