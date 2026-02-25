import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  MicOff,
  VideoOff,
  Bot,
  Diamond,
  Code,
  Zap,
  CreditCard,
  Truck,
  Rocket,
  Mic,
  FileText,
  Radar,
  BarChart,
  Languages,
  TerminalSquare,
  Plus,
  Globe,
  Mail,
  MessageSquare,
} from "lucide-react";
import PageTransition from "../components/PageTransition";

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const faqs = [
    {
      question: "How realistic are the interviews?",
      answer:
        "The interviews are generated from your resume and role, with follow-up questions that simulate real interviewer flow for technical and behavioral rounds.",
    },
    {
      question: "Can I upload multiple resumes?",
      answer:
        "Yes. You can upload different resumes for different roles and run separate interview sessions for each target job.",
    },
    {
      question: "Does it support technical coding rounds?",
      answer:
        "Yes. Evalio includes technical question practice and supports coding-focused interview preparation based on your stack and experience.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel anytime from your account settings. Access remains available until the current billing cycle ends.",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen font-sans antialiased bg-white text-slate-900 transition-colors duration-300">
        <div className="bg-zinc-900 text-white text-xs font-medium py-2 text-center px-4">
          <span>
            🚀 Prepare for 500+ Top Indian Companies.{" "}
            <Link to="/signup" className="underline hover:text-gray-300 ml-1">
              Start practicing now →
            </Link>
          </span>
        </div>
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Brain className="text-zinc-900 text-3xl w-8 h-8" />
                <span className="text-xl font-bold tracking-tight text-zinc-900">
                  {" "}
                  Evalio
                </span>
              </div>
              <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
                <a
                  href="#features"
                  className="hover:text-zinc-900 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-zinc-900 transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#testimonials"
                  className="hover:text-zinc-900 transition-colors"
                >
                  Success Stories
                </a>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/signin"
                  className="text-sm font-medium text-slate-600 hover:text-zinc-900 hidden sm:block"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <section className="relative pt-20 pb-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-400/30 blur-3xl float" />
            <div
              className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl float"
              style={{ animationDelay: "3s" }}
            />
            <div
              className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-pink-400/20 to-orange-400/20 blur-3xl float"
              style={{ animationDelay: "1.5s" }}
            />
          </div>
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundSize: "40px 40px",
              backgroundImage:
                "linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
            }}
          ></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-600">
                AI-Powered Interview Coach 2.0 is Live
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 pb-2 bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-500"
            >
              Practice Real Interviews with <br className="hidden md:block" />{" "}
              AI That Understands You.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Tailored mock interviews based on your resume and job description.
              Get instant feedback on voice confidence, technical accuracy, and
              soft skills.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            >
              <Link
                to="/signin"
                className="bg-zinc-900 text-white px-8 py-3.5 rounded-xl font-medium text-base hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 hover-lift"
              >
                Start Free Interview
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-100 rounded-2xl rotate-12 -z-10 animate-pulse"></div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-100 rounded-full -z-10 blur-xl"></div>
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden p-2">
                <div className="rounded-xl overflow-hidden bg-slate-50 border border-zinc-200">
                  <div className="h-10 border-b border-zinc-200 flex items-center px-4 space-x-2 bg-white">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className="flex-1 text-center text-xs text-slate-400">
                      app.evalio.com/interview/session-29
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 h-[500px]">
                    <div className="hidden md:block col-span-1 border-r border-zinc-200 bg-slate-50 p-6">
                      <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Your Resume Analysis
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-200 shadow-sm text-left">
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                            <span className="text-sm font-medium">
                              React.js Experience
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-200 shadow-sm text-left">
                            <AlertCircle className="text-yellow-500 w-5 h-5" />
                            <span className="text-sm font-medium">
                              System Design Gap
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-left">
                          Live Metrics
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Confidence</span>
                              <span className="font-bold text-green-600">
                                High
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 w-[85%]"></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Pacing</span>
                              <span className="font-bold text-blue-600">
                                Good
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 w-[70%]"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 relative bg-slate-900 flex flex-col items-center justify-center p-8">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg mb-6 relative">
                        <span className="absolute w-full h-full rounded-full border-4 border-white/20 animate-ping"></span>
                        <Bot className="text-white w-12 h-12" />
                      </div>
                      <div className="w-full max-w-md bg-black/40 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                        <p className="text-white text-lg font-medium">
                          "Could you explain a challenging technical problem you
                          solved in your last project using Python?"
                        </p>
                        <div className="flex justify-center gap-2 mt-4">
                          <div
                            className="h-8 w-1 bg-indigo-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0s" }}
                          ></div>
                          <div
                            className="h-8 w-1 bg-indigo-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="h-8 w-1 bg-indigo-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="h-8 w-1 bg-indigo-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                      </div>
                      <div className="absolute bottom-6 flex gap-4">
                        <button className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition">
                          <MicOff className="w-6 h-6" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition">
                          <VideoOff className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 border-y border-zinc-200 bg-zinc-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-slate-500 mb-8 uppercase tracking-widest">
              Prepared candidates landed jobs at
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Diamond className="w-6 h-6" /> Infosys
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Code className="w-6 h-6" /> TCS
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Zap className="w-6 h-6" /> Flipkart
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <CreditCard className="w-6 h-6" /> Razorpay
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Truck className="w-6 h-6" /> Zomato
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Rocket className="w-6 h-6" /> CRED
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
                Everything you need to <br />
                ace the interview.
              </h2>
              <p className="text-lg text-slate-600">
                Our AI analyzes thousands of successful interviews to give you
                the competitive edge.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 group-hover:scale-110 transition-transform">
                  <Mic className="text-indigo-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Voice-to-Voice AI
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Interact naturally. Our AI listens to your tone, pace, and
                  clarity, mimicking a real human interviewer.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 group-hover:scale-110 transition-transform">
                  <FileText className="text-blue-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Resume Parsing
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Upload your PDF. We extract your skills and generate specific
                  questions tailored to your experience.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 group-hover:scale-110 transition-transform">
                  <Radar className="text-purple-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Skill Gap Detection
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Identify weak areas before the real interview. Get actionable
                  resources to improve specific technical skills.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 group-hover:scale-110 transition-transform">
                  <BarChart className="text-green-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Behavioral Analysis
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Master the STAR method. Our AI evaluates how well you
                  structure your answers for situational questions.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 group-hover:scale-110 transition-transform">
                  <Languages className="text-orange-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Multi-Language Support
                </h3>
                <h4 className="text-xs font-bold ">Coming Soon....</h4>
                <p className="text-slate-600 leading-relaxed">
                  Practice in English or regional Indian accents to get
                  comfortable with diverse interviewer panels.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-slate-300 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200 group-hover:scale-110 transition-transform">
                  <TerminalSquare className="text-pink-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Live Coding Pad
                </h3>
                <h4 className="text-xs font-bold">Coming Soon....</h4>
                <p className="text-slate-600 leading-relaxed">
                  Integrated code editor for technical rounds. Write, run, and
                  debug code while explaining your logic.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-zinc-50/30 border-y border-zinc-200"
          id="how-it-works"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2 block">
                Process
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                How it works
              </h2>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-zinc-200 -z-10"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center mb-6 shadow-sm mx-auto md:mx-0 z-10">
                    <span className="text-3xl font-bold text-slate-300">
                      01
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center md:text-left">
                    Upload Resume
                  </h3>
                  <p className="text-slate-600 text-sm text-center md:text-left">
                    Drop your CV and paste the Job Description you are
                    targeting.
                  </p>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center mb-6 shadow-sm mx-auto md:mx-0 z-10">
                    <span className="text-3xl font-bold text-slate-300">
                      02
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center md:text-left">
                    AI Interview
                  </h3>
                  <p className="text-slate-600 text-sm text-center md:text-left">
                    Start the 30-min voice session. Answer technical &
                    behavioral questions.
                  </p>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center mb-6 shadow-sm mx-auto md:mx-0 z-10">
                    <span className="text-3xl font-bold text-slate-300">
                      03
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center md:text-left">
                    Instant Analysis
                  </h3>
                  <p className="text-slate-600 text-sm text-center md:text-left">
                    Receive a detailed scorecard on your answers, tone, and
                    confidence.
                  </p>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center mb-6 shadow-sm mx-auto md:mx-0 z-10">
                    <span className="text-3xl font-bold text-slate-300">
                      04
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center md:text-left">
                    Improve & Repeat
                  </h3>
                  <p className="text-slate-600 text-sm text-center md:text-left">
                    Use personalized tips to fix gaps and try again until you're
                    ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-zinc-50/30 border-t border-zinc-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-900">
              Your questions, answered.
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="border-b border-zinc-200 pb-4"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex justify-between items-center w-full text-left font-medium text-slate-900 py-2 focus:outline-none"
                    >
                      <span>{faq.question}</span>
                      <Plus
                        className={`text-slate-400 w-5 h-5 transition-transform duration-200 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </button>
                    {isOpen ? (
                      <p className="pr-8 text-sm text-slate-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="bg-black text-slate-400 py-16 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="text-white w-6 h-6" />
                  <span className="text-xl font-bold text-white">Evalio</span>
                </div>
                <p className="text-sm text-slate-500 mb-6 max-w-xs">
                  The smartest way to prepare for your next interview. AI-driven
                  insights tailored to the Indian job market.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-slate-400 hover:text-white">
                    <Globe className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-white">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      For Enterprise
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Success Stories
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Interview Questions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Resume Guide
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Help Center
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
              <div>© 2026 Evalio Solutions Pvt Ltd.</div>
              <div className="mt-2 md:mt-0 flex gap-4">
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>

        <div className="fixed bottom-6 right-6 z-50">
          <button className="bg-zinc-900 hover:bg-zinc-800 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 press-scale">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
