import path from "path";
import fs from "fs";
import express, { Router, type IRouter } from "express";
import multer from "multer";
import { eq } from "drizzle-orm";
import { db, cvsTable } from "@workspace/db";

const router: IRouter = Router();

// Store uploads in a persistent directory
const uploadDir = path.join(process.cwd(), "uploads", "photos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /cvs/:id/photo
router.post("/cvs/:id/photo", upload.single("photo"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid CV id" });
    return;
  }

  const [cv] = await db.select().from(cvsTable).where(eq(cvsTable.id, id));
  if (!cv) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // Delete old photo if it exists and is a local file
  if (cv.photoUrl && cv.photoUrl.startsWith("/api/uploads/")) {
    const oldFilename = cv.photoUrl.replace("/api/uploads/photos/", "");
    const oldPath = path.join(uploadDir, oldFilename);
    // Ensure old path is inside uploadDir (no traversal)
    if (oldPath.startsWith(uploadDir + path.sep) && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const photoUrl = `/api/uploads/photos/${req.file.filename}`;

  await db
    .update(cvsTable)
    .set({ photoUrl, updatedAt: new Date() })
    .where(eq(cvsTable.id, id));

  res.json({ photoUrl });
});

// Serve uploaded photo files safely — express.static prevents path traversal
router.use("/uploads/photos", express.static(uploadDir, { dotfiles: "deny" }));

export default router;
