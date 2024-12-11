import { column, defineDb, defineTable, NOW } from 'astro:db';

export const Users = defineTable({
    columns: {
        username: column.text({ primaryKey: true }),
        administrator: column.boolean({ default: false }),
        passwordHash: column.text(),
    },
});

export const Sessions = defineTable({
    columns: {
        username: column.text({ references: () => Users.columns.username }),
        token: column.text({ primaryKey: true }),
        creationDate: column.date({ default: NOW }),
    },
});

// https://astro.build/db/config
export default defineDb({
    tables: { Users, Sessions },
});
