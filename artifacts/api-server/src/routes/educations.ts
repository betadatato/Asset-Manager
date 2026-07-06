import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cvsTable, educationsTable } from "@workspace/db";
import {
  CreateEducationParams,
  CreateEducationBody,
  CreateEducationResponse,
  UpdateEducationParams,
  UpdateEducationBody,
  UpdateEducationResponse,
  DeleteEducationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// POST /cvs/:id/educations
router.post("/cvs/:id/educations", async (req, res): Promise<void> => {
  const params = CreateEducationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateEducationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cv] = await db.select().from(cvsTable).where(eq(cvsTable.id, params.data.id));
  if (!cv) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  const [edu] = await db
    .insert(educationsTable)
    .values({ ...parsed.data, cvId: params.data.id, sortOrder: parsed.data.sortOrder ?? 0 })
    .returning();

  res.status(201).json(CreateEducationResponse.parse(edu));
});

// PUT /cvs/:id/educations/:eduId
router.put("/cvs/:id/educations/:eduId", async (req, res): Promise<void> => {
  const params = UpdateEducationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEducationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(educationsTable)
    .where(and(eq(educationsTable.id, params.data.eduId), eq(educationsTable.cvId, params.data.id)));

  if (!existing) {
    res.status(404).json({ error: "Education not found" });
    return;
  }

  const [edu] = await db
    .update(educationsTable)
    .set(parsed.data)
    .where(eq(educationsTable.id, params.data.eduId))
    .returning();

  res.json(UpdateEducationResponse.parse(edu));
});

// DELETE /cvs/:id/educations/:eduId
router.delete("/cvs/:id/educations/:eduId", async (req, res): Promise<void> => {
  const params = DeleteEducationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(educationsTable)
    .where(and(eq(educationsTable.id, params.data.eduId), eq(educationsTable.cvId, params.data.id)));

  if (!existing) {
    res.status(404).json({ error: "Education not found" });
    return;
  }

  await db.delete(educationsTable).where(eq(educationsTable.id, params.data.eduId));
  res.sendStatus(204);
});

export default router;
