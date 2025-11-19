import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FilePlus,
  X,
  Upload,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Folder,
  ArrowLeft,
  Search,
  Star,
  Eye,
  PanelLeftClose,
  Zap,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import {
  getAllNotes,
  putNote,
  updateMeta /* deleteNote */,
} from "../lib/notesDb";

// PDF viewer styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
// Load pdf.js worker from the bundle (CSP friendly)
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

// Markdown
import ReactMarkdown from "react-markdown";

interface NoteFile {
  id: string;
  name: string;
  path: string;
  type: string;
  content?: string; // for txt/md
  objectUrl?: string; // for PDF/TXT blob preview
  size: number;
  lastModified: number;
  starred?: boolean;
  ext?: string;
  pinnedSlot?: number | null; // mirror of meta for restoration
}

const SLOTS_KEY = "whispr_notes_slots_v1";

interface PinnedSlot {
  id: number;
  file: NoteFile | null;
}

const getFileIcon = (type: string, className?: string) => {
  if (type.includes("pdf")) return <File className={className} />;
  if (type.includes("text") || type.includes("markdown"))
    return <FileText className={className} />;
  if (type.includes("image")) return <FileImage className={className} />;
  if (type.includes("video")) return <FileVideo className={className} />;
  if (type.includes("audio")) return <FileAudio className={className} />;
  return <File className={className} />;
};

const getFileTypeColor = (type: string) => {
  if (type.includes("pdf")) return "from-red-500 to-pink-500";
  if (type.includes("text") || type.includes("markdown"))
    return "from-blue-500 to-cyan-500";
  if (type.includes("image")) return "from-purple-500 to-violet-500";
  if (type.includes("video")) return "from-orange-500 to-amber-500";
  if (type.includes("audio")) return "from-green-500 to-emerald-500";
  return "from-gray-500 to-slate-500";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};

const truncateFileName = (name: string, maxLength = 20) => {
  if (name.length <= maxLength) return name;
  const extension = name.split(".").pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
  const truncated =
    nameWithoutExt.substring(0, maxLength - (extension?.length ?? 0) - 4) +
    "...";
  return `${truncated}.${extension}`;
};

export default function NotesPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pinnedSlots, setPinnedSlots] = useState<PinnedSlot[]>([
    { id: 1, file: null },
    { id: 2, file: null },
    { id: 3, file: null },
    { id: 4, file: null },
    { id: 5, file: null },
  ]);
  const [selectedFile, setSelectedFile] = useState<NoteFile | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    file: NoteFile;
    slotId: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showFileInfo, setShowFileInfo] = useState(true);
  const [showPinnedNotes, setShowPinnedNotes] = useState(false);

  // Find-in-text for TXT/MD viewer
  const [findQuery, setFindQuery] = useState("");

  // React-PDF-Viewer plugin (must be inside component)
  const defaultLayoutPluginInstance = defaultLayoutPlugin({});

  const handleFileSelect = async (slotId: number) => {
    setActiveSlotId(slotId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || activeSlotId === null) return;

    // Whitelist: PDF / TXT / MD
    const name = file.name;
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const isPdf = file.type.includes("pdf") || ext === "pdf";
    const isText =
      file.type.includes("text") || ["txt", "md", "markdown"].includes(ext);
    if (!isPdf && !isText) {
      event.target.value = "";
      return;
    }

    const id = crypto.randomUUID();

    // Save in IndexedDB (blob + meta)
    await putNote({
      meta: {
        id,
        name,
        mime: isPdf
          ? "application/pdf"
          : file.type || (ext === "md" ? "text/markdown" : "text/plain"),
        size: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        pinnedSlot: null,
        tags: [],
      },
      blob: file,
    });

    const objectUrl = URL.createObjectURL(file);

    const noteFile: NoteFile = {
      id,
      name,
      path: name,
      type: isPdf
        ? "application/pdf"
        : file.type || (ext === "md" ? "text/markdown" : "text/plain"),
      size: file.size,
      lastModified: file.lastModified,
      starred: false,
      objectUrl,
      ext,
      pinnedSlot: null,
      content: isText ? await file.text() : undefined,
    };

    const existingSlot = pinnedSlots.find((slot) => slot.id === activeSlotId);
    if (existingSlot?.file) {
      setPendingFile({ file: noteFile, slotId: activeSlotId });
      setShowConfirmDialog(true);
    } else {
      assignFileToSlot(noteFile, activeSlotId);
    }

    event.target.value = "";
  };

  const assignFileToSlot = (file: NoteFile, slotId: number) => {
    setPinnedSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, file } : slot))
    );
    setSelectedFile(file);
    setActiveSlotId(null);

    // Persist pin in DB
    updateMeta(file.id, { pinned: true, pinnedSlot: slotId }).catch(() => {});
  };

  const handleConfirmReplace = async () => {
    if (pendingFile) {
      const old = pinnedSlots.find((s) => s.id === pendingFile.slotId)?.file;
      if (old?.objectUrl) URL.revokeObjectURL(old.objectUrl);

      // Unpin the old note (keep it in DB)
      if (old) {
        await updateMeta(old.id, { pinned: false, pinnedSlot: null }).catch(
          () => {}
        );
      }

      assignFileToSlot(pendingFile.file, pendingFile.slotId);
      setPendingFile(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelReplace = () => {
    setPendingFile(null);
    setShowConfirmDialog(false);
    setActiveSlotId(null);
  };

  const clearSlot = async (slotId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const slot = pinnedSlots.find((s) => s.id === slotId);
    const file = slot?.file;

    if (file) {
      if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);

      // Treat "clear" as unpin (don’t delete the note by default)
      await updateMeta(file.id, { pinned: false, pinnedSlot: null }).catch(
        () => {}
      );

      // If you really want to delete the note from DB, uncomment:
      // await deleteNote(file.id);
    }

    setPinnedSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, file: null } : s))
    );
    if (file && selectedFile?.id === file.id) setSelectedFile(null);
  };

  const toggleStar = (slotId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setPinnedSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId && slot.file
          ? { ...slot, file: { ...slot.file, starred: !slot.file.starred } }
          : slot
      )
    );
  };

  const openFileInViewer = (file: NoteFile) => {
    setSelectedFile(file);
  };

  const handlePickAnother = () => {
    setSelectedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // optional: implement drop-to-upload
  };

  const filteredSlots = pinnedSlots.filter(
    (slot) =>
      !searchQuery ||
      (slot.file &&
        slot.file.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    (async () => {
      const records = await getAllNotes();

      // Build a map id -> NoteFile with objectUrl and restored content for text/markdown
      const map = new Map<string, NoteFile>();
      for (const r of records) {
        const objectUrl = URL.createObjectURL(r.blob);
        const ext = r.meta.name.split(".").pop()?.toLowerCase();
        const isMd = ext === "md" || r.meta.mime.includes("markdown");
        const isTxt = r.meta.mime.includes("text") && !isMd;

        map.set(r.meta.id, {
          id: r.meta.id,
          name: r.meta.name,
          path: r.meta.name,
          type: r.meta.mime,
          size: r.meta.size,
          lastModified: r.meta.updatedAt,
          starred: !!r.meta.pinned,
          objectUrl,
          ext,
          pinnedSlot: r.meta.pinnedSlot ?? null,
          content: isMd || isTxt ? await r.blob.text() : undefined,
        });
      }

      // 1) Restore from localStorage if available
      const saved = localStorage.getItem(SLOTS_KEY);
      if (saved) {
        try {
          const ids: (string | null)[] = JSON.parse(saved);
          setPinnedSlots((prev) =>
            prev.map((slot, i) => ({
              ...slot,
              file: ids[i] ? map.get(ids[i]!) ?? null : null,
            }))
          );
          const first = ids.find((x) => !!x);
          if (first) setSelectedFile(map.get(first) ?? null);
        } catch {
          // ignore parse errors and fall through to DB-based restore
        }
      }

      // 2) Also restore pinned slots from DB metadata (fallback or merge)
      const pinnedBySlot: (NoteFile | null)[] = [null, null, null, null, null];
      for (const note of map.values()) {
        const s = note.pinnedSlot;
        if (typeof s === "number" && s >= 1 && s <= 5) {
          pinnedBySlot[s - 1] = note;
        }
      }
      if (pinnedBySlot.some(Boolean)) {
        setPinnedSlots((prev) =>
          prev.map((slot, i) => ({
            ...slot,
            file: slot.file ?? pinnedBySlot[i] ?? null,
          }))
        );
        if (!saved) {
          const firstFromDb = pinnedBySlot.find(Boolean);
          if (firstFromDb) setSelectedFile(firstFromDb);
        }
      }
    })();

    // cleanup on unmount: revoke created objectUrls
    return () => {
      pinnedSlots.forEach((s) => {
        if (s.file?.objectUrl) URL.revokeObjectURL(s.file.objectUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ids = pinnedSlots.map((s) => s.file?.id ?? null);
    localStorage.setItem(SLOTS_KEY, JSON.stringify(ids));
  }, [pinnedSlots]);

  // ---- find-in-text helpers for TXT ----
  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function highlightText(text: string, q: string) {
    if (!q) return <>{text}</>;
    const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/40 rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  const renderFileViewer = () => {
    if (!selectedFile) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 animate-pulse"></div>
              <Upload className="h-16 w-16 text-emerald-400 relative z-10" />
              <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Select or Upload a Note
          </h3>
          <p className="text-white text-lg mb-6">
            Choose a note from your pinned slots to view it here
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() =>
                handleFileSelect(
                  pinnedSlots.find((slot) => !slot.file)?.id || 1
                )
              }
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white rounded-xl px-6 py-2 font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
            >
              <FilePlus className="h-5 w-5 mr-2" />
              Upload Note
            </Button>
          </div>
        </div>
      );
    }

    const isPdf = selectedFile.type.includes("pdf");
    const isMd =
      selectedFile.ext === "md" || selectedFile.type.includes("markdown");
    const isTxt = selectedFile.type.includes("text") && !isMd;

    return (
      <div className="h-full flex flex-col">
        {/* Viewer Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getFileTypeColor(
                selectedFile.type
              )} flex items-center justify-center shadow-lg group-hover:scale-[1.02] transition-transform duration-300`}
            >
              {getFileIcon(selectedFile.type, "h-6 w-6 text-white")}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {selectedFile.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge
                  variant="outline"
                  className={`border-0 bg-gradient-to-r ${getFileTypeColor(
                    selectedFile.type
                  )} text-white text-xs px-2 py-0.5`}
                >
                  {selectedFile.type.split("/")[1]?.toUpperCase() || "FILE"}
                </Badge>
                <span className="text-xs text-white">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPdf && (isTxt || isMd) && (
              <Input
                placeholder="Find in note…"
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                className="w-48 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl"
              />
            )}
            <Button
              onClick={() => setShowFileInfo(!showFileInfo)}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/10 rounded-lg"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              onClick={handlePickAnother}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl ml-2"
            >
              Pick Another
            </Button>
          </div>
        </div>

        {/* Viewer Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {isPdf ? (
              selectedFile.objectUrl ? (
                <div className="h-[600px] rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  <Worker workerUrl={pdfWorker}>
                    <Viewer
                      fileUrl={selectedFile.objectUrl}
                      plugins={[defaultLayoutPluginInstance]}
                    />
                  </Worker>
                </div>
              ) : (
                <div className="w-full h-[600px] flex items-center justify-center text-gray-400">
                  Unable to preview PDF
                </div>
              )
            ) : isMd ? (
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-6">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{selectedFile.content ?? ""}</ReactMarkdown>
                </div>
                {findQuery && (
                  <div className="mt-4 text-xs text-gray-400">
                    Tip: Press{" "}
                    <kbd className="px-1 py-0.5 bg-white/10 rounded">
                      Ctrl/Cmd
                    </kbd>{" "}
                    + <kbd className="px-1 py-0.5 bg-white/10 rounded">F</kbd>{" "}
                    to search within Markdown.
                  </div>
                )}
              </div>
            ) : isTxt ? (
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 p-8">
                <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">
                  {selectedFile.content
                    ? highlightText(selectedFile.content, findQuery)
                    : "No content available"}
                </pre>
              </div>
            ) : (
              <div className="w-full h-[600px] bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                <div className="text-center relative z-10">
                  {getFileIcon(
                    selectedFile.type,
                    "h-20 w-20 text-white mx-auto mb-6"
                  )}
                  <h4 className="text-2xl font-bold text-white mb-2">
                    Preview not supported
                  </h4>
                  <p className="text-white text-lg mb-2">
                    File type: {selectedFile.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    File: {selectedFile.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/30 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400/30 rounded-full animate-bounce delay-700"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-teal-400/30 rounded-full animate-bounce delay-1000"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Top Bar */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 border-b border-white/10 backdrop-blur-xl bg-gradient-to-r from-white/5 to-white/10"
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <FileText className="h-7 w-7 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-blue-300 bg-clip-text text-white">
                  My Notes
                </h1>
                <p className="text-white text-sm">
                  Organize and view your documents
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={() => setShowSearch(!showSearch)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              onClick={() =>
                handleFileSelect(
                  pinnedSlots.find((slot) => !slot.file)?.id || 1
                )
              }
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white rounded-xl px-6 py-2 font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
            >
              <FilePlus className="h-5 w-5 mr-2" />
              Add Note
            </Button>
          </div>
        </motion.header>

        {/* Main Content */}
        <ScrollArea className="h-full">
          <motion.div
            className="flex-1 flex overflow-hidden"
            layout
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Pinned Slots */}
            <motion.div
              initial={false}
              animate={{
                width: showPinnedNotes ? "384px" : "80px",
                height: "100%",
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="border-r border-white/10 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-xl overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col">
                {/* Accordion Header */}
                <div className="p-4 border-b border-white/10 flex-shrink-0">
                  <Button
                    onClick={() => setShowPinnedNotes(!showPinnedNotes)}
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/10 rounded-xl p-2 transition-all duration-300"
                  >
                    <div className="flex w-full items-center">
                      <AnimatePresence>
                        {showPinnedNotes && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-white-300 text-md font-semibold overflow-hidden whitespace-nowrap"
                          >
                            Pinned Notes
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <motion.div
                        animate={{ rotate: showPinnedNotes ? 0 : -180 }}
                        transition={{ duration: 0.3 }}
                        className="ml-auto"
                      >
                        <PanelLeftClose className="h-9 w-9 text-white-400" />
                      </motion.div>
                    </div>
                  </Button>
                </div>

                {/* Expanded Accordion Content */}
                <AnimatePresence>
                  {showPinnedNotes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="flex-1 overflow-hidden"
                    >
                      <ScrollArea className="h-full">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between mb-6">
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                            >
                              {pinnedSlots.filter((slot) => slot.file).length}/5
                            </Badge>
                          </div>

                          <AnimatePresence>
                            {filteredSlots.map((slot, index) => (
                              <motion.div
                                key={slot.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.1 }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                              >
                                <Card
                                  onClick={() =>
                                    slot.file
                                      ? openFileInViewer(slot.file)
                                      : handleFileSelect(slot.id)
                                  }
                                  className={cn(
                                    "group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                                    "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border rounded-2xl overflow-hidden",
                                    slot.file
                                      ? `border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/20 ${
                                          getFileTypeColor(slot.file.type)
                                            .replace("from-", "hover:shadow-")
                                            .replace("to-", "")
                                            .split(" ")[0]
                                        }/10`
                                      : "border-gray-700/50 hover:border-gray-600/70 hover:shadow-gray-500/10 border-dashed",
                                    selectedFile?.id === slot.file?.id &&
                                      "ring-2 ring-emerald-500/50 shadow-emerald-500/25",
                                    dragOver &&
                                      !slot.file &&
                                      "border-emerald-400 bg-emerald-500/10"
                                  )}
                                >
                                  {slot.file && (
                                    <div
                                      className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${getFileTypeColor(
                                        slot.file.type
                                      )}/10 rounded-bl-full`}
                                    ></div>
                                  )}

                                  <CardContent className="p-4 relative z-10">
                                    {slot.file ? (
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${getFileTypeColor(
                                            slot.file.type
                                          )} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                        >
                                          {getFileIcon(
                                            slot.file.type,
                                            "h-6 w-6 text-white"
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-white font-medium truncate">
                                              {truncateFileName(slot.file.name)}
                                            </p>
                                            {slot.file.starred && (
                                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className={`border-0 bg-gradient-to-r ${getFileTypeColor(
                                                slot.file.type
                                              )} text-white text-xs px-2 py-0.5`}
                                            >
                                              {slot.file.type
                                                .split("/")[1]
                                                ?.toUpperCase() || "FILE"}
                                            </Badge>
                                            <span className="text-xs text-white">
                                              {formatFileSize(slot.file.size)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            onClick={(e) =>
                                              toggleStar(slot.id, e)
                                            }
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg"
                                          >
                                            <Star
                                              className={`h-3 w-3 ${
                                                slot.file.starred
                                                  ? "fill-current"
                                                  : ""
                                              }`}
                                            />
                                          </Button>
                                          <Button
                                            onClick={(e) =>
                                              clearSlot(slot.id, e)
                                            }
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 py-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-600/30 to-gray-700/30 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-500/30 group-hover:border-emerald-400/50 transition-colors">
                                          <Folder className="h-6 w-6 text-white group-hover:text-emerald-400 transition-colors" />
                                        </div>
                                        <div>
                                          <p className="text-white italic font-medium">
                                            Click to select a note...
                                          </p>
                                          <p className="text-gray-500 text-xs">
                                            Or drag and drop files here
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed State */}
                <AnimatePresence>
                  {!showPinnedNotes && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1 p-3 space-y-3 flex flex-col"
                    >
                      <div className="text-center mb-4">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 text-xs"
                        >
                          {pinnedSlots.filter((slot) => slot.file).length}/5
                        </Badge>
                      </div>
                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        {pinnedSlots.map((slot, index) => (
                          <motion.div
                            key={slot.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                          >
                            <Button
                              onClick={() =>
                                slot.file
                                  ? openFileInViewer(slot.file)
                                  : handleFileSelect(slot.id)
                              }
                              variant="ghost"
                              className={cn(
                                "w-full h-12 rounded-xl transition-all duration-300 p-2 relative overflow-hidden",
                                slot.file
                                  ? `bg-gradient-to-br ${getFileTypeColor(
                                      slot.file.type
                                    )} hover:scale-105 shadow-lg border-0`
                                  : "bg-gray-600/30 hover:bg-gray-600/50 border-2 border-dashed border-gray-500/30 hover:border-emerald-400/50",
                                selectedFile?.id === slot.file?.id &&
                                  "ring-2 ring-emerald-500/50 shadow-emerald-500/25"
                              )}
                              title={
                                slot.file
                                  ? slot.file.name
                                  : `Empty slot ${slot.id}`
                              }
                            >
                              <div className="flex items-center justify-center w-full">
                                {slot.file ? (
                                  <>
                                    {getFileIcon(
                                      slot.file.type,
                                      "h-6 w-6 text-white"
                                    )}
                                    {slot.file.starred && (
                                      <Star className="h-3 w-3 text-yellow-400 fill-current absolute top-1 right-1" />
                                    )}
                                  </>
                                ) : (
                                  <Folder className="h-6 w-6 text-white" />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Button>

                            {/* Slot number indicator */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-mono">
                                {slot.id}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* File Viewer */}
            <motion.div
              layout
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex-1 bg-gradient-to-br from-black/60 via-gray-900/40 to-black/60 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5"></div>
              <div className="relative z-10 h-full">{renderFileViewer()}</div>
            </motion.div>
          </motion.div>
        </ScrollArea>
      </div>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() =>
            handleFileSelect(pinnedSlots.find((slot) => !slot.file)?.id || 1)
          }
          className="w-14 h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 hover:from-emerald-600 hover:via-teal-600 hover:to-blue-600 text-white rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-110"
        >
          <Zap className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.doc,.docx,.rtf"
      />

      {/* Replace confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="border-2 border-amber-500/30 rounded-2xl shadow-2xl bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Upload className="h-6 w-6 text-amber-400" />
              Replace Note?
            </DialogTitle>
            <DialogDescription className="text-gray-300 leading-relaxed">
              This slot already contains a note. Do you want to replace it with
              the new file?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelReplace}
              className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 bg-transparent rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReplace}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl"
            >
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
