export type HabitRow = {
  id: number;
  user_id: string;
  name: string;
  display_order: number;
  status: "active" | "archived";
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
};

export type HabitApiResponse = {
  habitId: string;
  userId: string;
  name: string;
  displayOrder: number;
  status: "active" | "archived";
  archivedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateListHabitsQuery(userId: string | null): { ok: true; userId: string } | { ok: false; message: string } {
  if (!userId || !isUuidLike(userId)) {
    return { ok: false, message: "userId is required" };
  }
  return { ok: true, userId };
}

export function validateCreateHabitBody(
  body: unknown,
): { ok: true; userId: string; name: string; displayOrder: number } | { ok: false; message: string } {
  const requestBody = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const userId = typeof requestBody.userId === "string" ? requestBody.userId : "";
  const name = typeof requestBody.name === "string" ? requestBody.name : "";
  const displayOrder = requestBody.display_order;

  if (!isUuidLike(userId) || !name || typeof displayOrder !== "number") {
    return { ok: false, message: "userId, name, display_order are required" };
  }

  return { ok: true, userId, name, displayOrder };
}

export function mapHabitRowToResponse(row: HabitRow): HabitApiResponse {
  return {
    habitId: String(row.id),
    userId: row.user_id,
    name: row.name,
    displayOrder: row.display_order,
    status: row.status,
    archivedAt: row.archived_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
