import { Router } from "express";
import { GenerateAdd } from "../controllers/generateController";
import { DownloadCsv } from "../controllers/csvDownloadController";
import { AllBalance } from "../controllers/balanceController";
import { BatchSender } from "../controllers/batchSenderController";

const router = Router();

router.post("/generate", GenerateAdd);
router.get("/download/:filename", DownloadCsv);
router.get("/allbalance/:address", AllBalance);
router.post("/batch-transaction", BatchSender);

export default router;