import { compareSync, hashSync } from '@node-rs/bcrypt';
import { defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro:schema';
import { passwordOk, validatePassword } from '../lib/password';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { sessions, users } from '../database/schema';
import { db } from '../database/database';

export type User = Omit<InferSelectModel<typeof users>, 'passwordHash'>;

function getToken(context: ActionAPIContext) {
    const cookie = context.cookies.get('token');
    if (cookie) {
        return cookie.value;
    }
    return undefined;
}

function setToken(context: ActionAPIContext, token: string) {
    context.cookies.set('token', token);
}
function createRandomToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let str = '';
    for (let i = 0; i < 100; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
}

async function createSession(username: string) {
    const token = createRandomToken();
    await db.insert(sessions).values({ token, username });
    return token;
}

export async function authenticate(context: ActionAPIContext) {
    const token = getToken(context);
    if (!token) {
        return undefined;
    }

    const user = await db
        .select({
            username: users.username,
            administrator: users.administrator,
        })
        .from(sessions)
        .where(eq(sessions.token, token))
        .innerJoin(users, eq(sessions.username, users.username))
        .get();
    return user satisfies User | undefined;
}

export async function permission(context: ActionAPIContext, check: (u: User) => boolean) {
    const user = await authenticate(context);
    if (!user) {
        throw new Error('Not logged in');
    }

    if (!check(user)) {
        throw new Error('Missing permission');
    }

    return user;
}

export const authentication = {
    status: defineAction({
        async handler(input, context) {
            return await authenticate(context);
        },
    }),

    login: defineAction({
        input: z.object({ username: z.string(), password: z.string() }),
        async handler(input, context) {
            const user = await db.select().from(users).where(eq(users.username, input.username)).get();
            if (!user || !compareSync(input.password, user.passwordHash)) {
                throw new Error('Invalid username or password');
            }

            const token = await createSession(input.username);
            setToken(context, token);
        },
    }),

    changePassword: defineAction({
        input: z.object({ oldPassword: z.string(), newPassword: z.string() }),
        async handler(input, context) {
            const user = await permission(context, () => true);

            if (!passwordOk(validatePassword(input.newPassword))) {
                throw new Error('Password not strong enough');
            }

            const loaded = await db
                .select({ passwordHash: users.passwordHash })
                .from(users)
                .where(eq(users.username, user.username))
                .get();

            if (!compareSync(input.oldPassword, loaded!.passwordHash)) {
                throw new Error('Invalid old password');
            }

            await db
                .update(users)
                .set({ passwordHash: hashSync(input.newPassword) })
                .where(eq(users.username, user.username));

            await db.delete(sessions).where(eq(sessions.username, user.username));
        },
    }),
};
