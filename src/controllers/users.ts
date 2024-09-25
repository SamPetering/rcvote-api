import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/dbClient.js';
import type { AsyncControllerResult } from './types.js';
import { ev } from './util.js';
import {
  Roles,
  UserRoles,
  Users,
  type InsertUserData,
  type SelectUserWithRoles,
} from '../db/schemas/users.js';
import {
  type User,
  type UserElectionsResponseData,
  userElectionsResponseDataSchema,
  userSchema,
} from '../schemas/users.js';
import { ROLES } from '../constants.js';
import { Elections } from '../db/schemas/elections.js';

function userWithRolesToUser(userWithRoles: SelectUserWithRoles) {
  return userSchema.parse({
    ...userWithRoles,
    roles: userWithRoles.userRoles.map((r) => r.role.name),
  });
}

export async function createUser(
  userData: InsertUserData
): AsyncControllerResult<User> {
  try {
    const userWithRoles = await db.transaction(async (tx) => {
      const [newUser] = await db.insert(Users).values(userData).returning();
      if (!newUser) throw new Error('Failed to create user');

      const [userRole] = await tx
        .select({ id: Roles.id })
        .from(Roles)
        .where(eq(Roles.name, ROLES.USER))
        .limit(1);

      if (!userRole) throw new Error(`${ROLES.USER} role not found`);

      await tx.insert(UserRoles).values({
        userId: newUser.id,
        roleId: userRole.id,
      });

      // return newUser
      const userWithRoles = await tx.query.Users.findFirst({
        where: eq(Users.id, newUser.id),
        with: {
          userRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      if (!userWithRoles) {
        throw new Error('Failed to retrieve user with roles');
      }
      return userWithRoles;
    });

    return ev(userWithRolesToUser(userWithRoles));
  } catch (e) {
    return ev<User>(null, {
      message: 'Failed to create user',
      status: 500,
    });
  }
}

export async function findUser(id: number): AsyncControllerResult<User> {
  try {
    const userWithRoles = await db.query.Users.findFirst({
      where: eq(Users.id, id),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      return ev<User>(null, {
        status: 404,
        message: 'User not found',
      });
    }

    return ev(userWithRolesToUser(userWithRoles));
  } catch (e) {
    return ev<User>(null, {
      status: 500,
      message: 'Error finding user',
    });
  }
}

export async function findOrCreateUser(
  userData: InsertUserData
): AsyncControllerResult<User> {
  try {
    // attempt to find user by google id
    const userWithRoles = await db.query.Users.findFirst({
      where: eq(Users.googleId, userData.googleId),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (userWithRoles) {
      return ev(userWithRolesToUser(userWithRoles));
    }

    const [newUser, error] = await createUser(userData);
    if (error != null) throw new Error();
    return ev(newUser);
  } catch (e) {
    return ev<User>(null, {
      message: 'Failed to find or create user',
      status: 500,
    });
  }
}

export async function incrementRefreshTokenVersion(
  userId: number
): AsyncControllerResult<number> {
  try {
    const [updated] = await db
      .update(Users)
      .set({
        refreshTokenVersion: sql`${Users.refreshTokenVersion} + 1`,
      })
      .where(eq(Users.id, userId))
      .returning();
    if (!updated) throw new Error();
    return ev(updated?.refreshTokenVersion);
  } catch (e) {
    return ev<number>(null, {
      status: 500,
      message: 'Failed to increment user token version',
    });
  }
}

export async function makeUserAdmin(
  userId: number
): AsyncControllerResult<boolean> {
  try {
    const status = await db.transaction(async (tx) => {
      const user = await tx.query.Users.findFirst({
        where: eq(Users.id, userId),
      });
      if (!user) return 404;

      const adminRole = await tx.query.Roles.findFirst({
        where: eq(Roles.name, ROLES.ADMIN),
      });

      if (!adminRole) return 404;
      const existing = await tx.query.UserRoles.findFirst({
        where: and(
          eq(UserRoles.userId, user.id),
          eq(UserRoles.roleId, adminRole.id)
        ),
      });
      if (existing) return 200;

      const [success] = await tx
        .insert(UserRoles)
        .values({
          roleId: adminRole.id,
          userId: user.id,
        })
        .returning();
      return !!success ? 200 : 500;
    });

    if (status !== 200) {
      return ev<boolean>(null, { message: 'Error making admin', status });
    }

    return ev(true);
  } catch {
    return ev<boolean>(null, { message: 'Error making admin', status: 500 });
  }
}

export async function getUserCreatedElections(
  userId: number
): AsyncControllerResult<UserElectionsResponseData> {
  try {
    const userElections = await db.query.Elections.findMany({
      where: eq(Elections.creatorId, userId),
      with: {
        config: true,
        candidates: true,
        votes: {
          columns: {
            id: true,
          },
        },
      },
    });
    return ev(userElectionsResponseDataSchema.parse(userElections));
  } catch (e) {
    console.log('ERROR', e);
    return ev<UserElectionsResponseData>(null, {
      status: 500,
      message: 'Error finding user created elections',
    });
  }
}
