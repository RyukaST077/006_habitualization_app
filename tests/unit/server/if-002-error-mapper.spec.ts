import { describe, expect, it } from "vitest";

import { createIf002HandledError, mapIf002Error } from "../../../src/server/application/if-002/error-mapper";

describe("IF-002 error mapper", () => {
  it("DOMAIN_CONFLICT は fallback requirement_id を優先する", () => {
    const error = createIf002HandledError("DOMAIN_CONFLICT", "conflict", "FR-011", "trace-app");

    const mapped = mapIf002Error(error, "trace-fallback", "FR-013");

    expect(mapped.status).toBe(409);
    expect(mapped.body.code).toBe("DOMAIN_CONFLICT");
    expect(mapped.body.requirement_id).toBe("FR-013");
  });

  it("DOMAIN_CONFLICT の fallback が空なら app requirement_id を使う", () => {
    const error = createIf002HandledError("DOMAIN_CONFLICT", "conflict", "FR-011", "trace-app");

    const mapped = mapIf002Error(error, "trace-fallback", "");

    expect(mapped.status).toBe(409);
    expect(mapped.body.requirement_id).toBe("FR-011");
  });

  it("FORBIDDEN は常に FR-025 に正規化する", () => {
    const error = createIf002HandledError("FORBIDDEN", "forbidden", "FR-011", "trace-app");

    const mapped = mapIf002Error(error, "trace-fallback", "FR-013");

    expect(mapped.status).toBe(403);
    expect(mapped.body.code).toBe("FORBIDDEN");
    expect(mapped.body.requirement_id).toBe("FR-025");
  });

  it("handled default trace_id は fallback trace に置換する", () => {
    const error = createIf002HandledError("DOMAIN_CONFLICT", "conflict", "FR-011");

    const mapped = mapIf002Error(error, "trace-fallback", "FR-013");

    expect(mapped.body.trace_id).toContain("trace-fallback");
  });

  it("非 AppError は INTERNAL_ERROR(500) に写像する", () => {
    const mapped = mapIf002Error(new Error("boom"), "trace-fallback", "FR-011");

    expect(mapped.status).toBe(500);
    expect(mapped.body.code).toBe("INTERNAL_ERROR");
    expect(mapped.body.requirement_id).toBe("FR-011");
  });
});
