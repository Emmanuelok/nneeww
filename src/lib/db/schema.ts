import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export const planEnum = pgEnum("plan", ["trial", "solo", "team", "multi"]);
export const roleEnum = pgEnum("role", ["owner", "admin", "recruiter"]);
export const postingStatusEnum = pgEnum("posting_status", [
  "draft",
  "live",
  "taken_down",
  "archived",
]);
export const vacancyStatusEnum = pgEnum("vacancy_status", [
  "existing_vacancy",
  "pipeline",
  "not_disclosed",
]);
export const checkStatusEnum = pgEnum("check_status", ["pass", "warn", "fail"]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "overdue",
]);
export const notificationMethodEnum = pgEnum("notification_method", [
  "email",
  "in_person",
  "written",
]);
export const decisionEnum = pgEnum("decision", [
  "made",
  "not_made",
  "no_hire",
]);
export const retentionItemTypeEnum = pgEnum("retention_item_type", [
  "posting",
  "form",
  "notification",
]);

// -----------------------------------------------------------------------------
// Core tenancy
// -----------------------------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").default("trial").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  province: text("province").notNull(),
  employeeCountBucket: text("employee_count_bucket").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseUid: uuid("supabase_uid").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").default("recruiter").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.orgId, t.userId] }),
    userIdx: index("memberships_user_idx").on(t.userId),
  })
);

// -----------------------------------------------------------------------------
// Postings & compliance
// -----------------------------------------------------------------------------

export const jobPostings = pgTable("job_postings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  postingUrl: text("posting_url"),
  rawText: text("raw_text"),
  vacancyStatus: vacancyStatusEnum("vacancy_status").default("not_disclosed").notNull(),
  aiUsed: boolean("ai_used").default(false).notNull(),
  aiDisclosureText: text("ai_disclosure_text"),
  compensationMin: integer("compensation_min"),
  compensationMax: integer("compensation_max"),
  compensationCurrency: text("compensation_currency").default("CAD").notNull(),
  jurisdiction: text("jurisdiction").default("ca_on").notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  takenDownAt: timestamp("taken_down_at", { withTimezone: true }),
  status: postingStatusEnum("status").default("draft").notNull(),
  retentionUntil: timestamp("retention_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationForms = pgTable("application_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  postingId: uuid("posting_id")
    .notNull()
    .references(() => jobPostings.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  postingId: uuid("posting_id")
    .notNull()
    .references(() => jobPostings.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  emailHash: text("email_hash"),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  postingId: uuid("posting_id")
    .notNull()
    .references(() => jobPostings.id, { onDelete: "cascade" }),
  interviewDate: timestamp("interview_date", { withTimezone: true }).notNull(),
  isFinal: boolean("is_final").default(false).notNull(),
  notes: text("notes"),
  recordedByUserId: uuid("recorded_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidateNotifications = pgTable("candidate_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  postingId: uuid("posting_id")
    .notNull()
    .references(() => jobPostings.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  lastInterviewDate: timestamp("last_interview_date", { withTimezone: true }).notNull(),
  deadlineDate: timestamp("deadline_date", { withTimezone: true }).notNull(),
  notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
  notificationMethod: notificationMethodEnum("notification_method"),
  decision: decisionEnum("decision"),
  deliveryProofUrl: text("delivery_proof_url"),
  status: notificationStatusEnum("status").default("pending").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jurisdictions = pgTable("jurisdictions", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  statuteUrl: text("statute_url"),
  rulesJson: jsonb("rules_json"),
});

export const complianceChecks = pgTable("compliance_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  postingId: uuid("posting_id")
    .notNull()
    .references(() => jobPostings.id, { onDelete: "cascade" }),
  checkType: text("check_type").notNull(),
  status: checkStatusEnum("status").notNull(),
  message: text("message").notNull(),
  citation: text("citation"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
});

export const retentionVaultItems = pgTable("retention_vault_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  itemType: retentionItemTypeEnum("item_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  fileUrl: text("file_url"),
  archivedAt: timestamp("archived_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("audit_log_org_idx").on(t.orgId),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type JobPosting = typeof jobPostings.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type CandidateNotification = typeof candidateNotifications.$inferSelect;
