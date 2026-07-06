import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cvsTable, languagesTable } from "@workspace/db";
import {
  CreateLanguageParams,
  CreateLanguageBody,
  CreateLanguageResponse,
  UpdateLanguageParams,
  UpdateLanguageBody,
  UpdateLanguageResponse,
  DeleteLanguageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// POST /cvs/:id/languages
router.post("/cvs/:id/languages", async (req, res): Promise<void> => {
  const params = CreateLanguageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateLanguageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cv] = await db.select().from(cvsTable).where(eq(cvsTable.id, params.data.id));
  if (!cv) {
    res.status(404).json({ error: "CV not found" });
    return;
  }

  const [lang] = await db
    .insert(languagesTable)
    .values({ ...parsed.data, cvId: params.data.id, sortOrder: parsed.data.sortOrder ?? 0 })
    .returning();

  res.status(201).json(CreateLanguageResponse.parse(lang));
});

// PUT /cvs/:id/languages/:langId
router.put("/cvs/:id/languages/:langId", async (req, res): Promise<void> => {
  const params = UpdateLanguageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLanguageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(languagesTable)
    .where(and(eq(languagesTable.id, params.data.langId), eq(languagesTable.cvId, params.data.id)));

  if (!existing) {
    res.status(404).json({ error: "Language not found" });
    return;
  }

  const [lang] = await db
    .update(languagesTable)
    .set(parsed.data)
    .where(eq(languagesTable.id, params.data.langId))
    .returning();

  res.json(UpdateLanguageResponse.parse(lang));
});

// DELETE /cvs/:id/languages/:langId
router.delete("/cvs/:id/languages/:langId", async (req, res): Promise<void> => {
  const params = DeleteLanguageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(languagesTable)
    .where(and(eq(languagesTable.id, params.data.langId), eq(languagesTable.cvId, params.data.id)));

  if (!existing) {
    res.status(404).json({ error: "Language not found" });
    return;
  }

  await db.delete(languagesTable).where(eq(languagesTable.id, params.data.langId));
  res.sendStatus(204);
});

export default router;
