"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  User, 
  FileText, 
  Code2, 
  Cpu, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  UploadCloud, 
  Lock, 
  Globe2, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/company-logo";
import { saveFullExperienceAction } from "@/server/actions/experiences";
import { uploadCvAction, toggleCvSharingAction, deleteCvAction } from "@/server/actions/cv";

// ==========================================
// CONSTANTS & TOPIC DICTIONARIES
// ==========================================

const STEPS = [
  { id: 1, name: "Company & Role", short: "Company", icon: Building2 },
  { id: 2, name: "Candidate Details", short: "Candidate", icon: User },
  { id: 3, name: "Online Assessment", short: "OA", icon: Cpu },
  { id: 4, name: "DSA / Coding", short: "DSA", icon: Code2 },
  { id: 5, name: "Fundamentals", short: "CS Basics", icon: Layers },
  { id: 6, name: "Technical Rounds", short: "Rounds", icon: Sparkles },
  { id: 7, name: "Experience Narrative", short: "Story", icon: FileText },
  { id: 8, name: "Preparation & Advice", short: "Advice", icon: BookOpen },
  { id: 9, name: "CV & Privacy", short: "Privacy", icon: ShieldCheck },
  { id: 10, name: "Review & Submit", short: "Review", icon: CheckCircle2 },
];

const PHASES = [
  { title: "Target & Role", stepIds: [1, 2] },
  { title: "Technical Rounds", stepIds: [3, 4, 5] },
  { title: "Story & Narrative", stepIds: [6, 7] },
  { title: "Advice & Submission", stepIds: [8, 9, 10] },
];

const SEEDED_COMPANIES = [
  { id: "google", name: "Google" },
  { id: "microsoft", name: "Microsoft" },
  { id: "amazon", name: "Amazon" },
  { id: "philips", name: "Philips" },
  { id: "wissen", name: "Wissen Technology" },
  { id: "adobe", name: "Adobe" },
  { id: "atlassian", name: "Atlassian" },
  { id: "uber", name: "Uber" },
  { id: "goldmansachs", name: "Goldman Sachs" },
];

const COMMON_ROLES = [
  "Software Development Engineer (SDE 1)",
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Software Engineering Intern",
  "Data Engineer",
  "Machine Learning Engineer",
  "DevOps / Site Reliability Engineer",
  "Systems / Low-Level Engineer",
  "QA / SDET",
  "Product Analyst / APM",
  "Other",
];

const HIRING_CYCLES = [
  "On-Campus",
  "Off-Campus",
  "Referral",
  "Pool Campus Drive",
  "Internship Conversion (PPO)",
  "Lateral / Experienced",
  "Other",
];

const OUTCOME_OPTIONS = [
  { value: "Offer", label: "Selected / Offer", desc: "Received an offer" },
  { value: "Rejected", label: "Rejected", desc: "Did not clear process" },
  { value: "Waitlisted", label: "Waitlisted", desc: "Placed on waitlist / hold" },
  { value: "Withdrew", label: "Withdrawn", desc: "Withdrew from process" },
  { value: "Unknown", label: "Prefer not to say", desc: "Keep outcome private" },
];

const OA_TOPICS = [
  "Arrays", "Strings", "Hashing", "Sorting", "Searching",
  "Linked List", "Stack / Queue", "Trees", "Graphs",
  "Dynamic Programming", "Greedy", "SQL", "Aptitude", "Bit Manipulation"
];

const DSA_TOPICS = [
  "Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window",
  "Binary Search", "Linked List", "Stack", "Queue", "Trees",
  "BST", "Heap / Priority Queue", "Graphs", "Greedy",
  "Dynamic Programming", "Backtracking", "Recursion", "Bit Manipulation",
  "Tries", "Disjoint Set Union (DSU)"
];

const FUNDAMENTAL_SUBJECTS = [
  { id: "DBMS", name: "DBMS", desc: "Database Management Systems & SQL" },
  { id: "Operating Systems", name: "Operating Systems", desc: "Processes, Threads, Concurrency & Memory" },
  { id: "OOP", name: "OOP", desc: "Object-Oriented Programming & Design" },
  { id: "Computer Networks", name: "Computer Networks", desc: "Protocols, OSI, Routing & Web Transport" },
  { id: "SQL", name: "SQL & Query Tuning", desc: "Aggregations, Window Functions & Indexing" },
  { id: "System Design", name: "System Design", desc: "High-level & Low-level System Architecture" },
  { id: "Computer Architecture", name: "Computer Architecture", desc: "CPUs, Cache, Assembly & Hardware" },
  { id: "Software Engineering", name: "Software Engineering", desc: "SDLC, CI/CD, Agile & Code Testing" },
  { id: "Other", name: "Other Fundamentals", desc: "Specialized Computer Science Subjects" },
];

const FUNDAMENTAL_TOPIC_SUGGESTIONS = {
  DBMS: ["Normalization", "Transactions", "ACID Properties", "Indexing & B-Trees", "Joins", "SQL Queries", "Concurrency Control", "Deadlocks", "NoSQL vs SQL"],
  "Operating Systems": ["Processes & Threads", "CPU Scheduling", "Process Synchronization", "Deadlocks", "Memory Management", "Virtual Memory & Paging", "File Systems", "System Calls"],
  OOP: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "SOLID Principles", "Design Patterns", "Interfaces & Abstract Classes", "Object Lifecycles"],
  "Computer Networks": ["TCP/IP Model", "HTTP/HTTPS & WebSockets", "DNS & Resolution", "TCP vs UDP", "OSI Layers", "Routing & Switching", "Subnetting", "SSL/TLS Handshake"],
  SQL: ["Complex Aggregations", "Window Functions", "Index Tuning", "CTEs", "Joins & Subqueries", "Stored Procedures"],
  "System Design": ["High-Level Architecture", "Microservices", "Caching & Redis", "Load Balancing", "Database Sharding", "Message Queues (Kafka/RabbitMQ)", "API Design"],
  "Computer Architecture": ["Pipelining", "Cache Hierarchies", "Instruction Sets", "Memory Alignment"],
  "Software Engineering": ["CI/CD Pipelines", "Unit & Integration Testing", "Agile Methodologies", "Git & Branching Strategies"],
  Other: ["General CS Concepts", "Compiler Design", "Theory of Computation"],
};

const ROUND_TYPES = [
  "Technical Interview",
  "DSA / Coding",
  "Machine Coding",
  "System Design",
  "AI / Debugging",
  "Project Discussion",
  "Resume Discussion",
  "Managerial",
  "HR / Behavioral",
  "Other",
];

const PREPARATION_CATEGORIES = [
  "DSA",
  "Fundamentals (DBMS/OS/CN/OOP)",
  "System Design",
  "Machine Coding",
  "AI / Debugging",
  "Projects & Portfolio",
  "Resume Deep Dives",
  "Aptitude & Logical Reasoning",
  "Communication & Presentation",
  "HR / Behavioral Questions",
  "Other",
];

const makeKey = (prefix = "k") => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

const ensureKeys = (data) => {
  if (!data) return data;
  if (Array.isArray(data.oaQuestions)) {
    data.oaQuestions = data.oaQuestions.map((q, i) => ({ ...q, _key: q._key || makeKey(`oa_${i}`) }));
  }
  if (Array.isArray(data.dsaQuestions)) {
    data.dsaQuestions = data.dsaQuestions.map((q, i) => ({ ...q, _key: q._key || makeKey(`dsa_${i}`) }));
  }
  if (data.fundamentalsData && typeof data.fundamentalsData === "object") {
    for (const subj of Object.keys(data.fundamentalsData)) {
      if (Array.isArray(data.fundamentalsData[subj]?.questions)) {
        data.fundamentalsData[subj].questions = data.fundamentalsData[subj].questions.map((q, i) => ({
          ...q,
          _key: q._key || makeKey(`fund_${subj}_${i}`)
        }));
      }
    }
  }
  if (Array.isArray(data.technicalRounds)) {
    data.technicalRounds = data.technicalRounds.map((r, i) => ({
      ...r,
      _key: r._key || makeKey(`tr_${i}`),
      questions: (r.questions || []).map((q, qi) => ({ ...q, _key: q._key || makeKey(`tr_q_${i}_${qi}`) }))
    }));
  }
  return data;
};

export function ExperienceForm({ initialData, mode = "create", companies = [], initialCv = null }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [submittingAction, setSubmittingAction] = React.useState(null); // 'draft' | 'published' | null
  const loading = submittingAction !== null;
  const [error, setError] = React.useState("");
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [savedExperienceId, setSavedExperienceId] = React.useState(initialData?.id || null);

  // Available companies (combine props + fallback defaults)
  const allCompanies = React.useMemo(() => {
    const list = [...(companies || [])];
    for (const sc of SEEDED_COMPANIES) {
      if (!list.some(c => c.id === sc.id)) {
        list.push(sc);
      }
    }
    return list;
  }, [companies]);

  // Form State with lazy initializer
  const [formData, setFormData] = React.useState(() => {
    const defaultData = {
      // Step 1: Company & Role
      companyId: initialData?.companyId || "google",
      companyName: initialData?.companyName || "Google",
      role: initialData?.role || "Software Development Engineer (SDE 1)",
      hiringCycle: initialData?.timeline?.includes("Cycle:") ? initialData.timeline.split("Cycle:")[1]?.split("|")[0]?.trim() : "On-Campus",
      year: initialData?.year || new Date().getFullYear(),
      month: "August",
      outcome: initialData?.outcome || "Offer",
      type: initialData?.type || "Full-time",

      // Step 2: Candidate / Process Details
      cgpa: "",
      gradYear: String(new Date().getFullYear()),
      branch: "Computer Science & Engineering",
      roundsCount: initialData?.rounds || 3,
      difficulty: initialData?.difficulty || "Medium",
      timeline: initialData?.timeline || "Aug 2024 - Sep 2024",

      // Step 3: Online Assessment (OA)
      oaEnabled: "Yes",
      oaMode: "Online",
      oaType: "Coding",
      oaPlatform: "HackerRank",
      oaDifficulty: "Medium",
      oaTopics: ["Arrays", "Strings", "Dynamic Programming"],
      oaQuestions: [{ text: "", topic: "Arrays", difficulty: "Medium" }],

      // Step 4: DSA / Coding
      dsaEnabled: "Yes",
      dsaDifficulty: "Medium",
      dsaTopics: ["Trees", "Graphs", "Dynamic Programming", "Sliding Window"],
      dsaQuestions: [{ text: "", topic: "Trees", difficulty: "Medium" }],

      // Step 5: Core CS Fundamentals
      selectedFundamentals: ["DBMS", "Operating Systems", "OOP"],
      fundamentalsData: {
        DBMS: {
          difficulty: "Medium",
          topics: ["Normalization", "Transactions", "ACID Properties", "Indexing & B-Trees"],
          questions: [{ text: "", topic: "Normalization", difficulty: "Medium" }]
        },
        "Operating Systems": {
          difficulty: "Medium",
          topics: ["Processes & Threads", "Deadlocks", "Virtual Memory & Paging"],
          questions: [{ text: "", topic: "Deadlocks", difficulty: "Medium" }]
        },
        OOP: {
          difficulty: "Easy",
          topics: ["Polymorphism", "SOLID Principles", "Design Patterns"],
          questions: [{ text: "", topic: "SOLID Principles", difficulty: "Easy" }]
        },
        "Computer Networks": {
          difficulty: "Medium",
          topics: ["TCP/IP Model", "HTTP/HTTPS & WebSockets", "TCP vs UDP"],
          questions: []
        },
      },

      // Step 6: Other Technical Rounds
      technicalRounds: initialData?.rounds && Array.isArray(initialData.rounds) && initialData.rounds.length > 0 
        ? initialData.rounds.map((r, i) => ({
            roundTypeName: r.roundTypeName || "Technical Interview",
            title: r.title || `Round ${i + 1}`,
            duration: "45 mins",
            difficulty: r.difficulty || "Medium",
            topics: r.topics || [],
            notes: r.summary || "",
            questions: r.questions || [],
            mcProblem: "",
            mcTech: "",
            mcFocus: ["Code Quality", "Architecture", "Edge Cases"],
            aiAreas: ["Debugging", "Code understanding"],
          }))
        : [
            {
              roundTypeName: "Technical Interview",
              title: "Round 1: Problem Solving & Live Coding",
              duration: "60 mins",
              difficulty: "Medium",
              topics: ["Data Structures", "Algorithms", "Optimization"],
              notes: "Live coding on Google Docs / CoderPad with 2 interviewers.",
              questions: [{ text: "", topic: "Data Structures", difficulty: "Medium" }],
              mcProblem: "",
              mcTech: "",
              mcFocus: ["Code Quality", "Architecture"],
              aiAreas: ["Debugging"],
            },
            {
              roundTypeName: "Technical Interview",
              title: "Round 2: Low-Level Design & Core Fundamentals",
              duration: "45 mins",
              difficulty: "Medium",
              topics: ["OOP", "DBMS", "Concurrency"],
              notes: "Discussion on past projects and deep dive into concurrency.",
              questions: [{ text: "", topic: "OOP", difficulty: "Medium" }],
              mcProblem: "",
              mcTech: "",
              mcFocus: [],
              aiAreas: [],
            },
            {
              roundTypeName: "HR / Behavioral",
              title: "Round 3: Behavioral & Culture Fit",
              duration: "30 mins",
              difficulty: "Easy",
              topics: ["Leadership", "Conflict Resolution", "Culture Fit"],
              notes: "Discussion with Engineering Manager.",
              questions: [{ text: "Tell me about a time you resolved a major disagreement in your team.", topic: "Behavioral", difficulty: "Easy" }],
              mcProblem: "",
              mcTech: "",
              mcFocus: [],
              aiAreas: [],
            },
          ],

      // Step 7: Experience Narrative
      summary: initialData?.summary || "Comprehensive interview process focusing on data structures, system fundamentals, and behavioral questions.",
      content: initialData?.content || "",

      // Step 8: Preparation & Advice
      prepCategories: ["DSA", "Fundamentals (DBMS/OS/CN/OOP)", "Projects & Portfolio", "HR / Behavioral Questions"],
      prepNotes: {
        DSA: "Solve medium-level LeetCode problems consistently, focusing on Trees, Graphs, and DP.",
        "Fundamentals (DBMS/OS/CN/OOP)": "Review standard interview questions on indexing, transactions, and threading.",
      },
      advice: "Communicate clearly throughout the coding rounds. State your assumptions before writing code and analyze time & space complexities upfront.",

      // Step 9: CV & Privacy
      isAnonymous: initialData?.isAnonymous ?? false,
      isCvShared: initialCv?.isShared ?? false,
    };

    if (typeof window !== "undefined" && mode === "create" && !initialData) {
      try {
        const saved = localStorage.getItem("experience_form_draft_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            return ensureKeys({ ...defaultData, ...parsed });
          }
        }
      } catch {
        // Ignore local storage error
      }
    }

    return ensureKeys(defaultData);
  });

  // CV State
  const [cv, setCv] = React.useState(initialCv);
  const [cvUploading, setCvUploading] = React.useState(false);
  const [confirmDeleteCv, setConfirmDeleteCv] = React.useState(false);
  const [cvError, setCvError] = React.useState("");
  const cvFileInputRef = React.useRef(null);

  // Custom topic inputs
  const [customOaTopic, setCustomOaTopic] = React.useState("");
  const [customDsaTopic, setCustomDsaTopic] = React.useState("");


  // Persist draft changes
  const saveDraftToLocalStorage = (data) => {
    try {
      localStorage.setItem("experience_form_draft_v2", JSON.stringify(data));
    } catch {
      // Ignore
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      saveDraftToLocalStorage(updated);
      return updated;
    });
  };

  // Company change handler
  const handleCompanyChange = (e) => {
    const value = e.target.value;
    const found = allCompanies.find(c => c.id === value);
    if (found) {
      setFormData(prev => ({
        ...prev,
        companyId: found.id,
        companyName: found.name,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        companyId: value.toLowerCase().replace(/[^a-z0-9]/g, ""),
        companyName: value,
      }));
    }
  };

  // CV Handlers
  const handleCvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvError("");
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setCvError("Please select a valid PDF file (.pdf)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError("File size exceeds 5MB limit.");
      return;
    }

    const cvData = new FormData();
    cvData.append("file", file);

    try {
      setCvUploading(true);
      const res = await uploadCvAction(cvData);
      if (res.success) {
        setCv(res.cv);
        setFormData(prev => ({ ...prev, isCvShared: res.cv.isShared }));
      }
    } catch (err) {
      setCvError(err.message || "Failed to upload CV.");
    } finally {
      setCvUploading(false);
      if (cvFileInputRef.current) cvFileInputRef.current.value = "";
    }
  };

  const handleToggleCvSharing = async (targetShared) => {
    if (!cv) {
      setFormData(prev => ({ ...prev, isCvShared: targetShared }));
      return;
    }
    try {
      setCvUploading(true);
      const res = await toggleCvSharingAction(targetShared);
      if (res.success) {
        setCv(prev => prev ? { ...prev, isShared: targetShared } : null);
        setFormData(prev => ({ ...prev, isCvShared: targetShared }));
      }
    } catch (err) {
      setCvError(err.message || "Failed to toggle CV sharing.");
    } finally {
      setCvUploading(false);
    }
  };

  const handleDeleteCv = async () => {
    try {
      setCvUploading(true);
      const res = await deleteCvAction();
      if (res.success) {
        setCv(null);
        setConfirmDeleteCv(false);
        setFormData(prev => ({ ...prev, isCvShared: false }));
      }
    } catch (err) {
      setCvError(err.message || "Failed to delete CV.");
    } finally {
      setCvUploading(false);
    }
  };

  // Build Normalized Rounds Payload
  const assembleNormalizedRounds = () => {
    const roundsList = [];

    // 1. Online Assessment (if Yes)
    if (formData.oaEnabled === "Yes") {
      const validQuestions = (formData.oaQuestions || []).filter(q => q.text.trim());
      roundsList.push({
        roundTypeName: "Online Assessment",
        title: formData.oaMode !== "N/A" ? `Online Assessment (${formData.oaMode})` : "Online Assessment",
        summary: `Platform: ${formData.oaPlatform || "Online"} | Type: ${formData.oaType || "Mixed"}`,
        difficulty: formData.oaDifficulty || "Medium",
        topics: formData.oaTopics || [],
        questions: validQuestions.map(q => ({
          text: q.text.trim(),
          topic: q.topic || "Online Assessment",
          difficulty: q.difficulty || formData.oaDifficulty || "Medium",
        })),
      });
    }

    // 2. DSA / Coding (if Yes)
    if (formData.dsaEnabled === "Yes") {
      const validQuestions = (formData.dsaQuestions || []).filter(q => q.text.trim());
      roundsList.push({
        roundTypeName: "DSA / Coding",
        title: "Data Structures & Algorithms",
        summary: "Live coding and technical problem solving round.",
        difficulty: formData.dsaDifficulty || "Medium",
        topics: formData.dsaTopics || [],
        questions: validQuestions.map(q => ({
          text: q.text.trim(),
          topic: q.topic || "DSA",
          difficulty: q.difficulty || formData.dsaDifficulty || "Medium",
        })),
      });
    }

    // 3. Core CS Fundamentals (for each selected subject)
    for (const subj of (formData.selectedFundamentals || [])) {
      const data = formData.fundamentalsData[subj] || { difficulty: "Medium", topics: [subj], questions: [] };
      const validQuestions = (data.questions || []).filter(q => q.text.trim());
      roundsList.push({
        roundTypeName: "Technical Interview",
        title: `Core CS Fundamentals: ${subj}`,
        summary: `Conceptual questioning on ${subj}.`,
        difficulty: data.difficulty && data.difficulty !== "Not specified" ? data.difficulty : "Medium",
        topics: data.topics && data.topics.length > 0 ? data.topics : [subj],
        questions: validQuestions.map(q => ({
          text: q.text.trim(),
          topic: q.topic || subj,
          difficulty: q.difficulty || data.difficulty || "Medium",
        })),
      });
    }

    // 4. Other Dynamic Technical Rounds
    for (const tr of (formData.technicalRounds || [])) {
      const validQuestions = (tr.questions || []).filter(q => q.text.trim());
      
      let summaryText = tr.notes || "";
      if (tr.roundTypeName === "Machine Coding" && tr.mcProblem) {
        summaryText = `Problem: ${tr.mcProblem} | Tech: ${tr.mcTech || "N/A"} | Focus: ${(tr.mcFocus || []).join(", ")} | ${summaryText}`;
      } else if (tr.roundTypeName === "AI / Debugging" && tr.aiAreas?.length > 0) {
        summaryText = `Focus Areas: ${tr.aiAreas.join(", ")} | ${summaryText}`;
      }

      roundsList.push({
        roundTypeName: tr.roundTypeName || "Technical Interview",
        title: tr.title || `${tr.roundTypeName} Round`,
        summary: summaryText.trim() || undefined,
        difficulty: tr.difficulty || "Medium",
        topics: Array.isArray(tr.topics) ? tr.topics : [],
        questions: validQuestions.map(q => ({
          text: q.text.trim(),
          topic: q.topic || tr.roundTypeName || "Technical",
          difficulty: q.difficulty || tr.difficulty || "Medium",
        })),
      });
    }

    return roundsList;
  };

  // Compile Rich Narrative & Process Metadata for Content Field
  const assembleCompleteNarrative = () => {
    let narrative = formData.content.trim();
    if (!narrative) {
      narrative = formData.summary.trim();
    }

    const sections = [];
    sections.push(narrative);

    // Append Process & Candidate Metadata
    sections.push(`\n\n### Hiring Process & Details\n- **Cycle:** ${formData.hiringCycle}\n- **Period:** ${formData.month} ${formData.year}\n- **Outcome:** ${formData.outcome}\n${formData.cgpa ? `- **CGPA:** ${formData.cgpa}\n` : ""}- **Total Rounds:** ${formData.roundsCount}\n- **Overall Difficulty:** ${formData.difficulty}`);

    // Append Advice if provided
    if (formData.advice?.trim() || formData.prepCategories?.length > 0) {
      sections.push(`\n\n### Preparation Recommendations & Advice`);
      if (formData.prepCategories?.length > 0) {
        sections.push(`- **Key Focus Areas:** ${formData.prepCategories.join(", ")}`);
      }
      if (formData.advice?.trim()) {
        sections.push(`\n> "${formData.advice.trim()}"`);
      }
    }

    return sections.join("\n");
  };

  // Submit Handler (Draft or Published)
  const handleSubmit = async (targetStatus = "published") => {
    setError("");
    setSubmittingAction(targetStatus);
    setSaveSuccess(false);

    try {
      const normalizedRounds = assembleNormalizedRounds();
      const compiledContent = assembleCompleteNarrative();

      const calculatedRoundsCount = Math.max(
        Number(formData.roundsCount) || 1,
        normalizedRounds.length
      );

      const payload = {
        companyId: formData.companyId.trim(),
        companyName: formData.companyName.trim(),
        role: formData.role.trim(),
        year: Number(formData.year),
        type: formData.type,
        rounds: calculatedRoundsCount,
        difficulty: formData.difficulty,
        studentName: formData.isAnonymous ? "Anonymous" : "Alumni",
        isAnonymous: Boolean(formData.isAnonymous),
        summary: formData.summary.trim() || `${formData.role} interview experience at ${formData.companyName}`,
        content: compiledContent,
        outcome: formData.outcome,
        timeline: `Cycle: ${formData.hiringCycle} | ${formData.month} ${formData.year}`,
        status: targetStatus === "published" ? "draft" : "draft",
      };

      const expIdToUse = savedExperienceId || (mode === "edit" ? initialData?.id : undefined);

      const result = await saveFullExperienceAction({
        id: expIdToUse,
        data: payload,
        rounds: normalizedRounds,
        targetStatus,
      });

      const expId = result?.id || expIdToUse || initialData?.id;
      if (!expId) throw new Error("Could not obtain experience ID");

      if (result?.id) {
        setSavedExperienceId(result.id);
      }

      // Clean local storage draft
      try {
        localStorage.removeItem("experience_form_draft_v2");
      } catch {
        // Ignore
      }

      setSaveSuccess(true);
      router.push(`/experiences/${expId}`);
    } catch (err) {
      setError(err.message || "Failed to submit experience. Please verify required fields.");
      setSubmittingAction(null);
    }
  };

  // Step Validation
  const validateStep = (step) => {
    setError("");
    if (step === 1) {
      if (!formData.companyName.trim()) {
        setError("Company name is required");
        return false;
      }
      if (!formData.role.trim()) {
        setError("Role title is required");
        return false;
      }
    }
    if (step === 7) {
      if (!formData.summary.trim()) {
        setError("A short summary is required to help students preview your experience");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(10, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* ============================================================ */}
      {/* 1. PROFESSIONAL EDITORIAL MILESTONE PIPELINE WIZARD */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-[#ECEAE5] bg-white dark:bg-[var(--surface)] p-5 sm:p-7 shadow-xs space-y-5">
        {/* Milestone Track Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] font-bold text-[#17563F] bg-[#EAF5EF] px-2.5 py-0.5 rounded-full border border-[#D4E8DC] inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#1B635C] animate-pulse" />
                STEP {currentStep} OF 10 · {STEPS[currentStep - 1].short.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-[#63606B]">
                {Math.round((currentStep / 10) * 100)}% Complete
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#111111] dark:text-foreground leading-tight">
              {STEPS[currentStep - 1].name}
            </h2>
          </div>

          {/* Telemetry Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#63606B] bg-[#FAF7F3] px-3 py-1.5 rounded-full border border-[#ECEAE5]">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Structured Verification Mode</span>
          </div>
        </div>

        {/* 4-Phase Architecture Segmented Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {PHASES.map((phase, pIdx) => {
            const isPhaseActive = phase.stepIds.includes(currentStep);
            const isPhaseCompleted = phase.stepIds.every(id => id < currentStep);
            return (
              <div
                key={phase.title}
                className={cn(
                  "p-3 rounded-2xl border transition-all text-left space-y-1.5 relative overflow-hidden",
                  isPhaseActive
                    ? "bg-[#F7FAF9] border-[#1B635C] shadow-2xs ring-1 ring-[#1B635C]/20"
                    : isPhaseCompleted
                    ? "bg-[#FAFDFB] border-[#D4E8DC]"
                    : "bg-[#FAFAFA] border-[#ECEAE5]/70 opacity-75"
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className={isPhaseActive ? "text-[#1B635C]" : isPhaseCompleted ? "text-emerald-700" : "text-[#63606B]"}>
                    PHASE 0{pIdx + 1}
                  </span>
                  {isPhaseCompleted ? (
                    <span className="text-emerald-600 font-sans font-bold text-xs">✓</span>
                  ) : isPhaseActive ? (
                    <span className="size-1.5 rounded-full bg-[#1B635C] animate-pulse" />
                  ) : null}
                </div>
                <div className="font-editorial text-xs sm:text-sm font-bold text-[#111111] dark:text-foreground truncate">
                  {phase.title}
                </div>
                <div className="w-full bg-[#E8E6E0] rounded-full h-1 overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-300 rounded-full", isPhaseActive || isPhaseCompleted ? "bg-[#1B635C]" : "bg-transparent")}
                    style={{
                      width: isPhaseCompleted ? "100%" : isPhaseActive ? `${((phase.stepIds.indexOf(currentStep) + 1) / phase.stepIds.length) * 100}%` : "0%"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Elegant Breadcrumb Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = s.id === currentStep;
            const isPast = s.id < currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (validateStep(currentStep) || s.id < currentStep) {
                    setCurrentStep(s.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-[11.5px] font-medium border cursor-pointer",
                  isCurrent
                    ? "bg-[#1B635C] text-white border-[#1B635C] shadow-xs font-semibold"
                    : isPast
                    ? "bg-white text-[#111111] border-[#D4E8DC] hover:border-[#1B635C]/60"
                    : "bg-white text-[#63606B] border-[#ECEAE5] hover:text-[#111111]"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{s.id}. {s.short}</span>
                {isPast && <Check className="size-3 text-emerald-600 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
          <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Action Required</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1: COMPANY & ROLE */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <div className="bg-card border rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200">
          <div className="border-b border-[#ECEAE5] pb-4">
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] font-bold text-[#17563F] bg-[#EAF5EF] px-2.5 py-0.5 rounded-full border border-[#D4E8DC] inline-block mb-2">
              STEP 01 · TARGET PLACEMENT RECORD
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] dark:text-foreground">
              Company &amp; Target Role
            </h3>
            <p className="text-xs sm:text-sm text-[#63606B] mt-1 leading-relaxed">
              Specify the organization, role level, hiring cycle, and final offer status of your recruitment process.
            </p>
          </div>

          {/* Visual Company Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Featured Employers
              </label>
              <span className="text-[11px] font-mono font-semibold text-[#1B635C]">Quick 1-Click Select</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {SEEDED_COMPANIES.map((c) => {
                const isSelected = formData.companyId === c.id || formData.companyName.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, companyId: c.id, companyName: c.name }));
                      if (error) setError(null);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 text-center gap-1.5 cursor-pointer group",
                      isSelected
                        ? "bg-[#EAF5EF] border-[#1B635C] shadow-2xs ring-2 ring-[#1B635C]/20"
                        : "bg-white dark:bg-[var(--surface)] hover:bg-[#FAF7F3] border-[#ECEAE5] hover:border-[#1B635C]/40"
                    )}
                  >
                    <CompanyLogo name={c.name} size="sm" className="group-hover:scale-105 transition-transform" />
                    <span className="text-[11px] font-semibold text-[#111111] dark:text-foreground truncate w-full">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Company *
              </label>
              <select
                value={formData.companyId}
                onChange={handleCompanyChange}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                {allCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Or enter custom company name below if not in list.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Company Display Name *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleFieldChange("companyName", e.target.value)}
                placeholder="e.g. Google, Stripe, Microsoft"
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Role / Title *
              </label>
              <input
                type="text"
                list="roles-list"
                value={formData.role}
                onChange={(e) => handleFieldChange("role", e.target.value)}
                placeholder="e.g. Software Development Engineer"
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                required
              />
              <datalist id="roles-list">
                {COMMON_ROLES.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Placement / Hiring Cycle
              </label>
              <select
                value={formData.hiringCycle}
                onChange={(e) => handleFieldChange("hiringCycle", e.target.value)}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {HIRING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Employment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleFieldChange("type", e.target.value)}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Interview Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleFieldChange("year", Number(e.target.value))}
                min={2000}
                max={2030}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Month (Optional)
              </label>
              <select
                value={formData.month}
                onChange={(e) => handleFieldChange("month", e.target.value)}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Outcome Selection Grid */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interview Outcome
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {OUTCOME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFieldChange("outcome", opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.outcome === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="font-semibold text-xs text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: CANDIDATE / PROCESS DETAILS */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 2 — Candidate & Process Context</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Provide context about your academic background and overall process timeline. All fields are optional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  CGPA (Optional)
                </label>
                <span className="text-[11px] text-muted-foreground italic">Non-mandatory</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cgpa}
                onChange={(e) => handleFieldChange("cgpa", e.target.value)}
                placeholder="e.g. 8.75 (0.0 to 10.0)"
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <p className="text-[11px] text-muted-foreground">
                You do not have to disclose this if you prefer not to.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Graduation Year
              </label>
              <input
                type="number"
                value={formData.gradYear}
                onChange={(e) => handleFieldChange("gradYear", e.target.value)}
                placeholder="e.g. 2025"
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Degree / Branch
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => handleFieldChange("branch", e.target.value)}
                placeholder="e.g. Computer Science (CSE)"
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Process Rounds
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={formData.roundsCount}
                onChange={(e) => handleFieldChange("roundsCount", Number(e.target.value))}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Overall Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleFieldChange("difficulty", e.target.value)}
                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Medium-Hard">Medium-Hard</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Process Timeline
            </label>
            <input
              type="text"
              value={formData.timeline}
              onChange={(e) => handleFieldChange("timeline", e.target.value)}
              placeholder="e.g. Aug 2024 - Sep 2024 (Total 3 weeks)"
              className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: ONLINE ASSESSMENT (OA) */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 3 — Online Assessment (OA)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Did your placement or interview process include an Online Assessment?
            </p>
          </div>

          {/* Conditional OA Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Was there an Online Assessment?
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {["Yes", "No", "N/A"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleFieldChange("oaEnabled", status)}
                  className={`py-2.5 px-4 rounded-xl border text-center font-semibold text-sm transition-all ${
                    formData.oaEnabled === status
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted/40"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Progressive Disclosure: Only show if OA == Yes */}
          {formData.oaEnabled === "Yes" && (
            <div className="space-y-6 pt-4 border-t animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    OA Mode
                  </label>
                  <select
                    value={formData.oaMode}
                    onChange={(e) => handleFieldChange("oaMode", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="Online">Online (Proctored / Remote)</option>
                    <option value="Offline">Offline (Campus Lab)</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assessment Type
                  </label>
                  <select
                    value={formData.oaType}
                    onChange={(e) => handleFieldChange("oaType", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="Coding">Coding</option>
                    <option value="MCQ">MCQ</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="Technical">Technical</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    OA Difficulty
                  </label>
                  <select
                    value={formData.oaDifficulty}
                    onChange={(e) => handleFieldChange("oaDifficulty", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* OA Topics Multi-select Pills */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Topics Tested in OA (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {OA_TOPICS.map(topic => {
                    const isSelected = formData.oaTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          const updated = isSelected 
                            ? formData.oaTopics.filter(t => t !== topic)
                            : [...formData.oaTopics, topic];
                          handleFieldChange("oaTopics", updated);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Topic Adder */}
                <div className="flex items-center gap-2 max-w-sm pt-1">
                  <input
                    type="text"
                    value={customOaTopic}
                    onChange={(e) => setCustomOaTopic(e.target.value)}
                    placeholder="Add custom topic..."
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customOaTopic.trim()) {
                        e.preventDefault();
                        if (!formData.oaTopics.includes(customOaTopic.trim())) {
                          handleFieldChange("oaTopics", [...formData.oaTopics, customOaTopic.trim()]);
                        }
                        setCustomOaTopic("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      if (customOaTopic.trim() && !formData.oaTopics.includes(customOaTopic.trim())) {
                        handleFieldChange("oaTopics", [...formData.oaTopics, customOaTopic.trim()]);
                        setCustomOaTopic("");
                      }
                    }}
                  >
                    + Add
                  </Button>
                </div>
              </div>

              {/* OA Questions List */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">OA Questions / Problems (Optional)</h4>
                    <p className="text-xs text-muted-foreground">Share the problem statements or question prompts asked.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      handleFieldChange("oaQuestions", [
                        ...formData.oaQuestions,
                        { _key: makeKey("oa"), text: "", topic: formData.oaTopics[0] || "Arrays", difficulty: formData.oaDifficulty || "Medium" }
                      ]);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add Question
                  </Button>
                </div>

                {formData.oaQuestions.map((q, idx) => (
                  <div key={q._key || q.id || idx} className="p-3.5 rounded-xl border bg-muted/20 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("oaQuestions", formData.oaQuestions.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pr-8">
                      <div className="md:col-span-6 space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Question Text</label>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("oaQuestions", formData.oaQuestions.map((item, i) => i === idx ? { ...item, text: val } : item));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="e.g. Find subarray with target sum"
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Topic</label>
                        <input
                          type="text"
                          value={q.topic}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("oaQuestions", formData.oaQuestions.map((item, i) => i === idx ? { ...item, topic: val } : item));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="e.g. Arrays, Strings"
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Difficulty</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("oaQuestions", formData.oaQuestions.map((item, i) => i === idx ? { ...item, difficulty: val } : item));
                          }}
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 4: DSA / CODING (DEDICATED SECTION) */}
      {/* ============================================================ */}
      {currentStep === 4 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 4 — Data Structures & Algorithms (DSA)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              A dedicated section for coding and data structure interview rounds.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Was there a dedicated DSA / Coding round?
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {["Yes", "No", "N/A"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleFieldChange("dsaEnabled", status)}
                  className={`py-2.5 px-4 rounded-xl border text-center font-semibold text-sm transition-all ${
                    formData.dsaEnabled === status
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted/40"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {formData.dsaEnabled === "Yes" && (
            <div className="space-y-6 pt-4 border-t animate-in fade-in duration-200">
              <div className="space-y-2 max-w-xs">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Overall DSA Difficulty
                </label>
                <select
                  value={formData.dsaDifficulty}
                  onChange={(e) => handleFieldChange("dsaDifficulty", e.target.value)}
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* DSA Topics Multi-select Pills */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  DSA Topics Tested (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DSA_TOPICS.map(topic => {
                    const isSelected = formData.dsaTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          const updated = isSelected 
                            ? formData.dsaTopics.filter(t => t !== topic)
                            : [...formData.dsaTopics, topic];
                          handleFieldChange("dsaTopics", updated);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 max-w-sm pt-1">
                  <input
                    type="text"
                    value={customDsaTopic}
                    onChange={(e) => setCustomDsaTopic(e.target.value)}
                    placeholder="Add custom DSA topic..."
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customDsaTopic.trim()) {
                        e.preventDefault();
                        if (!formData.dsaTopics.includes(customDsaTopic.trim())) {
                          handleFieldChange("dsaTopics", [...formData.dsaTopics, customDsaTopic.trim()]);
                        }
                        setCustomDsaTopic("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      if (customDsaTopic.trim() && !formData.dsaTopics.includes(customDsaTopic.trim())) {
                        handleFieldChange("dsaTopics", [...formData.dsaTopics, customDsaTopic.trim()]);
                        setCustomDsaTopic("");
                      }
                    }}
                  >
                    + Add
                  </Button>
                </div>
              </div>

              {/* DSA Questions List */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">DSA Questions Asked (Optional)</h4>
                    <p className="text-xs text-muted-foreground">Add specific coding problems or algorithmic questions asked.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      handleFieldChange("dsaQuestions", [
                        ...formData.dsaQuestions,
                        { _key: makeKey("dsa"), text: "", topic: formData.dsaTopics[0] || "Trees", difficulty: formData.dsaDifficulty || "Medium" }
                      ]);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add DSA Question
                  </Button>
                </div>

                {formData.dsaQuestions.map((q, idx) => (
                  <div key={q._key || q.id || idx} className="p-3.5 rounded-xl border bg-muted/20 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("dsaQuestions", formData.dsaQuestions.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pr-8">
                      <div className="md:col-span-6 space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Problem Text *</label>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("dsaQuestions", formData.dsaQuestions.map((item, i) => i === idx ? { ...item, text: val } : item));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="e.g. Lowest Common Ancestor in Binary Tree"
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Topic</label>
                        <input
                          type="text"
                          value={q.topic}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("dsaQuestions", formData.dsaQuestions.map((item, i) => i === idx ? { ...item, topic: val } : item));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="e.g. Trees, Dynamic Programming"
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Difficulty</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("dsaQuestions", formData.dsaQuestions.map((item, i) => i === idx ? { ...item, difficulty: val } : item));
                          }}
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 5: CORE CS FUNDAMENTALS (SEPARATE FROM DSA) */}
      {/* ============================================================ */}
      {currentStep === 5 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 5 — Core CS Fundamentals</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select which theoretical computer science fundamentals were evaluated in your interviews.
            </p>
          </div>

          {/* Fundamental Subjects Grid */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Which Fundamental Subjects were Tested?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FUNDAMENTAL_SUBJECTS.map(subj => {
                const isSelected = formData.selectedFundamentals.includes(subj.id);
                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? formData.selectedFundamentals.filter(s => s !== subj.id)
                        : [...formData.selectedFundamentals, subj.id];
                      
                      // Ensure default structure exists
                      const updatedFundData = { ...formData.fundamentalsData };
                      if (!updatedFundData[subj.id]) {
                        updatedFundData[subj.id] = {
                          difficulty: "Medium",
                          topics: (FUNDAMENTAL_TOPIC_SUGGESTIONS[subj.id] || []).slice(0, 3),
                          questions: []
                        };
                      }
                      setFormData(prev => ({
                        ...prev,
                        selectedFundamentals: updated,
                        fundamentalsData: updatedFundData,
                      }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-foreground">{subj.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subj.desc}</div>
                    </div>
                    <span className={`size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    }`}>
                      {isSelected && <Check className="size-2.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-Subject Detail Cards (Progressive Disclosure) */}
          {formData.selectedFundamentals.length > 0 && (
            <div className="space-y-6 pt-4 border-t">
              <h4 className="font-semibold text-sm">Subject Details & Questions Asked</h4>

              {formData.selectedFundamentals.map(subj => {
                const data = formData.fundamentalsData[subj] || { difficulty: "Medium", topics: [], questions: [] };
                const suggestions = FUNDAMENTAL_TOPIC_SUGGESTIONS[subj] || [];

                return (
                  <div key={subj} className="p-5 rounded-2xl border bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        {subj}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-muted-foreground">Difficulty:</label>
                        <select
                          value={data.difficulty || "Medium"}
                          onChange={(e) => {
                            const updated = { ...formData.fundamentalsData };
                            updated[subj] = { ...data, difficulty: e.target.value };
                            handleFieldChange("fundamentalsData", updated);
                          }}
                          className="rounded border bg-background px-2.5 py-1 text-xs outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                          <option value="Not specified">Not specified</option>
                        </select>
                      </div>
                    </div>

                    {/* Topic Pills for Subject */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                        {subj} Topics Tested
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map(topic => {
                          const isSelected = (data.topics || []).includes(topic);
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => {
                                const currentTopics = data.topics || [];
                                const updatedTopics = isSelected
                                  ? currentTopics.filter(t => t !== topic)
                                  : [...currentTopics, topic];
                                
                                const updated = { ...formData.fundamentalsData };
                                updated[subj] = { ...data, topics: updatedTopics };
                                handleFieldChange("fundamentalsData", updated);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {topic}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Questions for this Subject */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                          Questions Asked in {subj}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            const currentQuestions = data.questions || [];
                            const updated = {
                              ...formData.fundamentalsData,
                              [subj]: {
                                ...data,
                                questions: [
                                  ...currentQuestions,
                                  { _key: makeKey("fund"), text: "", topic: (data.topics && data.topics[0]) || subj, difficulty: data.difficulty || "Medium" }
                                ]
                              }
                            };
                            handleFieldChange("fundamentalsData", updated);
                          }}
                        >
                          <Plus className="size-3" />
                          Add Question
                        </Button>
                      </div>

                      {(data.questions || []).map((q, qIdx) => (
                        <div key={q._key || q.id || qIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 rounded-lg border bg-background relative items-center">
                          <div className="md:col-span-6">
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updatedQuestions = (data.questions || []).map((item, qi) => qi === qIdx ? { ...item, text: val } : item);
                                handleFieldChange("fundamentalsData", {
                                  ...formData.fundamentalsData,
                                  [subj]: { ...data, questions: updatedQuestions }
                                });
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                              placeholder={`e.g. Explain ACID properties in detail`}
                              className="w-full rounded border bg-background px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              value={q.topic}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updatedQuestions = (data.questions || []).map((item, qi) => qi === qIdx ? { ...item, topic: val } : item);
                                handleFieldChange("fundamentalsData", {
                                  ...formData.fundamentalsData,
                                  [subj]: { ...data, questions: updatedQuestions }
                                });
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                              placeholder="Topic"
                              className="w-full rounded border bg-background px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <select
                              value={q.difficulty}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updatedQuestions = (data.questions || []).map((item, qi) => qi === qIdx ? { ...item, difficulty: val } : item);
                                handleFieldChange("fundamentalsData", {
                                  ...formData.fundamentalsData,
                                  [subj]: { ...data, questions: updatedQuestions }
                                });
                              }}
                              className="w-full rounded border bg-background px-2.5 py-1 text-xs outline-none"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedQuestions = (data.questions || []).filter((_, qi) => qi !== qIdx);
                                handleFieldChange("fundamentalsData", {
                                  ...formData.fundamentalsData,
                                  [subj]: { ...data, questions: updatedQuestions }
                                });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 6: OTHER TECHNICAL ROUNDS */}
      {/* ============================================================ */}
      {currentStep === 6 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-editorial text-2xl tracking-tight">Step 6 — Technical & Dynamic Interview Rounds</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add, reorder, or customize technical interviews, machine coding, and behavioral rounds.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs self-start"
              onClick={() => {
                const nextIndex = formData.technicalRounds.length + 1;
                handleFieldChange("technicalRounds", [
                  ...formData.technicalRounds,
                  {
                    _key: makeKey("tr"),
                    roundTypeName: "Technical Interview",
                    title: `Round ${nextIndex}: Technical Interview`,
                    duration: "45 mins",
                    difficulty: "Medium",
                    topics: [],
                    notes: "",
                    questions: [],
                    mcProblem: "",
                    mcTech: "",
                    mcFocus: [],
                    aiAreas: [],
                  }
                ]);
              }}
            >
              <Plus className="size-3.5" />
              Add Round
            </Button>
          </div>

          {formData.technicalRounds.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No additional rounds specified. Click &quot;Add Round&quot; to configure dynamic interview rounds.
            </div>
          )}

          <div className="space-y-6">
            {formData.technicalRounds.map((round, rIdx) => (
              <div key={round._key || round.id || rIdx} className="p-5 sm:p-6 rounded-2xl border bg-muted/20 space-y-5 relative">
                {/* Round Header & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {rIdx + 1}
                    </span>
                    <h4 className="font-bold text-base text-foreground">
                      {round.title || `Round ${rIdx + 1}`}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      disabled={rIdx === 0}
                      onClick={() => {
                        if (rIdx > 0) {
                          const updated = [...formData.technicalRounds];
                          const temp = updated[rIdx - 1];
                          updated[rIdx - 1] = updated[rIdx];
                          updated[rIdx] = temp;
                          handleFieldChange("technicalRounds", updated);
                        }
                      }}
                      className="p-1.5 rounded border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={rIdx === formData.technicalRounds.length - 1}
                      onClick={() => {
                        if (rIdx < formData.technicalRounds.length - 1) {
                          const updated = [...formData.technicalRounds];
                          const temp = updated[rIdx + 1];
                          updated[rIdx + 1] = updated[rIdx];
                          updated[rIdx] = temp;
                          handleFieldChange("technicalRounds", updated);
                        }
                      }}
                      className="p-1.5 rounded border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("technicalRounds", formData.technicalRounds.filter((_, i) => i !== rIdx));
                      }}
                      className="p-1.5 rounded border bg-background text-red-500 hover:text-red-700 ml-1"
                      title="Remove Round"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Round Type & Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">Round Type *</label>
                    <select
                      value={round.roundTypeName}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => i === rIdx ? { ...r, roundTypeName: val } : r));
                      }}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      {ROUND_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">Round Title</label>
                    <input
                      type="text"
                      value={round.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => i === rIdx ? { ...r, title: val } : r));
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      placeholder="e.g. Round 2: System Design & Live Coding"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Duration & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">Duration</label>
                    <input
                      type="text"
                      value={round.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => i === rIdx ? { ...r, duration: val } : r));
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      placeholder="e.g. 45 mins, 1 hour"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">Difficulty</label>
                    <select
                      value={round.difficulty}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => i === rIdx ? { ...r, difficulty: val } : r));
                      }}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">Topics (Comma-separated)</label>
                    <input
                      type="text"
                      value={(round.topics || []).join(", ")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsedTopics = raw.split(",").map(t => t.trim()).filter(Boolean);
                        handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => i === rIdx ? { ...r, topics: parsedTopics } : r));
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      placeholder="e.g. Redis, Kafka, Microservices"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* SPECIAL CASE: MACHINE CODING */}
                {round.roundTypeName === "Machine Coding" && (
                  <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                    <div className="font-semibold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Code2 className="size-4 text-indigo-600" />
                      Machine Coding Configuration
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Problem / Task Description</label>
                        <input
                          type="text"
                          value={round.mcProblem || ""}
                          onChange={(e) => {
                            const updated = [...formData.technicalRounds];
                            updated[rIdx].mcProblem = e.target.value;
                            handleFieldChange("technicalRounds", updated);
                          }}
                          placeholder="e.g. Build an in-memory pub-sub messaging broker in 90 mins"
                          className="w-full rounded border bg-background px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Technologies & Frameworks</label>
                        <input
                          type="text"
                          value={round.mcTech || ""}
                          onChange={(e) => {
                            const updated = [...formData.technicalRounds];
                            updated[rIdx].mcTech = e.target.value;
                            handleFieldChange("technicalRounds", updated);
                          }}
                          placeholder="e.g. Node.js, TypeScript, Jest"
                          className="w-full rounded border bg-background px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-semibold uppercase text-muted-foreground">Evaluation Focus</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["Code Quality & Modularity", "Clean Architecture", "Handling Edge Cases", "Working Runnable Demo", "Concurrency Safety", "Unit Tests"].map(focus => {
                          const currentFocus = round.mcFocus || [];
                          const isSel = currentFocus.includes(focus);
                          return (
                            <button
                              key={focus}
                              type="button"
                              onClick={() => {
                                const updated = [...formData.technicalRounds];
                                updated[rIdx].mcFocus = isSel
                                  ? currentFocus.filter(f => f !== focus)
                                  : [...currentFocus, focus];
                                handleFieldChange("technicalRounds", updated);
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                                isSel ? "bg-indigo-600 text-white border-indigo-600" : "bg-background text-foreground border-border"
                              }`}
                            >
                              {focus}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIAL CASE: AI / DEBUGGING */}
                {round.roundTypeName === "AI / Debugging" && (
                  <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                    <div className="font-semibold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="size-4 text-purple-600" />
                      AI / Debugging Sub-areas Tested
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Debugging in Pre-written Code", "Codebase Comprehension", "AI-assisted Development", "Prompting & Tool Use", "System Reasoning & Trace Analysis", "Refactoring"].map(area => {
                        const currentAreas = round.aiAreas || [];
                        const isSel = currentAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => {
                              const updated = [...formData.technicalRounds];
                              updated[rIdx].aiAreas = isSel
                                ? currentAreas.filter(a => a !== area)
                                : [...currentAreas, area];
                              handleFieldChange("technicalRounds", updated);
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                              isSel ? "bg-purple-600 text-white border-purple-600" : "bg-background text-foreground border-border"
                            }`}
                          >
                            {area}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Round Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase text-muted-foreground">Round Summary / Notes</label>
                  <textarea
                    value={round.notes || ""}
                    onChange={(e) => {
                      const updated = [...formData.technicalRounds];
                      updated[rIdx].notes = e.target.value;
                      handleFieldChange("technicalRounds", updated);
                    }}
                    placeholder="Describe how the round was conducted and key observations..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs min-h-[60px] focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Round Questions */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Questions Asked in this Round
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => {
                          if (i !== rIdx) return r;
                          const currentQuestions = [
                            ...(r.questions || []),
                            { _key: makeKey("tr_q"), text: "", topic: (r.topics && r.topics[0]) || r.roundTypeName || "General", difficulty: r.difficulty || "Medium" }
                          ];
                          return { ...r, questions: currentQuestions };
                        }));
                      }}
                    >
                      <Plus className="size-3" />
                      Add Question
                    </Button>
                  </div>

                  {(round.questions || []).map((q, qIdx) => (
                    <div key={q._key || q.id || qIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2.5 rounded-lg border bg-background relative items-center">
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => {
                              if (i !== rIdx) return r;
                              const qList = (r.questions || []).map((item, qi) => qi === qIdx ? { ...item, text: val } : item);
                              return { ...r, questions: qList };
                            }));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="Question text"
                          className="w-full rounded border bg-background px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={q.topic}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => {
                              if (i !== rIdx) return r;
                              const qList = (r.questions || []).map((item, qi) => qi === qIdx ? { ...item, topic: val } : item);
                              return { ...r, questions: qList };
                            }));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="Topic"
                          className="w-full rounded border bg-background px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <select
                          value={q.difficulty}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => {
                              if (i !== rIdx) return r;
                              const qList = (r.questions || []).map((item, qi) => qi === qIdx ? { ...item, difficulty: val } : item);
                              return { ...r, questions: qList };
                            }));
                          }}
                          className="w-full rounded border bg-background px-2.5 py-1 text-xs outline-none"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            handleFieldChange("technicalRounds", formData.technicalRounds.map((r, i) => {
                              if (i !== rIdx) return r;
                              const qList = (r.questions || []).filter((_, qi) => qi !== qIdx);
                              return { ...r, questions: qList };
                            }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 7: INTERVIEW EXPERIENCE NARRATIVE */}
      {/* ============================================================ */}
      {currentStep === 7 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 7 — Tell Us About Your Interview Experience</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Walk through what happened, what you were asked, what went well, and what you wish you had prepared better.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Short Summary * (1-2 sentences)
            </label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => handleFieldChange("summary", e.target.value)}
              placeholder="e.g. 3 rounds covering binary trees, DBMS indexing, and an engineering culture discussion."
              className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              This summary will appear in experience listings and card previews.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detailed Narrative / Experience Story
              </label>
              <span className="text-[11px] text-muted-foreground">Markdown supported</span>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              placeholder="Walk through what happened, what you were asked, what went well, and what you wish you had prepared better. Share any specific tips or gotchas you encountered..."
              className="w-full rounded-xl border bg-background p-4 text-sm min-h-[220px] focus:ring-2 focus:ring-primary outline-none font-sans leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 8: PREPARATION & ADVICE */}
      {/* ============================================================ */}
      {currentStep === 8 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 8 — Preparation & Candidate Advice</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Guide future candidates on the key topics to prepare and share your personal wisdom.
            </p>
          </div>

          {/* Part A: What should future candidates prepare? */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              A. What should future candidates prepare? (Select key areas)
            </label>
            <div className="flex flex-wrap gap-2">
              {PREPARATION_CATEGORIES.map(cat => {
                const isSelected = formData.prepCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? formData.prepCategories.filter(c => c !== cat)
                        : [...formData.prepCategories, cat];
                      handleFieldChange("prepCategories", updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part B: Advice for future candidates */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              B. Advice for Future Candidates
            </label>
            <textarea
              value={formData.advice}
              onChange={(e) => handleFieldChange("advice", e.target.value)}
              placeholder="What advice would you give to someone preparing for this company? e.g. Focus on clean code, communicate your approach first, don't rush..."
              className="w-full rounded-xl border bg-background p-4 text-sm min-h-[140px] focus:ring-2 focus:ring-primary outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 9: CV & PRIVACY */}
      {/* ============================================================ */}
      {currentStep === 9 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 9 — CV Upload & Privacy Settings</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure your resume sharing preference and author anonymity.
            </p>
          </div>

          {/* CV Upload Section */}
          <div className="p-5 rounded-2xl border bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Alumni CV / Resume (Optional)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload your CV to help students understand the background and profile expected for this role.
                </p>
              </div>
            </div>

            {cvError && (
              <div className="p-3 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg">
                {cvError}
              </div>
            )}

            {cv ? (
              <div className="p-4 rounded-xl border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground truncate max-w-xs">{cv.fileName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {(cv.fileSize / 1024).toFixed(1)} KB • {cv.isShared ? "🌐 Shared with Students" : "🔒 Private"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => cvFileInputRef.current?.click()}
                    disabled={cvUploading}
                  >
                    Replace CV
                  </Button>
                  {confirmDeleteCv ? (
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="text-xs h-8"
                        onClick={handleDeleteCv}
                        disabled={cvUploading}
                      >
                        Confirm Remove
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setConfirmDeleteCv(false)}
                        disabled={cvUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-red-500 hover:text-red-700"
                      onClick={() => setConfirmDeleteCv(true)}
                      disabled={cvUploading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-3 bg-background hover:bg-muted/30 transition-all">
                <UploadCloud className="size-8 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-foreground">Upload your resume (PDF only, max 5MB)</div>
                  <div className="text-[11px] text-muted-foreground">Files are stored securely in encrypted private object storage.</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => cvFileInputRef.current?.click()}
                  disabled={cvUploading}
                >
                  {cvUploading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Select PDF File
                </Button>
              </div>
            )}

            <input
              type="file"
              ref={cvFileInputRef}
              onChange={handleCvUpload}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {/* CV Sharing Toggle */}
            <div className="space-y-3 pt-3 border-t">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CV Visibility Preference (Default: Private)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleCvSharing(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !formData.isCvShared
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <Lock className="size-3.5 text-amber-500" />
                    Keep my CV private (Recommended)
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Your CV remains completely private and inaccessible to students.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCvSharing(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    formData.isCvShared
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <Globe2 className="size-3.5 text-emerald-500" />
                    Share my CV with students
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Authenticated students can view your CV to prepare for this role.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Author Anonymity Choice */}
          <div className="p-5 rounded-2xl border bg-muted/20 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Experience Author Attribution
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFieldChange("isAnonymous", false)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  !formData.isAnonymous
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Public Attribution
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Your name and verified alumni profile badge appear with this experience.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleFieldChange("isAnonymous", true)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  formData.isAnonymous
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                  <span className="size-2 rounded-full bg-indigo-500" />
                  Shared Anonymously
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Your identity is masked from students. Your data powers consensus safely.
                </p>
              </button>
            </div>

            {/* Independence Callout */}
            <div className="text-[11px] text-muted-foreground bg-background p-3 rounded-lg border border-border/60">
              📌 <strong>Privacy Independence Guarantee:</strong> Experience anonymity and CV sharing are completely independent. You may submit an anonymous experience while sharing your CV on your profile, or publish publicly while keeping your CV private.
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 10: REVIEW & SUBMIT */}
      {/* ============================================================ */}
      {currentStep === 10 && (
        <div className="border border-[#ECEAE5] rounded-3xl p-6 sm:p-10 space-y-7 shadow-xs animate-in fade-in duration-200 bg-white dark:bg-[var(--surface)]">
          <div className="border-b pb-4">
            <h3 className="font-editorial text-2xl tracking-tight">Step 10 — Review & Submit</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Verify all submission details before publishing your interview experience.
            </p>
          </div>

          {/* Privacy Badges Summary Card */}
          <div className="p-4 rounded-xl border bg-primary/5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Privacy & Access Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-background">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Experience Attribution</div>
                <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${formData.isAnonymous ? "bg-indigo-500" : "bg-emerald-500"}`} />
                  {formData.isAnonymous ? "Shared Anonymously" : "Public Attribution"}
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-background">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">CV Visibility</div>
                <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                  {formData.isCvShared ? (
                    <>
                      <Globe2 className="size-3.5 text-emerald-500" />
                      Shared with students
                    </>
                  ) : (
                    <>
                      <Lock className="size-3.5 text-amber-500" />
                      Private
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Review Grid */}
          <div className="space-y-4">
            {/* Step 1 & 2 Card */}
            <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                  Company & Process
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <div className="font-semibold">{formData.companyName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <div className="font-semibold">{formData.role}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Outcome:</span>
                  <div className="font-semibold">{formData.outcome}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Cycle / Year:</span>
                  <div className="font-semibold">{formData.hiringCycle} ({formData.year})</div>
                </div>
              </div>
            </div>

            {/* Step 3, 4, 5, 6 Breakdown */}
            <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                  Rounds & Questions
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between border-b pb-2">
                  <span className="text-muted-foreground">Online Assessment (OA):</span>
                  <span className="font-medium text-right">
                    {formData.oaEnabled === "Yes" 
                      ? `${formData.oaMode} (${formData.oaDifficulty}) • ${formData.oaTopics.length} topics` 
                      : "None"}
                  </span>
                </div>

                <div className="flex items-start justify-between border-b pb-2">
                  <span className="text-muted-foreground">DSA / Coding Round:</span>
                  <span className="font-medium text-right">
                    {formData.dsaEnabled === "Yes" 
                      ? `${formData.dsaDifficulty} • ${formData.dsaTopics.length} topics • ${formData.dsaQuestions.filter(q => q.text).length} questions` 
                      : "None"}
                  </span>
                </div>

                <div className="flex items-start justify-between border-b pb-2">
                  <span className="text-muted-foreground">Core Fundamentals:</span>
                  <span className="font-medium text-right">
                    {formData.selectedFundamentals.length > 0 
                      ? formData.selectedFundamentals.join(", ") 
                      : "None"}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">Other Technical Rounds:</span>
                  <span className="font-medium text-right">
                    {formData.technicalRounds.length} rounds configured
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative & Advice Card */}
            <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                  Story & Advice
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-xs space-y-1.5 pt-1">
                <div>
                  <span className="text-muted-foreground">Summary:</span>
                  <p className="font-medium mt-0.5">{formData.summary}</p>
                </div>
                {formData.advice && (
                  <div className="pt-1">
                    <span className="text-muted-foreground">Candidate Advice:</span>
                    <p className="font-medium mt-0.5 italic text-muted-foreground">{formData.advice}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Context Error Banner for Step 10 & Critical Actions */}
      {error && currentStep === 10 && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Submission Incomplete</div>
            <div>{error}</div>
            <div className="text-xs text-red-700 dark:text-red-400 mt-1">
              Your entries have been preserved. You can review the details above and retry submitting.
            </div>
          </div>
        </div>
      )}

      {/* In-Context Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Experience Submitted Successfully!</div>
            <div>Your interview experience has been securely saved and submitted for moderation. Redirecting to your experience page...</div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BOTTOM ACTION BAR */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#ECEAE5]">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading || saveSuccess}
              className="gap-2 text-xs rounded-full px-5 h-10 border-[#ECEAE5] hover:bg-[#FAF7F3] font-semibold text-[#111111]"
            >
              <ChevronLeft className="size-4" />
              <span>Back</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading || saveSuccess}
            className="text-xs rounded-full px-5 h-10 border-[#ECEAE5] hover:bg-[#FAF7F3] font-semibold text-[#111111] flex-1 sm:flex-initial"
          >
            {submittingAction === "draft" ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            {submittingAction === "draft" ? "Saving Draft..." : "Save Draft"}
          </Button>

          {currentStep < 10 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-2 text-xs rounded-full px-6 h-10 bg-[#1B635C] hover:bg-[#154D48] text-white font-semibold shadow-xs flex-1 sm:flex-initial transition-all hover:scale-102"
            >
              <span>Continue</span>
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={loading || saveSuccess}
              className="gap-2 text-xs rounded-full px-7 h-10 bg-[#17563F] hover:bg-[#134633] text-white font-semibold shadow-xs flex-1 sm:flex-initial transition-all hover:scale-102"
            >
              {submittingAction === "published" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Submitting Experience...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="size-3.5 mr-1.5" />
                  <span>Redirecting...</span>
                </>
              ) : (
                mode === "create" ? "Submit Verified Experience" : "Save and Submit"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
