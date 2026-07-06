import { pgTable, serial, text, boolean, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── CVs ────────────────────────────────────────────────────────────────────

export const cvsTable = pgTable("cvs", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  gender: text("gender"),
  idNumber: text("id_number"),
  passportNumber: text("passport_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  linkedin: text("linkedin"),
  summary: text("summary"),
  digitalSkills: text("digital_skills"),
  hobbies: text("hobbies"),
  drivingLicense: text("driving_license"),
  photoUrl: text("photo_url"),
  mainColor: text("main_color").notNull().default("#003399"),
  useGraphics: boolean("use_graphics").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCvSchema = createInsertSchema(cvsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCv = z.infer<typeof insertCvSchema>;
export type Cv = typeof cvsTable.$inferSelect;

// ─── Experiences ─────────────────────────────────────────────────────────────

export const experiencesTable = pgTable("experiences", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull().references(() => cvsTable.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  employer: text("employer").notNull(),
  city: text("city"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertExperienceSchema = createInsertSchema(experiencesTable).omit({ id: true });
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiencesTable.$inferSelect;

// ─── Educations ──────────────────────────────────────────────────────────────

export const educationsTable = pgTable("educations", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull().references(() => cvsTable.id, { onDelete: "cascade" }),
  degree: text("degree").notNull(),
  institution: text("institution").notNull(),
  city: text("city"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  grade: text("grade"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertEducationSchema = createInsertSchema(educationsTable).omit({ id: true });
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Education = typeof educationsTable.$inferSelect;

// ─── Languages ───────────────────────────────────────────────────────────────

export const attachmentsTable = pgTable("attachments", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id")
    .notNull()
    .references(() => cvsTable.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  label: varchar("label", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const languagesTable = pgTable("languages", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull().references(() => cvsTable.id, { onDelete: "cascade" }),
  languageName: text("language_name").notNull(),
  listening: text("listening"),
  reading: text("reading"),
  spokenInteraction: text("spoken_interaction"),
  spokenProduction: text("spoken_production"),
  writing: text("writing"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertLanguageSchema = createInsertSchema(languagesTable).omit({ id: true });
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languagesTable.$inferSelect;
