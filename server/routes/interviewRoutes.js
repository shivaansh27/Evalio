import express from "express";
import protect from "../middleware/authMiddleware.js";
import uploadResume from "../middleware/uploadResume.js";
import uploadAnswerAudio from "../middleware/uploadAnswerAudio.js";
import {
  startInterview,
  getDashboardSummary,
  getInterviewHistory,
  getInterviewSession,
  synthesizeInterviewQuestionAudio,
  submitInterviewAnswer,
  getInterviewReport,
  deleteInterviewSession,
} from "../controllers/interviewController.js";

const router = express.Router();

router.post("/start", protect, uploadResume.single("resume"), startInterview);
router.get("/dashboard/summary", protect, getDashboardSummary);
router.get("/history", protect, getInterviewHistory);
router.post("/:sessionId/tts", protect, synthesizeInterviewQuestionAudio);
router.get("/:sessionId", protect, getInterviewSession);
router.get("/:sessionId/report", protect, getInterviewReport);
router.delete("/:sessionId", protect, deleteInterviewSession);
router.post(
  "/:sessionId/answers",
  protect,
  uploadAnswerAudio.single("audio"),
  submitInterviewAnswer,
);

export default router;
