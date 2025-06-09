import express from "express";
import {
  startNewclickController,
  stopRepoController,
  stopAllReposController,
  getReposController,
} from "../controllers/index.ts";

const router = express.Router();

router.get("/repos", getReposController);
router.post("/start", startNewclickController);
router.post("/stop", stopRepoController);
router.post("/stop-all", stopAllReposController);

export default router;
