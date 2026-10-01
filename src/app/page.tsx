'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Download, Copy, Trash2, ArrowRightLeft, FileText, Type, Undo, Redo } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import * as tamilTools from 'tamil-language-tools-and-assets';
import { unicodeToDlManel } from 'sinhala-unicode-coverter';
import Keyboard from '../components/Keyboard';

export default function OmniScribeApp() {
  const [activeTab, setActiveTab] = useState<'transcribe' | 'convert'>('transcribe');

  // Transcriber State
  const [text, setText] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const historyRef = useRef<string[]>(['']);
  const historyIndexRef = useRef(0);

  // Converter State
  const [sourceText, setSourceText] = useState('');
  const [targetFont, setTargetFont] = useState('none');

  const updateUI = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const updateText = useCallback((newText: string) => {
    const currentText = historyRef.current[historyIndexRef.current];
    if (newText === currentText) return;

    const isSingleChar = Math.abs(newText.length - currentText.length) === 1;
    const isSpaceOrNewline = newText.endsWith(' ') || newText.endsWith('\n');

    let newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);

    if (isSingleChar && !isSpaceOrNewline && historyIndexRef.current > 0) {
       const prevText = newHistory[newHistory.length - 2];
       if (Math.abs(newHistory[newHistory.length - 1].length - prevText.length) === 1) {
         newHistory[newHistory.length - 1] = newText;
       } else {
         newHistory.push(newText);
         historyIndexRef.current = newHistory.length - 1;
       }
    } else {
       newHistory.push(newText);
       historyIndexRef.current = newHistory.length - 1;
    }

    historyRef.current = newHistory;
    setText(newText);
    updateUI();
  }, [updateUI]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      setText(historyRef.current[historyIndexRef.current]);
      updateUI();
    }
  }, [updateUI]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      setText(historyRef.current[historyIndexRef.current]);
      updateUI();
    }
  }, [updateUI]);

  const clearText = useCallback(() => {
    if (historyRef.current[historyIndexRef.current] !== '') {
      updateText('');
    }
  }, [updateText]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">OmniScribe <span className="text-white/40 font-normal">Pro</span></h1>
          </div>
          <nav className="flex items-center p-1 bg-white/5 rounded-lg border border-white/10">
            <button 
              onClick={() => setActiveTab('transcribe')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'transcribe' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              Live Transcriber
            </button>
            <button 
              onClick={() => setActiveTab('convert')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'convert' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:text-white'
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
          />
        ) : (
          <ConverterView 
            sourceText={sourceText}
            setSourceText={setSourceText}
            targetFont={targetFont}
            setTargetFont={setTargetFont}
          />
        )}
      </main>
    </div>
  );
}

function TranscriberView({ 
  text, updateText, undo, redo, clearText, canUndo, canRedo 
}: { 
  text: string;
  updateText: (t: string) => void;
  undo: () => void;
  redo: () => void;
  clearText: () => void;
  canUndo: boolean;
  canRedo: boolean;
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

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) updateText(textRef.current + final);
        setInterimText(interim);
      };
      
      recognitionRef.current.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsRecording(false);
      };
    }
  }, [updateText]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      if (isRecording) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 100);
      }
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const current = textRef.current;
      updateText(current + (current.endsWith(' ') || current.length === 0 ? '' : ' '));
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const insertText = (str: string) => {
    const el = textAreaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newText = textRef.current.substring(0, start) + str + textRef.current.substring(end);
      updateText(newText);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + str.length;
        el.focus();
      }, 0);
    } else {
      updateText(textRef.current + str);
    }
  };

  const handleBackspace = () => {
    const el = textAreaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start === end && start > 0) {
        const newText = textRef.current.substring(0, start - 1) + textRef.current.substring(end);
        updateText(newText);
        setTimeout(() => {
          el.selectionStart = el.selectionEnd = start - 1;
          el.focus();
        }, 0);
      } else if (start !== end) {
        const newText = textRef.current.substring(0, start) + textRef.current.substring(end);
        updateText(newText);
        setTimeout(() => {
          el.selectionStart = el.selectionEnd = start;
          el.focus();
        }, 0);
      }
    }
  };

  const handleExportWord = async () => {
    if (!text.trim()) return alert("Nothing to export!");
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
    } catch (e) {
      console.error(e);
      alert("Export failed");
    }
  };

  const handleExportPDF = () => {
    if (!text.trim()) return alert("Nothing to export!");
    try {
      const pdf = new jsPDF();
      const splitText = pdf.splitTextToSize(text, 180);
      pdf.text(splitText, 15, 20);
      pdf.save('OmniScribe_Transcript.pdf');
    } catch (e) {
      console.error(e);
      alert("Export failed");
    }
  };

  const handleExportPPT = () => {
    if (!text.trim()) return alert("Nothing to export!");
    try {
      const pres = new PptxGenJS();
      const slide = pres.addSlide();
      slide.addText(text, { x: 0.5, y: 0.5, w: '90%', h: '80%', fontSize: 24, fontFace: 'Nirmala UI' });
      pres.writeFile({ fileName: 'OmniScribe_Transcript.pptx' });
    } catch (e) {
      console.error(e);
      alert("Export failed");
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
                  { id: 'si-LK', label: 'Sinhala (සිංහල)' }
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
                onClick={() => { navigator.clipboard.writeText(text); alert("Copied!"); }}
                className="p-2.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                title="Copy text"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { if(confirm('Clear transcript?')) clearText(); }}
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
              onChange={(e) => updateText(e.target.value)}
              placeholder="Your transcript will appear here. You can also type directly..."
              className="w-full min-h-[300px] bg-transparent text-white/90 text-lg resize-y outline-none placeholder:text-white/20 font-light leading-relaxed"
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
  sourceText, setSourceText, targetFont, setTargetFont
}: {
  sourceText: string;
  setSourceText: (t: string) => void;
  targetFont: string;
  setTargetFont: (f: string) => void;
}) {
  
  const convertedText = React.useMemo(() => {
    let result = sourceText;
    if (targetFont === 'bamini') {
      try {
        result = tamilTools.regExpHelper.UnicodeToBamini(sourceText);
      } catch (e) {
        console.error("Bamini conversion error", e);
      }
    } else if (targetFont === 'dl-manel') {
      try {
        result = unicodeToDlManel(sourceText);
      } catch (e) {
        console.error("Sinhala conversion error", e);
      }
    }
    return result;
  }, [sourceText, targetFont]);

  const getFontFamily = () => {
    if (targetFont === 'bamini') return "Bamini, sans-serif";
    if (targetFont === 'dl-manel') return "DL-Manel, FM-Abhaya, sans-serif";
    if (targetFont === 'google-tamil') return "'Noto Sans Tamil', sans-serif";
    if (targetFont === 'google-sinhala') return "'Noto Sans Sinhala', sans-serif";
    return "inherit";
  };

  const handleExportWord = async () => {
    if (!convertedText.trim()) return alert("Nothing to save!");
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [new TextRun({ text: convertedText, font: targetFont === 'bamini' ? 'Bamini' : 'Nirmala UI', size: 24 })]
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
    } catch (err) {
      console.error(err);
      alert('Word export failed');
    }
  };

  const handleExportPDF = () => {
    if (!convertedText.trim()) return alert("Nothing to export!");
    try {
      const pdf = new jsPDF();
      const splitText = pdf.splitTextToSize(convertedText, 180);
      pdf.text(splitText, 15, 20);
      pdf.save('OmniScribe_Converted.pdf');
    } catch (e) {
      console.error(e);
      alert("Export failed");
    }
  };

  const handleExportPPT = () => {
    if (!convertedText.trim()) return alert("Nothing to export!");
    try {
      const pres = new PptxGenJS();
      const slide = pres.addSlide();
      slide.addText(convertedText, { x: 0.5, y: 0.5, w: '90%', h: '80%', fontSize: 24, fontFace: targetFont === 'bamini' ? 'Bamini' : 'Nirmala UI' });
      pres.writeFile({ fileName: 'OmniScribe_Converted.pptx' });
    } catch (e) {
      console.error(e);
      alert("Export failed");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-white mb-1">Unicode & Legacy Font Converter</h2>
          <p className="text-sm text-white/50">Convert standard text to legacy encodings or preview typography</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setSourceText(''); setTargetFont('none'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10 text-sm font-medium mr-2"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Pane */}
        <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-xl shadow-black/50">
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2 text-sm font-medium text-white/70">
            <Type className="w-4 h-4 text-white/40" /> Source Text (Unicode)
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste your Unicode text here..."
            className="flex-1 w-full bg-transparent p-5 text-white/90 text-lg resize-none outline-none placeholder:text-white/20 font-light leading-relaxed"
          />
        </div>

        {/* Destination Pane */}
        <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-xl shadow-black/50">
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <FileText className="w-4 h-4 text-white/40" /> Converted Output
            </div>
            <select
              value={targetFont}
              onChange={(e) => setTargetFont(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-md px-3 py-1 text-sm text-white/80 outline-none focus:border-indigo-500/50"
            >
              <option value="none">-- Select Target Font --</option>
              <option value="bamini">Tamil: Bamini (Legacy)</option>
              <option value="dl-manel">Sinhala: DL-Manel / FM-Abhaya (Legacy)</option>
              <option value="google-tamil">Style: Noto Sans Tamil</option>
            </select>
          </div>
          <textarea
            readOnly
            value={convertedText}
            style={{ fontFamily: getFontFamily() }}
            placeholder="Converted text will appear here..."
            className="flex-1 w-full bg-black/20 p-5 text-white/90 text-lg resize-none outline-none placeholder:text-white/20 font-light leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
