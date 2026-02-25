import type { Fnc013Actor } from "./fnc-013-rls-cases";

export type Fnc013JwtClaimKey = "request.jwt.claim.sub" | "request.jwt.claim.role";

export interface Fnc013JwtClaimSwitch {
  key: Fnc013JwtClaimKey;
  value: string;
}

export interface Fnc013ActorFixture {
  actor: Fnc013Actor;
  userId: string;
  dbRole: "authenticated" | "role_002";
  jwtClaims: {
    sub: string;
    role: string;
  };
  jwtClaimSwitches: readonly Fnc013JwtClaimSwitch[];
}

const USER_A_USER_ID = "00000000-0000-4000-8000-0000000000aa";
const USER_B_USER_ID = "00000000-0000-4000-8000-0000000000bb";
const ROLE_002_USER_ID = "00000000-0000-4000-8000-000000000002";

export const FNC013_ACTORS: Record<Fnc013Actor, Fnc013ActorFixture> = {
  "USER-A": {
    actor: "USER-A",
    userId: USER_A_USER_ID,
    dbRole: "authenticated",
    jwtClaims: {
      sub: USER_A_USER_ID,
      role: "authenticated",
    },
    jwtClaimSwitches: [
      { key: "request.jwt.claim.sub", value: USER_A_USER_ID },
      { key: "request.jwt.claim.role", value: "authenticated" },
    ],
  },
  "USER-B": {
    actor: "USER-B",
    userId: USER_B_USER_ID,
    dbRole: "authenticated",
    jwtClaims: {
      sub: USER_B_USER_ID,
      role: "authenticated",
    },
    jwtClaimSwitches: [
      { key: "request.jwt.claim.sub", value: USER_B_USER_ID },
      { key: "request.jwt.claim.role", value: "authenticated" },
    ],
  },
  "ROLE-002": {
    actor: "ROLE-002",
    userId: ROLE_002_USER_ID,
    dbRole: "role_002",
    jwtClaims: {
      sub: ROLE_002_USER_ID,
      role: "role_002",
    },
    jwtClaimSwitches: [
      { key: "request.jwt.claim.sub", value: ROLE_002_USER_ID },
      { key: "request.jwt.claim.role", value: "role_002" },
    ],
  },
};

export const FNC013_ACTOR_KEYS: readonly Fnc013Actor[] = ["USER-A", "USER-B", "ROLE-002"];
