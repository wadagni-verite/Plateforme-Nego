import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  caseInfo,
  categories,
  documentPermissions,
  documents,
  InsertAuditLog,
  InsertCategory,
  InsertDocument,
  InsertDocumentPermission,
  InsertTimelineEvent,
  InsertUser,
  savedSearches,
  timelineEvents,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "organization", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.isActive, true)).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "admin" | "avocat" | "expert" | "observateur") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function deactivateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(category);
  return Number((result as any).insertId);
}

export async function initializeDefaultCategories() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) return; // Already initialized

  const defaultCategories: InsertCategory[] = [
    { nameKey: "expertise_reports", nameFr: "Rapports d'Expertise et Études Techniques", nameEn: "Expertise Reports and Technical Studies", icon: "FileText", color: "#1e3a8a", sortOrder: 1, isActive: true },
    { nameKey: "property_proofs", nameFr: "Inventaires et Preuves de Propriété", nameEn: "Inventories and Property Proofs", icon: "Home", color: "#d97706", sortOrder: 2, isActive: true },
    { nameKey: "property_titles", nameFr: "Titres de Propriété et Documents Fonciers", nameEn: "Property Titles and Land Documents", icon: "FileCheck", color: "#059669", sortOrder: 3, isActive: true },
    { nameKey: "damage_proofs", nameFr: "Preuves de la Matérialité des Dommages", nameEn: "Material Damage Proofs", icon: "AlertTriangle", color: "#dc2626", sortOrder: 4, isActive: true },
    { nameKey: "correspondence", nameFr: "Correspondances et Actes d'Huissier", nameEn: "Correspondence and Bailiff Acts", icon: "Mail", color: "#7c3aed", sortOrder: 5, isActive: true },
    { nameKey: "health_moral", nameFr: "Santé et Préjudice Moral", nameEn: "Health and Moral Damage", icon: "Heart", color: "#ec4899", sortOrder: 6, isActive: true },
    { nameKey: "site_reports", nameFr: "État des lieux et Constats", nameEn: "Site Reports and Findings", icon: "ClipboardList", color: "#0891b2", sortOrder: 7, isActive: true },
    { nameKey: "legal_fees", nameFr: "Honoraires d'avocat et Frais de Justice", nameEn: "Legal Fees and Court Costs", icon: "DollarSign", color: "#65a30d", sortOrder: 8, isActive: true },
    { nameKey: "formal_notices", nameFr: "Mises en Demeure et Sommations", nameEn: "Formal Notices and Summons", icon: "Bell", color: "#ea580c", sortOrder: 9, isActive: true },
    { nameKey: "agreements", nameFr: "Protocoles d'Accord", nameEn: "Agreements and Protocols", icon: "Handshake", color: "#8b5cf6", sortOrder: 10, isActive: true },
    { nameKey: "summons", nameFr: "Assignations et Citations", nameEn: "Summons and Citations", icon: "Gavel", color: "#0369a1", sortOrder: 11, isActive: true },
    { nameKey: "jurisprudence", nameFr: "Jurisprudence et Précédents", nameEn: "Case Law and Precedents", icon: "BookOpen", color: "#4338ca", sortOrder: 12, isActive: true },
    { nameKey: "media_proofs", nameFr: "Preuves Photographiques et Vidéos", nameEn: "Photographic and Video Evidence", icon: "Camera", color: "#be123c", sortOrder: 13, isActive: true },
    { nameKey: "contracts", nameFr: "Contrats et Engagements Commerciaux", nameEn: "Contracts and Commercial Commitments", icon: "FileSignature", color: "#0d9488", sortOrder: 14, isActive: true },
    { nameKey: "others", nameFr: "AUTRES (Documents divers)", nameEn: "OTHERS (Miscellaneous Documents)", icon: "FolderOpen", color: "#64748b", sortOrder: 15, isActive: true },
  ];

  for (const cat of defaultCategories) {
    await db.insert(categories).values(cat);
  }
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(doc);
  return Number((result as any).insertId);
}

export async function getAllDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(eq(documents.isDeleted, false))
    .orderBy(desc(documents.uploadedAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.isDeleted, false)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDocumentsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.categoryId, categoryId), eq(documents.isDeleted, false)))
    .orderBy(desc(documents.uploadedAt));
}

export async function searchDocuments(params: {
  query?: string;
  categoryId?: number;
  startDate?: Date;
  endDate?: Date;
  uploadedBy?: number;
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(documents.isDeleted, false)];

  if (params.query) {
    conditions.push(
      or(
        like(documents.fileName, `%${params.query}%`),
        like(documents.description, `%${params.query}%`)
      )!
    );
  }

  if (params.categoryId) {
    conditions.push(eq(documents.categoryId, params.categoryId));
  }

  if (params.startDate) {
    conditions.push(gte(documents.uploadedAt, params.startDate));
  }

  if (params.endDate) {
    conditions.push(lte(documents.uploadedAt, params.endDate));
  }

  if (params.uploadedBy) {
    conditions.push(eq(documents.uploadedBy, params.uploadedBy));
  }

  return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.uploadedAt));
}

export async function softDeleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set({ isDeleted: true, updatedAt: new Date() }).where(eq(documents.id, id));
}

export async function getDocumentStats() {
  const db = await getDb();
  if (!db) return { total: 0, byCategory: [] };

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(eq(documents.isDeleted, false));

  const byCategory = await db
    .select({
      categoryId: documents.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(documents)
    .where(eq(documents.isDeleted, false))
    .groupBy(documents.categoryId);

  return {
    total: total[0]?.count || 0,
    byCategory,
  };
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export async function getPermissionsByRole(role: "admin" | "avocat" | "expert" | "observateur") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentPermissions).where(eq(documentPermissions.role, role));
}

export async function createPermission(perm: InsertDocumentPermission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentPermissions).values(perm);
  return Number((result as any).insertId);
}

export async function initializeDefaultPermissions() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(documentPermissions).limit(1);
  if (existing.length > 0) return;

  const cats = await getAllCategories();

  for (const cat of cats) {
    // Admin: full access
    await db.insert(documentPermissions).values({
      role: "admin",
      categoryId: cat.id,
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
    });

    // Avocat: view, upload, edit
    await db.insert(documentPermissions).values({
      role: "avocat",
      categoryId: cat.id,
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: false,
    });

    // Expert: view, upload
    await db.insert(documentPermissions).values({
      role: "expert",
      categoryId: cat.id,
      canView: true,
      canUpload: true,
      canEdit: false,
      canDelete: false,
    });

    // Observateur: view only
    await db.insert(documentPermissions).values({
      role: "observateur",
      categoryId: cat.id,
      canView: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
    });
  }
}

// ============================================================================
// TIMELINE EVENTS
// ============================================================================

export async function createTimelineEvent(event: InsertTimelineEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timelineEvents).values(event);
  return Number((result as any).insertId);
}

export async function getAllTimelineEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timelineEvents).orderBy(desc(timelineEvents.eventDate));
}

export async function getTimelineEventsByType(eventType: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timelineEvents).where(eq(timelineEvents.eventType, eventType as any)).orderBy(desc(timelineEvents.eventDate));
}

export async function searchTimelineEvents(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(timelineEvents)
    .where(
      or(
        like(timelineEvents.titleFr, `%${query}%`),
        like(timelineEvents.titleEn, `%${query}%`),
        like(timelineEvents.descriptionFr, `%${query}%`),
        like(timelineEvents.descriptionEn, `%${query}%`)
      )!
    )
    .orderBy(desc(timelineEvents.eventDate));
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(log);
  return Number((result as any).insertId);
}

export async function getAllAuditLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);
}

export async function getAuditLogsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt));
}

export async function getAuditLogsByAction(action: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.action, action)).orderBy(desc(auditLogs.createdAt));
}

// ============================================================================
// CASE INFO
// ============================================================================

export async function getCaseInfo() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(caseInfo).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCaseInfo(info: Partial<typeof caseInfo.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getCaseInfo();

  if (existing) {
    await db.update(caseInfo).set({ ...info, updatedAt: new Date() }).where(eq(caseInfo.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(caseInfo).values(info as any);
    return Number((result as any).insertId);
  }
}

// ============================================================================
// SAVED SEARCHES
// ============================================================================

export async function createSavedSearch(userId: number, searchName: string, searchCriteria: object) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedSearches).values({
    userId,
    searchName,
    searchCriteria: JSON.stringify(searchCriteria),
  });
  return Number((result as any).insertId);
}

export async function getSavedSearchesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedSearches).where(eq(savedSearches.userId, userId)).orderBy(desc(savedSearches.createdAt));
}
