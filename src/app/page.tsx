'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Download, Copy, Trash2, ArrowRightLeft, FileText, Type, Undo, Redo,
  CheckCircle2, AlertTriangle, AlertCircle, Info, X
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import * as tamilTools from 'tamil-language-tools-and-assets';
import {
  unicodeToDlManel,
  unicodeToKaputa,
  dlManelToUnicode,
  kaputaToUnicode,
  baminiToUnicode,
  singlishToUnicode,
  tanglishToUnicode,
} from 'sinhala-unicode-coverter';
import Keyboard from '../components/Keyboard';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export default function OmniScribeApp({ initialTab = 'transcribe' }: { initialTab?: 'transcribe' | 'convert' }) {
  const [activeTab, setActiveTab] = useState<'transcribe' | 'convert'>(initialTab);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/convert' || hash === '#convert') {
        setActiveTab('convert');
      } else if (path === '/' && hash !== '#convert') {
        if (initialTab !== 'convert') {
          setActiveTab('transcribe');
        }
      }

      const handleNavigation = () => {
        const curPath = window.location.pathname;
        const curHash = window.location.hash;
        if (curPath === '/convert' || curHash === '#convert') {
          setActiveTab('convert');
        } else {
          setActiveTab('transcribe');
        }
      };

      window.addEventListener('popstate', handleNavigation);
      window.addEventListener('hashchange', handleNavigation);
      return () => {
        window.removeEventListener('popstate', handleNavigation);
        window.removeEventListener('hashchange', handleNavigation);
      };
    }
  }, [initialTab]);

  const switchTab = useCallback((tab: 'transcribe' | 'convert') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetUrl = tab === 'convert' ? '/convert' : '/';
      window.history.pushState(null, '', targetUrl);
    }
  }, []);

  // Transcriber State
  const [text, setText] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const historyRef = useRef<string[]>(['']);
  const historyIndexRef = useRef(0);

  // Converter State
  const [sourceText, setSourceText] = useState('');
  const [targetFont, setTargetFont] = useState('none');

  // In-Website Toast & Modal Popup State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const askConfirmation = useCallback((options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      isDestructive: options.isDestructive ?? true,
      onConfirm: options.onConfirm,
    });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const updateUI = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const updateText = useCallback((newText: string) => {
    setText((prev) => (prev === newText ? prev : newText));

    const currentText = historyRef.current[historyIndexRef.current] ?? '';
    if (newText === currentText) return;

    let newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(newText);
    if (newHistory.length > 100) {
      newHistory = newHistory.slice(newHistory.length - 100);
    }
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    updateUI();
  }, [updateUI]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current] ?? '';
      setText(prev);
      updateUI();
    }
  }, [updateUI]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current] ?? '';
      setText(next);
      updateUI();
    }
  }, [updateUI]);

  const clearText = useCallback(() => {
    if ((historyRef.current[historyIndexRef.current] ?? '') !== '') {
      updateText('');
    }
  }, [updateText]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30 relative">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">OmniScribe <span className="text-white/40 font-normal">Pro</span></h1>
          </div>
          <nav className="flex items-center p-1 bg-white/5 rounded-lg border border-white/10 shadow-inner">
            <button 
              type="button"
              onClick={() => switchTab('transcribe')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer select-none ${
                activeTab === 'transcribe' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Live Transcriber
            </button>
            <button 
              type="button"
              onClick={() => switchTab('convert')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer select-none ${
                activeTab === 'convert' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Unicode Converter
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'transcribe' ? (
          <TranscriberView 
            text={text} 
            updateText={updateText} 
            undo={undo} 
            redo={redo} 
            clearText={clearText}
            canUndo={canUndo}
            canRedo={canRedo}
            showToast={showToast}
            askConfirmation={askConfirmation}
          />
        ) : (
          <ConverterView 
            sourceText={sourceText}
            setSourceText={setSourceText}
            targetFont={targetFont}
            setTargetFont={setTargetFont}
            showToast={showToast}
            askConfirmation={askConfirmation}
          />
        )}
      </main>

      {/* Floating In-Website Toast Popups */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto shadow-2xl backdrop-blur-xl border rounded-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-100'
                : 'bg-[#18181b]/95 border-indigo-500/30 text-indigo-100'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
              <span className="text-sm font-medium leading-snug break-words">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* In-Website Confirmation Modal (replaces browser confirm) */}
      {confirmDialog.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeConfirmation}
        >
          <div 
            className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/90 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                confirmDialog.isDestructive 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {confirmDialog.isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">{confirmDialog.title}</h3>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeConfirmation}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  closeConfirmation();
                  cb();
                }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95 ${
                  confirmDialog.isDestructive 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                }`}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TranscriberView({ 
  text, updateText, undo, redo, clearText, canUndo, canRedo, showToast, askConfirmation
}: { 
  text: string;
  updateText: (t: string) => void;
  undo: () => void;
  redo: () => void;
  clearText: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  askConfirmation: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}) {
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en-US');
  
  const recognitionRef = useRef<any>(null);
  const textRef = useRef(text);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const rec = new SpeechRecognition();
      try {
        rec.continuous = true;
      } catch (_) {}
      try {
        rec.interimResults = true;
      } catch (_) {}
      rec.lang = language;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          const current = textRef.current ?? '';
          const space = current && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
          const updated = current + space + final;
          textRef.current = updated;
          updateText(updated);
        }
        setInterimText(interim);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error, e);
        setIsRecording(false);
        setInterimText('');
        if (e.error === 'not-allowed') {
          showToast("Microphone access blocked! Click the lock/microphone icon in your browser address bar to allow access.", "error");
        } else if (e.error === 'audio-capture') {
          showToast("No microphone detected. Please check your microphone connection.", "error");
        } else if (e.error === 'network') {
          showToast("Network error. Speech recognition requires an active internet connection.", "error");
        } else if (e.error === 'no-speech') {
          showToast("No speech detected. Please speak closer to your microphone.", "warning");
        } else if (e.error !== 'aborted') {
          showToast(`Speech recognition error: ${e.error}`, "error");
        }
      };

      rec.onend = () => {
        setIsRecording(false);
        setInterimText('');
      };

      recognitionRef.current = rec;
      return rec;
    } catch (err) {
      console.error("Failed to initialize SpeechRecognition:", err);
      return null;
    }
  }, [language, updateText, showToast]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setTimeout(() => {
        try {
          const rec = initRecognition();
          rec?.start();
          setIsRecording(true);
        } catch (_) {}
      }, 200);
    }
  }, [language, initRecognition, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      setIsRecording(false);
      setInterimText('');
      showToast("Recording stopped.", "info");
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRecognition) {
      showToast("Speech Recognition is not supported in this browser. Please open OmniScribe in Google Chrome or Microsoft Edge.", "error");
      return;
    }

    const rec = initRecognition();
    if (!rec) {
      showToast("Could not start speech recognition.", "error");
      return;
    }

    try {
      rec.lang = language;
      rec.start();
      setIsRecording(true);
      const langNames: Record<string, string> = {
        'en-US': 'English',
        'ta-LK': 'Tamil (தமிழ்)',
        'si-LK': 'Sinhala (සිංහල)',
        'ar-SA': 'Arabic (العربية)',
        'hi-IN': 'Hindi (हिन्दी)',
        'ur-PK': 'Urdu (اردو)',
      };
      showToast(`Recording active. Listening in ${langNames[language] || language}...`, "success");
    } catch (startErr: any) {
      console.error("Speech start error:", startErr);
      if (startErr.name === 'InvalidStateError') {
        setIsRecording(true);
      } else {
        showToast("Error starting speech recognition: " + (startErr.message || "Please refresh the page"), "error");
        setIsRecording(false);
      }
    }
  };

  const insertText = (str: string) => {
    const el = textAreaRef.current;
    const current = textRef.current ?? '';

    let start = current.length;
    let end = current.length;

    if (el && typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
      start = el.selectionStart;
      end = el.selectionEnd;
    }

    const newText = current.substring(0, start) + str + current.substring(end);
    textRef.current = newText;
    updateText(newText);

    const nextPos = start + str.length;
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const handleBackspace = () => {
    const el = textAreaRef.current;
    const current = textRef.current ?? '';
    if (!current) return;

    let start = current.length;
    let end = current.length;

    if (el && typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
      start = el.selectionStart;
      end = el.selectionEnd;
    }

    let newText = current;
    let nextPos = start;

    if (start !== end) {
      newText = current.substring(0, start) + current.substring(end);
      nextPos = start;
    } else if (start > 0) {
      const chars = Array.from(current.substring(0, start));
      chars.pop();
      const prefix = chars.join('');
      newText = prefix + current.substring(end);
      nextPos = prefix.length;
    }

    textRef.current = newText;
    updateText(newText);

    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  const handleExportWord = async () => {
    if (!text.trim()) {
      showToast("Nothing to export! Transcript is empty.", "warning");
      return;
    }
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [new TextRun({ text: text, font: 'Nirmala UI', size: 24 })]
            })
          ]
        }]
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OmniScribe_Transcript.docx';
      a.click();
      showToast("Word document exported successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("Export to Word failed.", "error");
    }
  };

  const handleExportPDF = () => {
    if (!text.trim()) {
      showToast("Nothing to export! Transcript is empty.", "warning");
      return;
    }
    try {
      const pdf = new jsPDF();
      const splitText = pdf.splitTextToSize(text, 180);
      pdf.text(splitText, 15, 20);
      pdf.save('OmniScribe_Transcript.pdf');
      showToast("PDF document exported successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("Export to PDF failed.", "error");
    }
  };

  const handleExportPPT = () => {
    if (!text.trim()) {
      showToast("Nothing to export! Transcript is empty.", "warning");
      return;
    }
    try {
      const pres = new PptxGenJS();
      const slide = pres.addSlide();
      slide.addText(text, { x: 0.5, y: 0.5, w: '90%', h: '80%', fontSize: 24, fontFace: 'Nirmala UI' });
      pres.writeFile({ fileName: 'OmniScribe_Transcript.pptx' });
      showToast("PowerPoint exported successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("Export to PowerPoint failed.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-[#18181b] border border-white/10 rounded-xl p-5 shadow-xl shadow-black/50">
          <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-2 block">Speech Language</label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'en-US', label: 'English (US)' },
                  { id: 'ta-LK', label: 'Tamil (தமிழ்)' },
                  { id: 'si-LK', label: 'Sinhala (සිංහල)' },
                  { id: 'ar-SA', label: 'Arabic (العربية)' },
                  { id: 'hi-IN', label: 'Hindi (हिन्दी)' },
                  { id: 'ur-PK', label: 'Urdu (اردو)' },
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                      language === lang.id 
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' 
                        : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#18181b] border border-white/10 rounded-xl p-5 shadow-xl shadow-black/50">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            Pro Feature
          </h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Upgrade to Pro to unlock cloud synchronization, premium AI summaries, and advanced speaker diarization.
          </p>
          <button className="mt-4 w-full bg-white text-black font-semibold text-sm py-2 rounded-lg hover:bg-white/90 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Main Console */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-[#18181b] border border-white/10 rounded-xl p-5 shadow-xl shadow-black/50 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isRecording 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <div className="flex gap-2">
              <button 
                onClick={undo}
                disabled={!canUndo}
                className={`p-2.5 rounded-lg border border-white/10 transition-colors ${canUndo ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white' : 'opacity-50 cursor-not-allowed text-white/30'}`}
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button 
                onClick={redo}
                disabled={!canRedo}
                className={`p-2.5 rounded-lg border border-white/10 transition-colors ${canRedo ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white' : 'opacity-50 cursor-not-allowed text-white/30'}`}
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { 
                  if (!text.trim()) {
                    showToast("Nothing to copy! Transcript is empty.", "warning");
                    return;
                  }
                  navigator.clipboard.writeText(text); 
                  showToast("Transcript copied to clipboard!", "success"); 
                }}
                className="p-2.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                title="Copy text"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  if (!text.trim()) {
                    showToast("Transcript is already empty.", "info");
                    return;
                  }
                  askConfirmation({
                    title: "Clear Transcript?",
                    message: "Are you sure you want to clear your current transcript? All unsaved text will be permanently erased.",
                    confirmLabel: "Clear Transcript",
                    isDestructive: true,
                    onConfirm: () => {
                      clearText();
                      showToast("Transcript cleared.", "info");
                    }
                  });
                }}
                className="p-2.5 rounded-lg bg-white/5 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10 mr-4"
                title="Clear text"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <button 
                  onClick={handleExportWord}
                  className="px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-blue-400 transition-colors border-r border-white/10 text-sm font-medium flex items-center gap-2"
                  title="Export Word"
                >
                  <FileText className="w-4 h-4" /> Word
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-red-400 transition-colors border-r border-white/10 text-sm font-medium flex items-center gap-2"
                  title="Export PDF"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={handleExportPPT}
                  className="px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-orange-400 transition-colors text-sm font-medium flex items-center gap-2"
                  title="Export PPT"
                >
                  <Download className="w-4 h-4" /> PPT
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative rounded-lg border border-white/5 bg-black/30 p-4">
            <textarea
              ref={textAreaRef}
              value={text}
              dir={language.startsWith('ar') || language.startsWith('ur') ? 'rtl' : 'ltr'}
              onChange={(e) => {
                textRef.current = e.target.value;
                updateText(e.target.value);
              }}
              placeholder="Your transcript will appear here. You can also type directly..."
              className={`w-full min-h-[300px] bg-transparent text-white/90 text-lg resize-y outline-none placeholder:text-white/20 font-light leading-relaxed ${
                language.startsWith('ar') || language.startsWith('ur') ? 'text-right' : 'text-left'
              }`}
            />
            {interimText && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 italic text-sm backdrop-blur-md">
                {interimText}
              </div>
            )}
          </div>
        </div>
        
        {/* On-Screen Keyboard */}
        <Keyboard 
          onKeyPress={(key) => insertText(key)}
          onBackspace={handleBackspace}
          onSpace={() => insertText(' ')}
          onEnter={() => insertText('\n')}
        />
      </div>
    </div>
  );
}

function ConverterView({
  sourceText, setSourceText, targetFont, setTargetFont, showToast, askConfirmation
}: {
  sourceText: string;
  setSourceText: (t: string) => void;
  targetFont: string;
  setTargetFont: (f: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  askConfirmation: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}) {
  const isRtl = React.useMemo(() => {
    return targetFont.startsWith('arabic-') || targetFont.startsWith('urdu-');
  }, [targetFont]);

  const convertedText = React.useMemo(() => {
    if (!sourceText) return '';
    let result = sourceText;

    try {
      switch (targetFont) {
        // --- Tamil ---
        case 'bamini':
          result = (tamilTools.regExpHelper as any).UnicodeToBamini 
            ? (tamilTools.regExpHelper as any).UnicodeToBamini(sourceText) 
            : sourceText;
          break;
        case 'tscii':
          result = (tamilTools.regExpHelper as any).UnicodeToTscii 
            ? (tamilTools.regExpHelper as any).UnicodeToTscii(sourceText) 
            : sourceText;
          break;
        case 'bamini-to-unicode':
          result = baminiToUnicode(sourceText);
          break;
        case 'tanglish-to-unicode':
          result = tanglishToUnicode(sourceText);
          break;
        case 'google-tamil':
        case 'tiro-tamil':
          result = sourceText;
          break;

        // --- Sinhala ---
        case 'dl-manel':
          result = unicodeToDlManel(sourceText);
          break;
        case 'kaputa':
          result = unicodeToKaputa(sourceText);
          break;
        case 'dl-manel-to-unicode':
          result = dlManelToUnicode(sourceText);
          break;
        case 'singlish-to-unicode':
          result = singlishToUnicode(sourceText);
          break;
        case 'google-sinhala':
        case 'abhaya-sinhala':
          result = sourceText;
          break;

        // --- English ---
        case 'english-uppercase':
          result = sourceText.toUpperCase();
          break;
        case 'english-lowercase':
          result = sourceText.toLowerCase();
          break;
        case 'english-titlecase':
          result = sourceText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
          break;
        case 'english-inter':
        case 'english-playfair':
        case 'english-mono':
        case 'english-cursive':
        case 'english-cinzel':
          result = sourceText;
          break;

        // --- Arabic ---
        case 'arabic-strip-tashkeel':
          result = sourceText.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '');
          break;
        case 'arabic-normalize':
          result = sourceText
            .replace(/[إأآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي');
          break;
        case 'arabic-to-indic-numerals': {
          const eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
          result = sourceText.replace(/[0-9]/g, (d) => eastern[parseInt(d, 10)]);
          break;
        }
        case 'indic-to-arabic-numerals':
          result = sourceText.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
          break;
        case 'arabic-amiri':
        case 'arabic-scheherazade':
        case 'arabic-kufi':
        case 'arabic-cairo':
          result = sourceText;
          break;

        // --- Hindi ---
        case 'hindi-noto':
        case 'hindi-rozha':
          result = sourceText;
          break;

        // --- Urdu ---
        case 'urdu-nastaliq':
          result = sourceText;
          break;

        default:
          result = sourceText;
          break;
      }
    } catch (e) {
      console.error("Conversion error", e);
    }
    return result;
  }, [sourceText, targetFont]);

  const getFontFamily = () => {
    switch (targetFont) {
      // Tamil
      case 'bamini':
        return "'Bamini', sans-serif";
      case 'tscii':
        return "'TSCII', sans-serif";
      case 'google-tamil':
      case 'bamini-to-unicode':
      case 'tanglish-to-unicode':
        return "'Noto Sans Tamil', sans-serif";
      case 'tiro-tamil':
        return "'Tiro Tamil', serif";

      // Sinhala
      case 'dl-manel':
      case 'kaputa':
        return "'DL-Manel', 'FM-Abhaya', sans-serif";
      case 'google-sinhala':
      case 'dl-manel-to-unicode':
      case 'singlish-to-unicode':
        return "'Noto Sans Sinhala', sans-serif";
      case 'abhaya-sinhala':
        return "'Abhaya Libre', serif";

      // English
      case 'english-inter':
      case 'english-uppercase':
      case 'english-lowercase':
      case 'english-titlecase':
        return "'Inter', sans-serif";
      case 'english-playfair':
        return "'Playfair Display', serif";
      case 'english-mono':
        return "'JetBrains Mono', monospace";
      case 'english-cursive':
        return "'Dancing Script', cursive";
      case 'english-cinzel':
        return "'Cinzel', serif";

      // Arabic
      case 'arabic-amiri':
      case 'arabic-strip-tashkeel':
      case 'arabic-normalize':
      case 'arabic-to-indic-numerals':
      case 'indic-to-arabic-numerals':
        return "'Amiri', 'Noto Naskh Arabic', serif";
      case 'arabic-scheherazade':
        return "'Scheherazade New', serif";
      case 'arabic-kufi':
        return "'Noto Kufi Arabic', sans-serif";
      case 'arabic-cairo':
        return "'Cairo', sans-serif";

      // Hindi
      case 'hindi-noto':
        return "'Noto Sans Devanagari', sans-serif";
      case 'hindi-rozha':
        return "'Rozha One', serif";

      // Urdu
      case 'urdu-nastaliq':
        return "'Noto Nastaliq Urdu', serif";

      default:
        return "inherit";
    }
  };

  const getExportFontFace = () => {
    if (targetFont === 'bamini') return 'Bamini';
    if (targetFont === 'tscii') return 'TSCII';
    if (targetFont === 'dl-manel' || targetFont === 'kaputa') return 'DL-Manel';
    if (targetFont.startsWith('arabic-')) return 'Amiri';
    if (targetFont.startsWith('urdu-')) return 'Noto Nastaliq Urdu';
    if (targetFont.startsWith('hindi-')) return 'Mangal';
    if (targetFont === 'tiro-tamil') return 'Tiro Tamil';
    if (targetFont.includes('tamil')) return 'Noto Sans Tamil';
    if (targetFont === 'abhaya-sinhala') return 'Abhaya Libre';
    if (targetFont.includes('sinhala')) return 'Noto Sans Sinhala';
    if (targetFont === 'english-playfair') return 'Playfair Display';
    if (targetFont === 'english-mono') return 'Courier New';
    if (targetFont === 'english-cursive') return 'Segoe Script';
    return 'Nirmala UI';
  };

  const handleExportWord = async () => {
    if (!convertedText.trim()) {
      showToast("Nothing to export! Converted output is empty.", "warning");
      return;
    }
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [new TextRun({ text: convertedText, font: getExportFontFace(), size: 24 })]
            })
          ]
        }]
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OmniScribe_Converted.docx';
      a.click();
      showToast("Word document exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Word export failed.", "error");
    }
  };

  const handleExportPDF = () => {
    if (!convertedText.trim()) {
      showToast("Nothing to export! Converted output is empty.", "warning");
      return;
    }
    try {
      const pdf = new jsPDF();
      const splitText = pdf.splitTextToSize(convertedText, 180);
      pdf.text(splitText, 15, 20);
      pdf.save('OmniScribe_Converted.pdf');
      showToast("PDF document exported successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("PDF export failed.", "error");
    }
  };

  const handleExportPPT = () => {
    if (!convertedText.trim()) {
      showToast("Nothing to export! Converted output is empty.", "warning");
      return;
    }
    try {
      const pres = new PptxGenJS();
      const slide = pres.addSlide();
      slide.addText(convertedText, { 
        x: 0.5, 
        y: 0.5, 
        w: '90%', 
        h: '80%', 
        fontSize: 24, 
        fontFace: getExportFontFace(),
        align: isRtl ? 'right' : 'left'
      });
      pres.writeFile({ fileName: 'OmniScribe_Converted.pptx' });
      showToast("PowerPoint exported successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("PowerPoint export failed.", "error");
    }
  };

  const sampleTexts: Record<string, string> = {
    tamil: 'யாதும் ஊரே யாவரும் கேளிர்.',
    sinhala: 'සියලු මනුෂ්‍යයෝ නිදහස්ව උපත ලබා ඇත.',
    english: 'The quick brown fox jumps over the lazy dog.',
    arabic: 'مَرْحَبًا بِكُمْ فِي أُومْنِي سْكْرَايْبْ، الْمَنَصَّةُ الشَّامِلَةُ.',
    hindi: 'वसुधैव कुटुम्बकम् - सारा संसार एक परिवार है.',
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-white mb-1">Multilingual Unicode & Font Studio</h2>
          <p className="text-sm text-white/50">Convert legacy encodings, transform scripts, and preview typography</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (sourceText.trim()) {
                askConfirmation({
                  title: "Clear Converter?",
                  message: "Are you sure you want to clear your source text and reset font format?",
                  confirmLabel: "Clear All",
                  isDestructive: true,
                  onConfirm: () => {
                    setSourceText('');
                    setTargetFont('none');
                    showToast("Converter reset.", "info");
                  }
                });
              } else {
                setSourceText('');
                setTargetFont('none');
                showToast("Converter reset.", "info");
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          
          <div className="flex bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20 border border-indigo-500/50 overflow-hidden">
            <button 
              onClick={handleExportWord}
              className="px-3 py-2 text-white hover:bg-indigo-700 transition-all border-r border-indigo-500/50 text-sm font-medium flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Word
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-3 py-2 text-white hover:bg-indigo-700 transition-all border-r border-indigo-500/50 text-sm font-medium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button 
              onClick={handleExportPPT}
              className="px-3 py-2 text-white hover:bg-indigo-700 transition-all text-sm font-medium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> PPT
            </button>
          </div>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-white/50">
        <span className="font-medium text-white/40">Quick Sample:</span>
        <button
          onClick={() => { setSourceText(sampleTexts.tamil); setTargetFont('google-tamil'); }}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 transition-colors"
        >
          தமிழ் (Tamil)
        </button>
        <button
          onClick={() => { setSourceText(sampleTexts.sinhala); setTargetFont('google-sinhala'); }}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-emerald-300 border border-white/10 transition-colors"
        >
          සිංහල (Sinhala)
        </button>
        <button
          onClick={() => { setSourceText(sampleTexts.english); setTargetFont('english-playfair'); }}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-sky-300 border border-white/10 transition-colors"
        >
          English
        </button>
        <button
          onClick={() => { setSourceText(sampleTexts.arabic); setTargetFont('arabic-amiri'); }}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition-colors"
        >
          العربية (Arabic)
        </button>
        <button
          onClick={() => { setSourceText(sampleTexts.hindi); setTargetFont('hindi-noto'); }}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-orange-300 border border-white/10 transition-colors"
        >
          हिन्दी (Hindi)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Pane */}
        <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-xl shadow-black/50">
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-sm font-medium text-white/70">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-white/40" /> Source Text (Unicode / Input)
            </div>
            {sourceText && (
              <span className="text-xs text-white/40 font-mono">{sourceText.length} chars</span>
            )}
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste or type your text here in any language (Tamil, Sinhala, English, Arabic, Hindi, etc.)..."
            className="flex-1 w-full bg-transparent p-5 text-white/90 text-lg resize-none outline-none placeholder:text-white/20 font-light leading-relaxed"
          />
        </div>

        {/* Destination Pane */}
        <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-xl shadow-black/50">
          <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <FileText className="w-4 h-4 text-white/40" /> Converted Output
              {isRtl && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  RTL
                </span>
              )}
            </div>
            <select
              value={targetFont}
              onChange={(e) => setTargetFont(e.target.value)}
              className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white/90 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium cursor-pointer max-w-[280px] sm:max-w-[340px]"
            >
              <option value="none">-- Select Target Font / Format --</option>
              
              <optgroup label="Tamil (தமிழ்)" className="bg-[#18181b] text-indigo-300 font-semibold">
                <option value="bamini" className="text-white">Tamil: Bamini (Legacy Encoding)</option>
                <option value="tscii" className="text-white">Tamil: TSCII (Legacy Encoding)</option>
                <option value="google-tamil" className="text-white">Tamil: Noto Sans Tamil (Modern Clean)</option>
                <option value="tiro-tamil" className="text-white">Tamil: Tiro Tamil (Literary Serif)</option>
                <option value="bamini-to-unicode" className="text-white">Tamil: Bamini ➔ Unicode Converter</option>
                <option value="tanglish-to-unicode" className="text-white">Tamil: Tanglish (Phonetic) ➔ Unicode</option>
              </optgroup>

              <optgroup label="Sinhala (සිංහල)" className="bg-[#18181b] text-emerald-300 font-semibold">
                <option value="dl-manel" className="text-white">Sinhala: DL-Manel / FM-Abhaya (Legacy)</option>
                <option value="kaputa" className="text-white">Sinhala: Kaputa (Legacy Encoding)</option>
                <option value="google-sinhala" className="text-white">Sinhala: Noto Sans Sinhala (Modern Clean)</option>
                <option value="abhaya-sinhala" className="text-white">Sinhala: Abhaya Libre (Classic Serif)</option>
                <option value="dl-manel-to-unicode" className="text-white">Sinhala: DL-Manel ➔ Unicode Converter</option>
                <option value="singlish-to-unicode" className="text-white">Sinhala: Singlish (Phonetic) ➔ Unicode</option>
              </optgroup>

              <optgroup label="English (Latin)" className="bg-[#18181b] text-sky-300 font-semibold">
                <option value="english-inter" className="text-white">English: Inter (Clean Modern Sans)</option>
                <option value="english-playfair" className="text-white">English: Playfair Display (Luxury Serif)</option>
                <option value="english-mono" className="text-white">English: JetBrains Mono (Developer Code)</option>
                <option value="english-cursive" className="text-white">English: Dancing Script (Cursive / Hand)</option>
                <option value="english-cinzel" className="text-white">English: Cinzel (Classic Roman / Capital)</option>
                <option value="english-uppercase" className="text-white">English: UPPERCASE (ALL CAPS)</option>
                <option value="english-lowercase" className="text-white">English: lowercase (all small)</option>
                <option value="english-titlecase" className="text-white">English: Title Case (Capitalize Words)</option>
              </optgroup>

              <optgroup label="Arabic (العربية)" className="bg-[#18181b] text-amber-300 font-semibold">
                <option value="arabic-amiri" className="text-white">Arabic: Amiri (Classical Calligraphy / Naskh)</option>
                <option value="arabic-scheherazade" className="text-white">Arabic: Scheherazade New (Traditional)</option>
                <option value="arabic-kufi" className="text-white">Arabic: Noto Kufi (Modern Geometric)</option>
                <option value="arabic-cairo" className="text-white">Arabic: Cairo (Contemporary Sans)</option>
                <option value="arabic-strip-tashkeel" className="text-white">Arabic: Strip Diacritics / Harakat (Tashkeel)</option>
                <option value="arabic-normalize" className="text-white">Arabic: Normalize Letters (Alef / Ya / Ta)</option>
                <option value="arabic-to-indic-numerals" className="text-white">Arabic: Western ➔ Eastern Numerals (123 ➔ ١٢٣)</option>
                <option value="indic-to-arabic-numerals" className="text-white">Arabic: Eastern ➔ Western Numerals (١٢٣ ➔ 123)</option>
              </optgroup>

              <optgroup label="Hindi & Devanagari (हिन्दी)" className="bg-[#18181b] text-orange-300 font-semibold">
                <option value="hindi-noto" className="text-white">Hindi: Noto Sans Devanagari (Clean Modern)</option>
                <option value="hindi-rozha" className="text-white">Hindi: Rozha One (Calligraphic Serif)</option>
              </optgroup>

              <optgroup label="Urdu (اردو)" className="bg-[#18181b] text-pink-300 font-semibold">
                <option value="urdu-nastaliq" className="text-white">Urdu: Noto Nastaliq Urdu (Nastaliq Script)</option>
              </optgroup>
            </select>
          </div>
          <div className="flex-1 relative flex flex-col">
            <textarea
              readOnly
              value={convertedText}
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{ fontFamily: getFontFamily() }}
              placeholder="Converted or styled text will appear here..."
              className={`flex-1 w-full bg-black/20 p-5 text-white/90 text-lg resize-none outline-none placeholder:text-white/20 font-light leading-relaxed ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            />
            {convertedText && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(convertedText);
                  showToast("Converted text copied to clipboard!", "success");
                }}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium backdrop-blur-md border border-white/10 transition-colors shadow-lg active:scale-95"
                title="Copy converted text"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Result
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
