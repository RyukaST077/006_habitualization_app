export type FixtureUser = {
  id: string;
  role: 'USER' | 'OPS';
  email: string;
  timezone: string;
  locale: string;
};

export type FixtureUsers = {
  USER_A: FixtureUser;
  USER_B: FixtureUser;
  OPS_1: FixtureUser;
};

const BASE_USERS: FixtureUsers = {
  USER_A: {
    id: 'user-a',
    role: 'USER',
    email: 'user.a@example.com',
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
  },
  USER_B: {
    id: 'user-b',
    role: 'USER',
    email: 'user.b@example.com',
    timezone: 'UTC',
    locale: 'en-US',
  },
  OPS_1: {
    id: 'ops-1',
    role: 'OPS',
    email: 'ops.1@example.com',
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
  },
};

export function createFixtureUsers(): FixtureUsers {
  return {
    USER_A: { ...BASE_USERS.USER_A },
    USER_B: { ...BASE_USERS.USER_B },
    OPS_1: { ...BASE_USERS.OPS_1 },
  };
}
