export type T030ActorId = "USER-A" | "USER-B";
export type T030RoleId = "ROLE-002";

export interface T030Actor {
  actorId: T030ActorId;
  roleId: T030RoleId;
  userId: string;
  displayName: string;
}

export const T030_ACTORS: Readonly<Record<T030ActorId, T030Actor>> = {
  "USER-A": {
    actorId: "USER-A",
    roleId: "ROLE-002",
    userId: "user-a",
    displayName: "Common Actor User A",
  },
  "USER-B": {
    actorId: "USER-B",
    roleId: "ROLE-002",
    userId: "user-b",
    displayName: "Common Actor User B",
  },
} as const;

export const T030_COMMON_ROLE_ID: T030RoleId = "ROLE-002";
export const T030_COMMON_ACTOR_IDS: readonly T030ActorId[] = ["USER-A", "USER-B"] as const;
