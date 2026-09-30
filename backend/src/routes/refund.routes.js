import { Router } from "express";

import {
  createRefundRequest,
  getRefundRequests,
  getRefundRequestById,
  takeRefundAction,
} from "../controllers/refund.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| CREATE REFUND REQUEST
|--------------------------------------------------------------------------
*/

router.post("/", createRefundRequest);

/*
|--------------------------------------------------------------------------
| LIST REFUND REQUESTS
|--------------------------------------------------------------------------
*/

router.get("/", getRefundRequests);

/*
|--------------------------------------------------------------------------
| SUPPORT REFUND ACTIONS
|--------------------------------------------------------------------------
|
| APPROVE
| DENY
| ESCALATE
|
| These routes intentionally come before:
|
| GET /:requestId
|
| so the action endpoint is resolved correctly.
|--------------------------------------------------------------------------
*/

router.post("/:requestId/action/:action", takeRefundAction);

/*
|--------------------------------------------------------------------------
| GET SINGLE REFUND REQUEST
|--------------------------------------------------------------------------
*/

router.get("/:requestId", getRefundRequestById);

export default router;
