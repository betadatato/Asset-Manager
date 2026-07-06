import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cvsRouter from "./cvs";
import experiencesRouter from "./experiences";
import educationsRouter from "./educations";
import languagesRouter from "./languages";
import photoRouter from "./photo";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cvsRouter);
router.use(experiencesRouter);
router.use(educationsRouter);
router.use(languagesRouter);
router.use(photoRouter);
router.use(exportRouter);

export default router;
