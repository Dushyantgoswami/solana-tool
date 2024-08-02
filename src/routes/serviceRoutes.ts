import { Router } from "express";
import { GenerateAdd } from "../controllers/generateController";
import { DownloadCsv } from "../controllers/csvDownloadController";
import { AllBalance } from "../controllers/balanceController";

const router = Router();

router.post("/generate", GenerateAdd);
router.get("/download/:filename", DownloadCsv);
router.get("/allbalance/:address", AllBalance);

export default router;