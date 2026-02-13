import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table with extended role system for legal platform
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "avocat", "expert", "observateur"]).default("observateur").notNull(),
  organization: text("organization"),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Document categories (15 predefined categories)
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  nameKey: varchar("nameKey", { length: 100 }).notNull().unique(), // For i18n: "contracts", "expertise_reports", etc.
  nameFr: text("nameFr").notNull(),
  nameEn: text("nameEn").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Lucide icon name
  color: varchar("color", { length: 20 }).notNull(), // Hex color for UI
  sortOrder: int("sortOrder").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Documents with S3 storage and SHA-256 hashing
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: text("fileName").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(), // bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  s3Key: text("s3Key").notNull(),
  s3Url: text("s3Url").notNull(),
  sha256Hash: varchar("sha256Hash", { length: 64 }).notNull(), // Proof of integrity
  timestampProof: text("timestampProof"), // JSON with timestamp certificate
  description: text("description"),
  tags: text("tags"), // JSON array of tags
  version: int("version").default(1).notNull(),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Document permissions per role and category
 */
export const documentPermissions = mysqlTable("documentPermissions", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["admin", "avocat", "expert", "observateur"]).notNull(),
  categoryId: int("categoryId").notNull(),
  canView: boolean("canView").default(false).notNull(),
  canUpload: boolean("canUpload").default(false).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  canDelete: boolean("canDelete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Timeline events for case chronology
 */
export const timelineEvents = mysqlTable("timelineEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", [
    "document_upload",
    "document_view",
    "document_edit",
    "document_delete",
    "user_login",
    "user_action",
    "milestone",
    "meeting",
    "deadline",
    "custom"
  ]).notNull(),
  titleFr: text("titleFr").notNull(),
  titleEn: text("titleEn").notNull(),
  descriptionFr: text("descriptionFr"),
  descriptionEn: text("descriptionEn"),
  actorId: int("actorId"), // User who triggered the event
  relatedDocumentId: int("relatedDocumentId"),
  metadata: text("metadata"), // JSON for additional data
  eventDate: timestamp("eventDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit log for complete traceability
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // "upload_document", "view_document", "delete_user", etc.
  entityType: varchar("entityType", { length: 50 }).notNull(), // "document", "user", "category", etc.
  entityId: int("entityId"),
  detailsFr: text("detailsFr").notNull(),
  detailsEn: text("detailsEn").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  metadata: text("metadata"), // JSON for additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Case information (main case details)
 */
export const caseInfo = mysqlTable("caseInfo", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 100 }).unique(),
  titleFr: text("titleFr").notNull(),
  titleEn: text("titleEn").notNull(),
  descriptionFr: text("descriptionFr"),
  descriptionEn: text("descriptionEn"),
  amount: bigint("amount", { mode: "number" }), // Amount in cents (e.g., 4000000 euros = 400000000 cents)
  currency: varchar("currency", { length: 3 }).default("EUR"),
  status: mysqlEnum("status", ["active", "pending", "closed", "archived"]).default("active").notNull(),
  clientName: text("clientName"),
  opposingParty: text("opposingParty"),
  jurisdiction: text("jurisdiction"),
  startDate: timestamp("startDate"),
  expectedEndDate: timestamp("expectedEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Saved searches for advanced search functionality
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  searchName: varchar("searchName", { length: 200 }).notNull(),
  searchCriteria: text("searchCriteria").notNull(), // JSON with search parameters
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  timelineEvents: many(timelineEvents),
  auditLogs: many(auditLogs),
  savedSearches: many(savedSearches),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  documents: many(documents),
  permissions: many(documentPermissions),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  category: one(categories, {
    fields: [documents.categoryId],
    references: [categories.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  timelineEvents: many(timelineEvents),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  actor: one(users, {
    fields: [timelineEvents.actorId],
    references: [users.id],
  }),
  relatedDocument: one(documents, {
    fields: [timelineEvents.relatedDocumentId],
    references: [documents.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type InsertDocumentPermission = typeof documentPermissions.$inferInsert;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type CaseInfo = typeof caseInfo.$inferSelect;
export type InsertCaseInfo = typeof caseInfo.$inferInsert;

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;
