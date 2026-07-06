import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cvsTable, experiencesTable } from "@workspace/db";
import {
  CreateExperienceParams,
  CreateExperienceBody,
  CreateExperienceResponse,
  UpdateExperienceParams,
  UpdateExperienceBody,
  UpdateExperienceResponse,
  DeleteExperienceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// POST /cvs/:id/experiences
router.post("/cvs/:id/experiences", async (req, res): Promise<void> => {
  const params = CreateExperienceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cv] = await db.select().from(cvsTable).where(eq(cvsTable.id, params.data.id));
  if (!cv) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  const [exp] = await db
    .insert(experiencesTable)
    .values({ ...parsed.data, cvId: params.data.id, sortOrder: parsed.data.sortOrder ?? 0 })
    .returning();

  res.status(201).json(CreateExperienceResponse.parse(exp));
});

// PUT /cvs/:id/experiences/:expId
router.put("/cvs/:id/experiences/:expId", async (req, res): Promise<void> => {
  const params = UpdateExperienceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExperienceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(experiencesTable)
    .where(and(eq(experiencesTable.id, params.data.expId), eq(experiencesTable.cvId, params.data.id)));

  if (!existing) {
    res.status(404).json({ error: "Experience not found" });
    return;
  }

  const [exp] = await db
    .update(experiencesTable)
    .set(parsed.data)
    .where(eq(experiencesTable.id, params.data.expId))
    .returning();

  res.json(UpdateExperienceResponse.parse(exp));
});

// DELETE /cvs/:id/experiences/:expId
router.delete("/cvs/:id/experiences/:expId", async (req, res): Promise<void> => {
  const params = DeleteExperienceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(experiencesTable)
    .where(and(eq(experiencesTable.id, params.data.expId), eq(experiencesTable.cvId, params.data.id)));

  if (!existing) {
    res.status(404).json({ error: "Experience not found" });
    return;
  }

  await db.delete(experiencesTable).where(eq(experiencesTable.id, params.data.expId));
  res.sendStatus(204);
});

export default router;
