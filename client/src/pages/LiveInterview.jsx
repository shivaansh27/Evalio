import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

const RECORD_STATE = {
  IDLE: "idle",
  RECORDING: "recording",
  RECORDED: "recorded",
  SUBMITTING: "submitting",
  SUBMITTED: "submitted",
  SKIPPED: "skipped",
};

const TIME_LIMIT_OPTIONS = [
  { label: "No Limit", value: 0 },
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
];

const getRecordStateMessage = (recordState, evaluationMessage) => {
  if (evaluationMessage) return evaluationMessage;

  switch (recordState) {
    case RECORD_STATE.RECORDING:
      return "Recording in progress...";
    case RECORD_STATE.RECORDED:
      return "Recorded. Submit your answer.";
    case RECORD_STATE.SUBMITTING:
      return "Evaluating your answer...";
    case RECORD_STATE.SUBMITTED:
      return "Answer submitted. Move to next question.";
    case RECORD_STATE.SKIPPED:
      return "Question skipped. Move to next question.";
    default:
      return "Press Start Recording when ready.";
  }
};

// Exit Confirmation Modal
function ExitConfirmationModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <h3 className="text-center text-lg font-semibold text-gray-900">
          Leave Interview?
        </h3>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your progress will be saved, but unanswered questions will remain
          incomplete. Are you sure you want to exit?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Continue Interview
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Exit Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveInterview() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [userName, setUserName] = useState("");
  const [greetingPlayed, setGreetingPlayed] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [time, setTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordState, setRecordState] = useState(RECORD_STATE.IDLE);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [answeredIds, setAnsweredIds] = useState(() => new Set());
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isTranscriptSupported, setIsTranscriptSupported] = useState(true);
  const [transcriptNotice, setTranscriptNotice] = useState("");
  const [skippedIds, setSkippedIds] = useState(() => new Set());
  const [timeLimit, setTimeLimit] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartRef = useRef(0);
  const audioCacheRef = useRef(new Map());
  const activeAudioRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalizedTranscriptRef = useRef("");
  const countdownIntervalRef = useRef(null);
  const ttsAbortControllerRef = useRef(null);
  const currentPlayingQuestionRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const currentQuestionText =
    typeof currentQuestion?.text === "string" && currentQuestion.text.trim()
      ? currentQuestion.text
      : "Waiting for question...";

  const answeredCount = useMemo(
    () => questions.filter((q) => answeredIds.has(q.id)).length,
    [questions, answeredIds],
  );

  const skippedCount = useMemo(
    () => questions.filter((q) => skippedIds.has(q.id)).length,
    [questions, skippedIds],
  );

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((currentIndex + 1) / questions.length) * 100);
  }, [currentIndex, questions.length]);

  const isLastQuestion = currentIndex >= questions.length - 1;
  const currentQuestionAnswered = currentQuestionId
    ? answeredIds.has(currentQuestionId)
    : false;
  const currentQuestionSkipped = currentQuestionId
    ? skippedIds.has(currentQuestionId)
    : false;
  const currentQuestionCompleted =
    currentQuestionAnswered || currentQuestionSkipped;

  const canStartRecording =
    recordState === RECORD_STATE.IDLE &&
    !currentQuestionCompleted &&
    Boolean(currentQuestionId);
  const canStopRecording = recordState === RECORD_STATE.RECORDING;
  const canSubmit =
    recordState === RECORD_STATE.RECORDED && Boolean(recordedAudio?.blob);
  const canSkip =
    (recordState === RECORD_STATE.IDLE ||
      recordState === RECORD_STATE.RECORDED) &&
    !currentQuestionCompleted &&
    Boolean(currentQuestionId);
  const canNext =
    (recordState === RECORD_STATE.SUBMITTED ||
      recordState === RECORD_STATE.SKIPPED) &&
    currentQuestionCompleted;

  const isInterviewInProgress = useMemo(() => {
    const hasUnanswered = questions.some(
      (q) => !answeredIds.has(q.id) && !skippedIds.has(q.id),
    );
    return hasUnanswered && !loading && !loadError;
  }, [questions, answeredIds, skippedIds, loading, loadError]);

  const cancelSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }
    currentPlayingQuestionRef.current = null;
  };

  const stopLiveTranscript = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(0);
  }, []);

  useEffect(() => {
    if (!isInterviewInProgress) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isInterviewInProgress]);

  const handleExitClick = () => {
    if (isInterviewInProgress) {
      setShowExitModal(true);
    } else {
      navigate("/dashboard");
    }
  };

  const handleExitConfirm = () => {
    cancelSpeech();
    stopLiveTranscript();
    stopCountdown();
    setShowExitModal(false);
    navigate("/dashboard");
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const startLiveTranscript = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsTranscriptSupported(false);
      setTranscriptNotice("Live transcript is not supported in this browser.");
      return;
    }

    setIsTranscriptSupported(true);
    setTranscriptNotice("");
    finalizedTranscriptRef.current = "";
    setLiveTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finals = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcriptChunk = result[0]?.transcript || "";
        if (result.isFinal) {
          finals += `${transcriptChunk} `;
        } else {
          interim += transcriptChunk;
        }
      }

      if (finals) {
        finalizedTranscriptRef.current += finals;
      }

      const merged = `${finalizedTranscriptRef.current}${interim}`.trim();
      setLiveTranscript(merged);
    };

    recognition.onerror = () => {
      setTranscriptNotice("Live transcript unavailable for this recording.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const speakQuestionFallback = useCallback(
    (text) => {
      if (!voiceEnabled) return;
      if (!text || text === "Waiting for question...") return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      cancelSpeech();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled],
  );

  const preloadQuestionAudio = useCallback(
    async (questionId, text) => {
      if (!sessionId || !questionId || !text) return;
      if (audioCacheRef.current.has(questionId)) return;

      try {
        const response = await apiFetch(`/api/interview/${sessionId}/tts`, {
          method: "POST",
          body: JSON.stringify({ questionId, text }),
        });

        if (!response.ok) return;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioCacheRef.current.set(questionId, url);
      } catch {
        // Silent fail for preload
      }
    },
    [sessionId],
  );

  const playQuestionAudio = useCallback(
    async (questionId, text) => {
      if (!voiceEnabled) return;
      if (!questionId || !text || text === "Waiting for question...") return;

      cancelSpeech();
      currentPlayingQuestionRef.current = questionId;
      setSubmitError("");
      setEvaluationMessage("Playing AI voice question...");

      const cachedUrl = audioCacheRef.current.get(questionId);
      if (cachedUrl) {
        if (currentPlayingQuestionRef.current !== questionId) return;
        const audio = new Audio(cachedUrl);
        activeAudioRef.current = audio;
        await audio.play();
        if (currentPlayingQuestionRef.current === questionId) {
          setEvaluationMessage("");
        }
        return;
      }

      const abortController = new AbortController();
      ttsAbortControllerRef.current = abortController;

      try {
        const response = await apiFetch(`/api/interview/${sessionId}/tts`, {
          method: "POST",
          body: JSON.stringify({ questionId, text }),
          signal: abortController.signal,
        });

        if (currentPlayingQuestionRef.current !== questionId) return;

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message || "TTS request failed");
        }

        const blob = await response.blob();
        if (currentPlayingQuestionRef.current !== questionId) return;

        const url = URL.createObjectURL(blob);
        audioCacheRef.current.set(questionId, url);
        const audio = new Audio(url);
        activeAudioRef.current = audio;
        await audio.play();
        if (currentPlayingQuestionRef.current === questionId) {
          setEvaluationMessage("");
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        if (currentPlayingQuestionRef.current !== questionId) return;
        console.error("TTS playback failed, using browser fallback:", error);
        setEvaluationMessage("Using fallback voice.");
        speakQuestionFallback(text);
      }
    },
    [sessionId, voiceEnabled, speakQuestionFallback],
  );

  const getInterviewTypeName = (type) => {
    switch (type) {
      case "technical":
        return "technical";
      case "behavioral":
        return "behavioral";
      case "case":
        return "case study";
      default:
        return "";
    }
  };

  const playGreeting = useCallback(async () => {
    if (!voiceEnabled || !userName || !interviewType || !sessionId) {
      setGreetingPlayed(true);
      return;
    }

    cancelSpeech();
    const typeName = getInterviewTypeName(interviewType);
    const greetingText = `Hi ${userName}, today I am here to take your ${typeName} interview. Let's begin with the first question.`;

    setEvaluationMessage("Starting interview...");

    const abortController = new AbortController();
    ttsAbortControllerRef.current = abortController;

    try {
      const response = await apiFetch(`/api/interview/${sessionId}/tts`, {
        method: "POST",
        body: JSON.stringify({ questionId: "greeting", text: greetingText }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudioRef.current = audio;

      audio.onended = () => {
        setGreetingPlayed(true);
        setEvaluationMessage("");
      };
      audio.onerror = () => {
        setGreetingPlayed(true);
        setEvaluationMessage("");
      };

      await audio.play();
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Greeting TTS failed, using fallback:", error);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(greetingText);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => {
          setGreetingPlayed(true);
          setEvaluationMessage("");
        };
        utterance.onerror = () => {
          setGreetingPlayed(true);
          setEvaluationMessage("");
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setGreetingPlayed(true);
        setEvaluationMessage("");
      }
    }
  }, [voiceEnabled, userName, interviewType, sessionId]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setLoadError("Missing interview session id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError("");
      const response = await apiFetch(`/api/interview/${sessionId}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load interview session.");
      }

      const sessionQuestions = Array.isArray(data?.questions)
        ? data.questions
        : [];
      const answered = new Set(
        Array.isArray(data?.answeredQuestionIds)
          ? data.answeredQuestionIds
          : [],
      );
      const firstPendingIndex = sessionQuestions.findIndex(
        (q) => !answered.has(q.id),
      );

      setQuestions(sessionQuestions);
      setInterviewType(data?.interviewType || "");
      setDifficulty(data?.difficulty || "");
      setUserName(data?.userName || "");
      setGreetingPlayed(false);
      setAnsweredIds(answered);
      setCurrentIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0);
      setRecordState(
        firstPendingIndex === -1 && sessionQuestions.length
          ? RECORD_STATE.SUBMITTED
          : RECORD_STATE.IDLE,
      );
      setRecordedAudio(null);
      setTime(0);
      setEvaluationMessage("");
      setSubmitError("");
    } catch (error) {
      setLoadError(error.message || "Failed to load interview session.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (loading || !questions.length || !userName || !interviewType) return;

    const typeName = getInterviewTypeName(interviewType);
    const greetingText = `Hi ${userName}, today I am here to take your ${typeName} interview. Let's begin with the first question.`;
    preloadQuestionAudio("greeting", greetingText);

    const firstQ = questions[0];
    if (firstQ?.id && firstQ?.text) {
      preloadQuestionAudio(firstQ.id, firstQ.text);
    }
    const secondQ = questions[1];
    if (secondQ?.id && secondQ?.text) {
      preloadQuestionAudio(secondQ.id, secondQ.text);
    }
  }, [loading, questions, userName, interviewType, preloadQuestionAudio]);

  useEffect(() => {
    if (!questions.length) return;

    const nextQ = questions[currentIndex + 1];
    if (nextQ?.id && nextQ?.text) {
      preloadQuestionAudio(nextQ.id, nextQ.text);
    }
    const afterNextQ = questions[currentIndex + 2];
    if (afterNextQ?.id && afterNextQ?.text) {
      preloadQuestionAudio(afterNextQ.id, afterNextQ.text);
    }
  }, [currentIndex, questions, preloadQuestionAudio]);

  useEffect(() => {
    if (loading || loadError) return;
    if (!greetingPlayed && currentIndex === 0) {
      playGreeting();
      return;
    }
    if (greetingPlayed || currentIndex > 0) {
      playQuestionAudio(currentQuestionId, currentQuestionText);
    }
  }, [
    currentQuestionId,
    currentQuestionText,
    loadError,
    loading,
    playQuestionAudio,
    greetingPlayed,
    currentIndex,
    playGreeting,
  ]);

  useEffect(() => {
    if (recordState !== RECORD_STATE.RECORDING) return undefined;

    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [recordState]);

  useEffect(() => {
    if (!currentQuestionId) return;

    setRecordedAudio(null);
    setTime(0);
    setCountdown(0);
    setEvaluationMessage("");
    setSubmitError("");
    setLiveTranscript("");
    setTranscriptNotice("");
    finalizedTranscriptRef.current = "";

    if (answeredIds.has(currentQuestionId)) {
      setRecordState(RECORD_STATE.SUBMITTED);
    } else if (skippedIds.has(currentQuestionId)) {
      setRecordState(RECORD_STATE.SKIPPED);
    } else {
      setRecordState(RECORD_STATE.IDLE);
    }
  }, [currentIndex, currentQuestionId, answeredIds, skippedIds]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      stopLiveTranscript();
      stopCountdown();
      for (const url of audioCacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      audioCacheRef.current.clear();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopLiveTranscript, stopCountdown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    if (!currentQuestionId || recordState === RECORD_STATE.SUBMITTING) return;

    try {
      cancelSpeech();
      setSubmitError("");
      setEvaluationMessage("Recording started.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, {
            mimeType: preferredMimeType,
            audioBitsPerSecond: 128000,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - recordingStartRef.current) / 1000),
        );
        setRecordedAudio({
          blob,
          durationSec,
          mimeType: recorder.mimeType || "audio/webm",
        });
        setRecordState(RECORD_STATE.RECORDED);
        setEvaluationMessage("Recording stopped. Ready to submit.");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recordingStartRef.current = Date.now();
      recorder.start();
      startLiveTranscript();
      setTime(0);
      setRecordState(RECORD_STATE.RECORDING);

      if (timeLimit > 0) {
        setCountdown(timeLimit);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              stopRecording();
              stopCountdown();
              setEvaluationMessage("Time's up! Recording auto-stopped.");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setSubmitError("Microphone access denied or unavailable.");
      setEvaluationMessage("");
      console.error("Error starting recording:", error);
      setRecordState(RECORD_STATE.IDLE);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    stopLiveTranscript();
    stopCountdown();
  };

  const skipQuestion = () => {
    if (!canSkip) return;

    cancelSpeech();
    if (recordState === RECORD_STATE.RECORDING) {
      stopRecording();
    }

    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.add(currentQuestionId);
      return next;
    });
    setRecordState(RECORD_STATE.SKIPPED);
    setRecordedAudio(null);
    setEvaluationMessage("Question skipped.");
  };

  const submitCurrentAnswer = async () => {
    if (recordState === RECORD_STATE.RECORDING) {
      stopRecording();
      setSubmitError("Recording stopped. Click Submit Answer again.");
      return;
    }

    if (!recordedAudio?.blob) {
      setSubmitError("Please record your answer before submitting.");
      return;
    }

    if (!currentQuestionId) {
      setSubmitError("Question is missing id. Please reload interview.");
      return;
    }

    setRecordState(RECORD_STATE.SUBMITTING);
    setSubmitError("");
    setEvaluationMessage("Evaluating your answer...");

    try {
      const fileExt = recordedAudio.mimeType?.includes("wav") ? "wav" : "webm";
      const file = new File(
        [recordedAudio.blob],
        `${currentQuestionId}.${fileExt}`,
        {
          type: recordedAudio.mimeType || "audio/webm",
        },
      );

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("questionId", currentQuestionId);
      formData.append("durationSec", String(recordedAudio.durationSec));

      const response = await apiFetch(`/api/interview/${sessionId}/answers`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 202) {
        setRecordState(RECORD_STATE.RECORDED);
        setEvaluationMessage("Answer is processing. Retry in a few seconds.");
        return;
      }

      if (!response.ok) {
        setRecordState(RECORD_STATE.RECORDED);
        setSubmitError(data?.message || "Failed to evaluate answer.");
        setEvaluationMessage("");
        return;
      }

      setAnsweredIds((prev) => {
        const next = new Set(prev);
        next.add(currentQuestionId);
        return next;
      });
      setRecordState(RECORD_STATE.SUBMITTED);
      setEvaluationMessage("Answer submitted and evaluated.");
    } catch (error) {
      setRecordState(RECORD_STATE.RECORDED);
      setSubmitError("Failed to submit answer. Please retry.");
      setEvaluationMessage("");
      console.error("Error submitting answer:", error);
    }
  };

  const handleNext = () => {
    if (
      !currentQuestionCompleted ||
      (recordState !== RECORD_STATE.SUBMITTED &&
        recordState !== RECORD_STATE.SKIPPED)
    ) {
      setSubmitError("Submit or skip this question before moving to the next.");
      return;
    }

    cancelSpeech();

    if (isLastQuestion) {
      navigate(`/report/${sessionId}`);
      return;
    }

    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const getStatusConfig = () => {
    if (recordState === RECORD_STATE.RECORDING) {
      return { label: "Recording", color: "bg-red-500", animate: true };
    }
    if (recordState === RECORD_STATE.SUBMITTING) {
      return { label: "Evaluating", color: "bg-amber-500", animate: true };
    }
    if (recordState === RECORD_STATE.SUBMITTED) {
      return {
        label: "Answer Submitted",
        color: "bg-emerald-500",
        animate: false,
      };
    }
    if (recordState === RECORD_STATE.SKIPPED) {
      return {
        label: "Skipped",
        color: "bg-orange-500",
        animate: false,
      };
    }
    if (recordState === RECORD_STATE.RECORDED) {
      return { label: "Ready to Submit", color: "bg-blue-500", animate: false };
    }
    return { label: "Idle", color: "bg-slate-400", animate: false };
  };

  const statusConfig = getStatusConfig();
  const normalizedLiveTranscript = liveTranscript.trim();

  const transcriptDisplayText = (() => {
    if (recordState === RECORD_STATE.RECORDING) {
      return normalizedLiveTranscript || "Listening...";
    }
    if (
      recordState === RECORD_STATE.RECORDED ||
      recordState === RECORD_STATE.SUBMITTED ||
      recordState === RECORD_STATE.SUBMITTING
    ) {
      return normalizedLiveTranscript || "(No live transcript captured)";
    }
    return "Your spoken response will appear here while you record.";
  })();

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 text-gray-900">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 30px 8px rgba(239, 68, 68, 0.5); }
        }
        .recording-pulse {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        .orb-ring {
          animation: orb-pulse 2s ease-in-out infinite;
        }
        .btn-elevated {
          transition: all 0.2s ease;
        }
        .btn-elevated:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.15);
        }
        .btn-elevated:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      {loading ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 h-8 w-11/12 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-4/5 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto mt-10 h-32 w-32 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      ) : loadError ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold text-red-700">
              Unable to load interview
            </p>
            <p className="mt-2 text-sm text-red-600">{loadError}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchSession}
                className="btn-elevated inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
              <button
                type="button"
                onClick={() => navigate("/setup")}
                className="btn-elevated rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Back to Setup
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />{" "}
                  LIVE
                </span>
                <h1 className="text-base font-semibold text-gray-900 md:text-lg">
                  Interview Session
                </h1>
              </div>

              <div className="flex items-center gap-2 text-xs md:text-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-700">
                  {(interviewType || "interview").toUpperCase()}
                </span>
                {difficulty && (
                  <span className="rounded-full bg-indigo-100 px-3 py-1.5 font-medium text-indigo-700">
                    {difficulty.toUpperCase()}
                  </span>
                )}
                <span className="rounded-full bg-gray-100 px-3 py-1.5 font-mono text-gray-700">
                  {formatTime(time)}
                </span>
                <button
                  type="button"
                  onClick={handleExitClick}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Exit
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 overflow-hidden p-3 md:flex-row md:gap-4 md:p-4">
            <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              <section className="shrink-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold tracking-wider text-blue-600">
                    QUESTION{" "}
                    {Math.min(currentIndex + 1, Math.max(questions.length, 1))}{" "}
                    OF {questions.length || 1}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {(interviewType || "interview").toUpperCase()}
                  </span>
                </div>
                <div className="max-h-[180px] overflow-y-auto md:max-h-[220px]">
                  <h2 className="text-base font-semibold leading-relaxed text-gray-900 md:text-lg lg:text-xl">
                    {currentQuestionText}
                  </h2>
                </div>
              </section>

              <section className="flex flex-1 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-6">
                {recordState === RECORD_STATE.RECORDING && timeLimit > 0 && (
                  <div
                    className={`mb-4 flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg font-bold ${
                      countdown <= 10
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                    {formatTime(countdown)}
                  </div>
                )}

                <div className="relative my-4">
                  {recordState === RECORD_STATE.RECORDING && (
                    <>
                      <div className="orb-ring absolute -inset-3 rounded-full bg-red-400/30" />
                      <div
                        className="orb-ring absolute -inset-6 rounded-full bg-red-400/20"
                        style={{ animationDelay: "0.5s" }}
                      />
                    </>
                  )}
                  <div
                    className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 md:h-24 md:w-24 ${
                      recordState === RECORD_STATE.RECORDING
                        ? "recording-pulse bg-gradient-to-br from-red-500 to-red-600"
                        : recordState === RECORD_STATE.SUBMITTING
                          ? "bg-gradient-to-br from-amber-500 to-amber-600"
                          : recordState === RECORD_STATE.SUBMITTED
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                            : recordState === RECORD_STATE.SKIPPED
                              ? "bg-gradient-to-br from-orange-400 to-orange-500"
                              : "bg-gradient-to-br from-gray-400 to-gray-500"
                    }`}
                  >
                    {recordState === RECORD_STATE.RECORDING ? (
                      <Mic className="h-8 w-8 text-white md:h-10 md:w-10" />
                    ) : recordState === RECORD_STATE.SUBMITTING ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white md:h-10 md:w-10" />
                    ) : recordState === RECORD_STATE.SUBMITTED ? (
                      <CheckCircle2 className="h-8 w-8 text-white md:h-10 md:w-10" />
                    ) : recordState === RECORD_STATE.SKIPPED ? (
                      <SkipForward className="h-8 w-8 text-white md:h-10 md:w-10" />
                    ) : (
                      <MicOff className="h-8 w-8 text-white md:h-10 md:w-10" />
                    )}
                  </div>
                </div>

                <div
                  aria-live="polite"
                  className="mb-5 inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 shadow-sm"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${statusConfig.color} ${statusConfig.animate ? "animate-pulse" : ""}`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {statusConfig.label}
                  </span>
                </div>

                {submitError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                {(!isTranscriptSupported || transcriptNotice) && (
                  <p className="mb-4 text-sm text-amber-600">
                    {transcriptNotice ||
                      "Live transcript is not supported in this browser."}
                  </p>
                )}

                <div className="w-full max-w-md border-t border-gray-200 my-2" />

                <div className="hidden w-full max-w-2xl flex-wrap items-center justify-center gap-3 pt-4 md:flex">
                  <div className="flex items-center gap-3">
                    {recordState === RECORD_STATE.RECORDING ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="btn-elevated recording-pulse inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg"
                      >
                        <MicOff className="h-4 w-4" /> Stop Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={!canStartRecording}
                        className="btn-elevated inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                      >
                        <Mic className="h-4 w-4" /> Start Recording
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={submitCurrentAnswer}
                      disabled={!canSubmit}
                      className="btn-elevated inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {recordState === RECORD_STATE.SUBMITTING ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canNext}
                      className="btn-elevated inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {isLastQuestion ? "Finish" : "Next"}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <button
                      type="button"
                      onClick={() =>
                        playQuestionAudio(
                          currentQuestionId,
                          currentQuestionText,
                        )
                      }
                      disabled={!voiceEnabled || !currentQuestionText}
                      className="btn-elevated inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Volume2 className="h-4 w-4" /> Replay
                    </button>

                    <button
                      type="button"
                      onClick={skipQuestion}
                      disabled={!canSkip}
                      className="btn-elevated inline-flex items-center gap-1.5 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-xs font-medium text-orange-600 hover:border-orange-400 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <SkipForward className="h-4 w-4" /> Skip
                    </button>
                  </div>
                </div>
              </section>
            </main>

            <aside className="flex w-full min-h-0 flex-col gap-3 md:w-72 lg:w-80">
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Progress
                  </h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Question {currentIndex + 1} of {questions.length} •{" "}
                  {answeredCount} answered
                  {skippedCount > 0 && ` • ${skippedCount} skipped`}
                </p>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="shrink-0 flex items-center justify-between border-b border-gray-200 px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Transcript
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] ${
                      recordState === RECORD_STATE.RECORDING
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {recordState === RECORD_STATE.RECORDING && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    )}
                    {recordState === RECORD_STATE.RECORDING
                      ? "Listening..."
                      : normalizedLiveTranscript
                        ? "Captured"
                        : "Idle"}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words text-gray-700">
                    {transcriptDisplayText}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => setVoiceEnabled((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs transition-colors hover:bg-gray-100"
                >
                  <span className="inline-flex items-center gap-2 font-medium text-gray-700">
                    {voiceEnabled ? (
                      <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    AI Voice
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      voiceEnabled
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {voiceEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-900">
                    Time Limit
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIME_LIMIT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeLimit(option.value)}
                      disabled={recordState === RECORD_STATE.RECORDING}
                      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                        timeLimit === option.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-3 md:hidden">
            <div className="mx-auto flex max-w-lg items-center justify-center gap-2">
              {recordState === RECORD_STATE.RECORDING ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="recording-pulse flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-bold text-white"
                >
                  <span className="flex items-center justify-center gap-2">
                    <MicOff className="h-4 w-4" /> Stop
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!canStartRecording}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Mic className="h-4 w-4" /> Record
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={submitCurrentAnswer}
                disabled={!canSubmit}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <span className="flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" /> Submit
                </span>
              </button>
              <button
                type="button"
                onClick={skipQuestion}
                disabled={!canSkip}
                className="rounded-xl bg-orange-100 px-3 py-3 text-sm font-bold text-orange-600 disabled:opacity-40"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLastQuestion ? "Finish" : "Next"}{" "}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ExitConfirmationModal
        isOpen={showExitModal}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
    </div>
  );
}
