import { Router } from "express";

import { getOrders } from "../controllers/order.controller.js";

const router = Router();

router.get("/", getOrders);

export default router;
