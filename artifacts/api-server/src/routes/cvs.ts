import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, cvsTable, experiencesTable, educationsTable, languagesTable } from "@workspace/db";
import {
  ListCvsResponse,
  CreateCvBody,
  CreateCvResponse,
  GetCvParams,
  GetCvResponse,
  UpdateCvParams,
  UpdateCvBody,
  UpdateCvResponse,
  DeleteCvParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper: load a full CV with related data
async function loadFullCv(id: number) {
  const [cv] = await db.select().from(cvsTable).where(eq(cvsTable.id, id));
  if (!cv) return null;

  const [experiences, educations, languages] = await Promise.all([
    db.select().from(experiencesTable).where(eq(experiencesTable.cvId, id)).orderBy(asc(experiencesTable.sortOrder)),
    db.select().from(educationsTable).where(eq(educationsTable.cvId, id)).orderBy(asc(educationsTable.sortOrder)),
    db.select().from(languagesTable).where(eq(languagesTable.cvId, id)).orderBy(asc(languagesTable.sortOrder)),
  ]);

  return { ...cv, experiences, educations, languages };
}

// GET /cvs
router.get("/cvs", async (_req, res): Promise<void> => {
  const cvs = await db
    .select({
      id: cvsTable.id,
      fullName: cvsTable.fullName,
      email: cvsTable.email,
      mainColor: cvsTable.mainColor,
      createdAt: cvsTable.createdAt,
      updatedAt: cvsTable.updatedAt,
    })
    .from(cvsTable)
    .orderBy(asc(cvsTable.createdAt));
  res.json(ListCvsResponse.parse(cvs));
});

// POST /cvs
router.post("/cvs", async (req, res): Promise<void> => {
  const parsed = CreateCvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cv] = await db
    .insert(cvsTable)
    .values({
      ...parsed.data,
      mainColor: parsed.data.mainColor ?? "#003399",
      useGraphics: parsed.data.useGraphics ?? true,
    })
    .returning();

  const full = await loadFullCv(cv.id);
  res.status(201).json(CreateCvResponse.parse(full));
});

// GET /cvs/:id
router.get("/cvs/:id", async (req, res): Promise<void> => {
  const params = GetCvParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const full = await loadFullCv(params.data.id);
  if (!full) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  res.json(GetCvResponse.parse(full));
});

// PUT /cvs/:id
router.put("/cvs/:id", async (req, res): Promise<void> => {
  const params = UpdateCvParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(cvsTable).where(eq(cvsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  await db
    .update(cvsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(cvsTable.id, params.data.id));

  const full = await loadFullCv(params.data.id);
  res.json(UpdateCvResponse.parse(full));
});

// DELETE /cvs/:id
router.delete("/cvs/:id", async (req, res): Promise<void> => {
  const params = DeleteCvParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(cvsTable).where(eq(cvsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  await db.delete(cvsTable).where(eq(cvsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
