import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["technical", "behavioral", "case"],
    },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    durationSec: { type: Number, required: true, min: 1, max: 180 },
    transcript: { type: String, default: "" },
    audioFile: {
      originalName: { type: String, required: true },
      storedName: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      storagePath: { type: String, required: true },
    },
    speechMetrics: {
      wordCount: { type: Number, default: 0 },
      fillerWordCount: { type: Number, default: 0 },
      pauseCount: { type: Number, default: 0 },
      wordsPerMinute: { type: Number, default: 0 },
      disfluencyRatio: { type: Number, default: 0 },
    },
    scores: {
      relevance: { type: Number, required: true, min: 0, max: 100 },
      technicalDepth: { type: Number, required: true, min: 0, max: 100 },
      clarity: { type: Number, required: true, min: 0, max: 100 },
      fluency: { type: Number, required: true, min: 0, max: 100 },
      speechFlowScore: { type: Number, required: true, min: 0, max: 100 },
      overall: { type: Number, required: true, min: 0, max: 100 },
    },
    strongPoints: { type: [String], default: [] },
    weakPoints: { type: [String], default: [] },
    feedback: { type: String, default: "" },
    aiMeta: {
      transcriptionMs: { type: Number, default: 0 },
      evaluationMs: { type: Number, default: 0 },
    },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const processingLockSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    startedAt: { type: Date, required: true, default: Date.now },
    requestId: { type: String, default: "" },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },
    interviewType: {
      type: String,
      required: true,
      trim: true,
      enum: ["technical", "behavioral", "case"],
      default: "behavioral",
    },
    difficulty: {
      type: String,
      required: true,
      trim: true,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    resumeFile: {
      originalName: { type: String, required: true },
      storedName: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      storagePath: { type: String, required: true },
    },
    parsedResumeText: {
      type: String,
      default: "",
    },
    generatedQuestions: {
      type: [questionSchema],
      default: [],
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    processingLocks: {
      type: [processingLockSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    aiMeta: {
      model: { type: String, default: "" },
      latencyMs: { type: Number, default: 0 },
      inputCharCount: { type: Number, default: 0 },
      requestedCount: { type: Number, default: 0 },
      returnedCount: { type: Number, default: 0 },
      avoidedRecentCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

export default InterviewSession;
