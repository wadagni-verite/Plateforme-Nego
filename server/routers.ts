import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import crypto from "crypto";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Helper to log audit
async function logAudit(params: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  detailsFr: string;
  detailsEn: string;
  metadata?: object;
  req: any;
}) {
  await db.createAuditLog({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    detailsFr: params.detailsFr,
    detailsEn: params.detailsEn,
    ipAddress: params.req.ip || params.req.headers["x-forwarded-for"] || "unknown",
    userAgent: params.req.headers["user-agent"] || "unknown",
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
  });
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================
  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),

    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["admin", "avocat", "expert", "observateur"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);
        await logAudit({
          userId: ctx.user.id,
          action: "update_user_role",
          entityType: "user",
          entityId: input.userId,
          detailsFr: `Rôle modifié en ${input.role}`,
          detailsEn: `Role changed to ${input.role}`,
          req: ctx.req,
        });
        return { success: true };
      }),

    deactivate: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deactivateUser(input.userId);
        await logAudit({
          userId: ctx.user.id,
          action: "deactivate_user",
          entityType: "user",
          entityId: input.userId,
          detailsFr: "Utilisateur désactivé",
          detailsEn: "User deactivated",
          req: ctx.req,
        });
        return { success: true };
      }),
  }),

  // ============================================================================
  // CATEGORIES
  // ============================================================================
  categories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategoryById(input.id);
      }),
  }),

  // ============================================================================
  // DOCUMENTS
  // ============================================================================
  documents: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllDocuments();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.id);
        if (doc) {
          await logAudit({
            userId: ctx.user.id,
            action: "view_document",
            entityType: "document",
            entityId: input.id,
            detailsFr: `Document consulté: ${doc.fileName}`,
            detailsEn: `Document viewed: ${doc.fileName}`,
            req: ctx.req,
          });
        }
        return doc;
      }),

    getByCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByCategory(input.categoryId);
      }),

    upload: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check permissions
        const permissions = await db.getPermissionsByRole(ctx.user.role);
        const canUpload = permissions.find(p => p.categoryId === input.categoryId && p.canUpload);
        if (!canUpload) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No upload permission for this category" });
        }

        // Decode base64
        const buffer = Buffer.from(input.fileData, "base64");
        const fileSize = buffer.length;

        // Generate SHA-256 hash
        const hash = crypto.createHash("sha256");
        hash.update(buffer);
        const sha256Hash = hash.digest("hex");

        // Upload to S3
        const timestamp = Date.now();
        const randomSuffix = crypto.randomBytes(8).toString("hex");
        const s3Key = `documents/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.fileName}`;
        const { url: s3Url } = await storagePut(s3Key, buffer, input.mimeType);

        // Create timestamp proof
        const timestampProof = JSON.stringify({
          uploadedAt: new Date().toISOString(),
          uploadedBy: ctx.user.id,
          sha256: sha256Hash,
          fileName: input.fileName,
          fileSize,
        });

        // Save to database
        const docId = await db.createDocument({
          categoryId: input.categoryId,
          uploadedBy: ctx.user.id,
          fileName: input.fileName,
          fileSize,
          mimeType: input.mimeType,
          s3Key,
          s3Url,
          sha256Hash,
          timestampProof,
          description: input.description,
          tags: input.tags ? JSON.stringify(input.tags) : undefined,
        });

        // Log audit
        await logAudit({
          userId: ctx.user.id,
          action: "upload_document",
          entityType: "document",
          entityId: docId,
          detailsFr: `Document uploadé: ${input.fileName}`,
          detailsEn: `Document uploaded: ${input.fileName}`,
          metadata: { categoryId: input.categoryId, fileSize, sha256Hash },
          req: ctx.req,
        });

        // Create timeline event
        await db.createTimelineEvent({
          eventType: "document_upload",
          titleFr: `Document uploadé: ${input.fileName}`,
          titleEn: `Document uploaded: ${input.fileName}`,
          descriptionFr: input.description,
          descriptionEn: input.description,
          actorId: ctx.user.id,
          relatedDocumentId: docId,
          eventDate: new Date(),
        });

        return { success: true, documentId: docId, sha256Hash, s3Url };
      }),

    search: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        categoryId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        uploadedBy: z.number().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchDocuments(input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
        }

        // Check permissions
        const permissions = await db.getPermissionsByRole(ctx.user.role);
        const canDelete = permissions.find(p => p.categoryId === doc.categoryId && p.canDelete);
        if (!canDelete) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No delete permission for this category" });
        }

        await db.softDeleteDocument(input.id);

        await logAudit({
          userId: ctx.user.id,
          action: "delete_document",
          entityType: "document",
          entityId: input.id,
          detailsFr: `Document supprimé: ${doc.fileName}`,
          detailsEn: `Document deleted: ${doc.fileName}`,
          req: ctx.req,
        });

        await db.createTimelineEvent({
          eventType: "document_delete",
          titleFr: `Document supprimé: ${doc.fileName}`,
          titleEn: `Document deleted: ${doc.fileName}`,
          actorId: ctx.user.id,
          relatedDocumentId: input.id,
          eventDate: new Date(),
        });

        return { success: true };
      }),

    stats: protectedProcedure.query(async () => {
      return await db.getDocumentStats();
    }),
  }),

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: router({
    getByRole: protectedProcedure
      .input(z.object({ role: z.enum(["admin", "avocat", "expert", "observateur"]) }))
      .query(async ({ input }) => {
        return await db.getPermissionsByRole(input.role);
      }),

    myPermissions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPermissionsByRole(ctx.user.role);
    }),
  }),

  // ============================================================================
  // TIMELINE
  // ============================================================================
  timeline: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTimelineEvents();
    }),

    getByType: protectedProcedure
      .input(z.object({ eventType: z.string() }))
      .query(async ({ input }) => {
        return await db.getTimelineEventsByType(input.eventType);
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchTimelineEvents(input.query);
      }),

    create: protectedProcedure
      .input(z.object({
        eventType: z.enum(["milestone", "meeting", "deadline", "custom"]),
        titleFr: z.string(),
        titleEn: z.string(),
        descriptionFr: z.string().optional(),
        descriptionEn: z.string().optional(),
        eventDate: z.date(),
        metadata: z.object({}).passthrough().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const eventId = await db.createTimelineEvent({
          ...input,
          actorId: ctx.user.id,
          metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        });

        await logAudit({
          userId: ctx.user.id,
          action: "create_timeline_event",
          entityType: "timeline_event",
          entityId: eventId,
          detailsFr: `Événement créé: ${input.titleFr}`,
          detailsEn: `Event created: ${input.titleEn}`,
          req: ctx.req,
        });

        return { success: true, eventId };
      }),
  }),

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================
  audit: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllAuditLogs();
    }),

    getByUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAuditLogsByUser(input.userId);
      }),

    getByAction: protectedProcedure
      .input(z.object({ action: z.string() }))
      .query(async ({ input }) => {
        return await db.getAuditLogsByAction(input.action);
      }),
  }),

  // ============================================================================
  // CASE INFO
  // ============================================================================
  caseInfo: router({
    get: protectedProcedure.query(async () => {
      return await db.getCaseInfo();
    }),

    update: adminProcedure
      .input(z.object({
        caseNumber: z.string().optional(),
        titleFr: z.string().optional(),
        titleEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        descriptionEn: z.string().optional(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        status: z.enum(["active", "pending", "closed", "archived"]).optional(),
        clientName: z.string().optional(),
        opposingParty: z.string().optional(),
        jurisdiction: z.string().optional(),
        startDate: z.date().optional(),
        expectedEndDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const caseId = await db.upsertCaseInfo(input);

        await logAudit({
          userId: ctx.user.id,
          action: "update_case_info",
          entityType: "case_info",
          entityId: caseId,
          detailsFr: "Informations du dossier mises à jour",
          detailsEn: "Case information updated",
          req: ctx.req,
        });

        return { success: true, caseId };
      }),
  }),

  // ============================================================================
  // SAVED SEARCHES
  // ============================================================================
  savedSearches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedSearchesByUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        searchName: z.string(),
        searchCriteria: z.object({}).passthrough(),
      }))
      .mutation(async ({ input, ctx }) => {
        const searchId = await db.createSavedSearch(ctx.user.id, input.searchName, input.searchCriteria);
        return { success: true, searchId };
      }),
  }),
});

export type AppRouter = typeof appRouter;
