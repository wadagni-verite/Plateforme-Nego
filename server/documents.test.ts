import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "admin" | "avocat" | "expert" | "observateur" = "admin"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    organization: null,
    phone: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Categories", () => {
  it("should list all categories", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("nameFr");
    expect(categories[0]).toHaveProperty("nameEn");
    expect(categories[0]).toHaveProperty("icon");
    expect(categories[0]).toHaveProperty("color");
  });

  it("should have exactly 15 categories", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(categories.length).toBe(15);
  });
});

describe("Documents", () => {
  it("should list documents", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.documents.list();

    expect(documents).toBeDefined();
    expect(Array.isArray(documents)).toBe(true);
  });

  it("should get document stats", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.documents.stats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("byCategory");
    expect(typeof stats.total).toBe("number");
    expect(Array.isArray(stats.byCategory)).toBe(true);
  });
});

describe("Permissions", () => {
  it("should get permissions for admin role", async () => {
    const { ctx } = createTestContext("admin");
    const caller = appRouter.createCaller(ctx);

    const permissions = await caller.permissions.myPermissions();

    expect(permissions).toBeDefined();
    expect(Array.isArray(permissions)).toBe(true);
    
    if (permissions.length > 0) {
      const adminPerm = permissions[0];
      expect(adminPerm.canView).toBe(true);
      expect(adminPerm.canUpload).toBe(true);
      expect(adminPerm.canEdit).toBe(true);
      expect(adminPerm.canDelete).toBe(true);
    }
  });

  it("should get permissions for observateur role", async () => {
    const { ctx } = createTestContext("observateur");
    const caller = appRouter.createCaller(ctx);

    const permissions = await caller.permissions.myPermissions();

    expect(permissions).toBeDefined();
    expect(Array.isArray(permissions)).toBe(true);
    
    if (permissions.length > 0) {
      const observateurPerm = permissions[0];
      expect(observateurPerm.canView).toBe(true);
      expect(observateurPerm.canUpload).toBe(false);
      expect(observateurPerm.canEdit).toBe(false);
      expect(observateurPerm.canDelete).toBe(false);
    }
  });
});

describe("Timeline", () => {
  it("should list timeline events", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.timeline.list();

    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
  });
});

describe("Audit", () => {
  it("should list audit logs", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list();

    expect(logs).toBeDefined();
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe("Users", () => {
  it("should list users", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.list();

    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBe(true);
  });
});
