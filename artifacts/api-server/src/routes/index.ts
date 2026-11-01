import { Router, type IRouter } from "express";
import healthRouter from "./health";
import locationsRouter from "./locations/index.js";
import chatRouter from "./chat/index.js";
import billingRouter from "./billing/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(locationsRouter);
router.use(chatRouter);
router.use(billingRouter);

export default router;
