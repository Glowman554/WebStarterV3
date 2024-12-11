// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from 'drizzle-orm';
import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    username: text('username').primaryKey().notNull(),
    administrator: int({ mode: 'boolean' }).default(false).notNull(),
    passwordHash: text('passwordHash').notNull(),
});

export const sessions = sqliteTable('sessions', {
    username: text('username')
        .references(() => users.username, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),
    token: text('token').primaryKey().notNull(),
    creationDate: integer('creationDate', { mode: 'timestamp' })
        .default(sql`(strftime('%s', 'now'))`)
        .notNull(),
});
