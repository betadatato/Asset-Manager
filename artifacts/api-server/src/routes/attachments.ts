import path from "path";
import fs from "fs";
import express, { Router, type IRouter } from "express";
import multer from "multer";
import { eq, asc } from "drizzle-orm";
import { db, cvsTable, attachmentsTable } from "@workspace/db";

const router: IRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads", "attachments");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

// GET /cvs/:id/attachments — list all attachments for a CV
router.get("/cvs/:id/attachments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid CV id" }); return; }

  const [cv] = await db.select({ id: cvsTable.id }).from(cvsTable).where(eq(cvsTable.id, id));
  if (!cv) { res.status(404).json({ error: "CV not found" }); return; }

  const rows = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.cvId, id))
    .orderBy(asc(attachmentsTable.sortOrder), asc(attachmentsTable.createdAt));

  res.json(rows);
});

// POST /cvs/:id/attachments — upload a file
router.post(
  "/cvs/:id/attachments",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid CV id" }); return; }

    const [cv] = await db.select({ id: cvsTable.id }).from(cvsTable).where(eq(cvsTable.id, id));
    if (!cv) { res.status(404).json({ error: "CV not found" }); return; }

    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

    const label = typeof req.body.label === "string" ? req.body.label.trim() || null : null;

    const [row] = await db
      .insert(attachmentsTable)
      .values({
        cvId: id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        label,
        sortOrder: 0,
      })
      .returning();

    res.status(201).json(row);
  }
);

// PATCH /cvs/:id/attachments/:attachId — rename the label
router.patch("/cvs/:id/attachments/:attachId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawAttachId = Array.isArray(req.params.attachId) ? req.params.attachId[0] : req.params.attachId;
  const cvId = parseInt(rawId, 10);
  const attachId = parseInt(rawAttachId, 10);
  if (isNaN(cvId) || isNaN(attachId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const label = typeof req.body.label === "string" ? req.body.label.trim() || null : null;

  const [row] = await db
    .update(attachmentsTable)
    .set({ label })
    .where(eq(attachmentsTable.id, attachId))
    .returning();

  if (!row) { res.status(404).json({ error: "Attachment not found" }); return; }
  res.json(row);
});

// DELETE /cvs/:id/attachments/:attachId — remove an attachment
router.delete("/cvs/:id/attachments/:attachId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawAttachId = Array.isArray(req.params.attachId) ? req.params.attachId[0] : req.params.attachId;
  const cvId = parseInt(rawId, 10);
  const attachId = parseInt(rawAttachId, 10);
  if (isNaN(cvId) || isNaN(attachId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.id, attachId));

  if (!row) { res.status(404).json({ error: "Attachment not found" }); return; }

  // Delete file from disk (with traversal guard)
  const filePath = path.join(uploadDir, row.filename);
  if (filePath.startsWith(uploadDir + path.sep) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await db.delete(attachmentsTable).where(eq(attachmentsTable.id, attachId));
  res.status(204).end();
});

// Serve attachment files safely
router.use("/uploads/attachments", express.static(uploadDir, { dotfiles: "deny" }));

export default router;
