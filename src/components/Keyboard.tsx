import React, { useState, useRef } from 'react';
import { Delete, Space, CornerDownLeft, Keyboard as KeyboardIcon } from 'lucide-react';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
}

const keyMaps = {
  tamil: {
    name: 'தமிழ்',
    groups: [
      {
        title: 'VOWELS (உயிரெழுத்துக்கள்)',
        keys: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ஃ'],
      },
      {
        title: 'CONSONANTS (மெய்யெழுத்துக்கள் & கிரந்தம்)',
        keys: ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன', 'ஜ', 'ஷ', 'ஸ', 'ஹ', 'க்ஷ', 'ஸ்ரீ'],
      },
      {
        title: 'VOWEL SIGNS / MODIFIERS (உயிர்மெய் குறிகள் — TAP AFTER CONSONANT)',
        keys: ['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்'],
      },
    ],
  },
  sinhala: {
    name: 'සිංහල',
    groups: [
      {
        title: 'VOWELS',
        keys: ['අ', 'ආ', 'ඇ', 'ඈ', 'ඉ', 'ඊ', 'උ', 'ඌ', 'එ', 'ඒ', 'ඓ', 'ඔ', 'ඕ', 'ඖ'],
      },
      {
        title: 'CONSONANTS',
        keys: ['ක', 'ඛ', 'ග', 'ඝ', 'ඞ', 'ඟ', 'ච', 'ඡ', 'ජ', 'ඣ', 'ඤ', 'ඥ', 'ඦ', 'ට', 'ඨ', 'ඩ', 'ඪ', 'ණ', 'ඬ', 'ත', 'ථ', 'ද', 'ධ', 'න', 'ඳ', 'ප', 'ෆ', 'බ', 'භ', 'ම', 'ඹ', 'ය', 'ර', 'ල', 'ව', 'ශ', 'ෂ', 'ස', 'හ', 'ළ', 'අං', 'අඃ'],
      },
      {
        title: 'MODIFIERS',
        keys: ['ා', 'ැ', 'ෑ', 'ි', 'ී', 'ු', 'ූ', 'ෘ', 'ෙ', 'ේ', 'ෛ', 'ො', 'ෝ', 'ෞ', '්'],
      },
    ],
  },
  english: {
    name: 'English',
    groups: [
      {
        title: 'LETTERS (LOWERCASE)',
        keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
      },
      {
        title: 'LETTERS (UPPERCASE)',
        keys: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      },
      {
        title: 'NUMBERS & SYMBOLS',
        keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '@', '#', '$', '%', '&', '*', '(', ')', '+', '=', '/', '\\', ':', ';', '"', "'"],
      },
    ],
  },
  arabic: {
    name: 'العربية',
    groups: [
      {
        title: 'LETTERS',
        keys: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء', 'أ', 'إ', 'ؤ', 'ئ', 'ة'],
      },
      {
        title: 'TASHKEEL (MODIFIERS)',
        keys: ['َ', 'ِ', 'ُ', 'ً', 'ٍ', 'ٌ', 'ْ', 'ّ'],
      },
    ],
  },
  hindi: {
    name: 'हिन्दी',
    groups: [
      {
        title: 'VOWELS',
        keys: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
      },
      {
        title: 'CONSONANTS',
        keys: ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ'],
      },
      {
        title: 'MATRAS (MODIFIERS)',
        keys: ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', '्'],
      },
    ],
  },
};

type LangKey = keyof typeof keyMaps;

export default function Keyboard({ onKeyPress, onBackspace, onSpace, onEnter }: KeyboardProps) {
  const [activeLang, setActiveLang] = useState<LangKey>('tamil');

  // Prevents mouse clicks from taking focus away from the active textarea
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      e.preventDefault();
    }
  };

  const currentMap = keyMaps[activeLang];

  return (
    <div className="mt-4 bg-[#111113] border border-white/10 rounded-xl p-4 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
          <KeyboardIcon className="w-5 h-5 text-indigo-400" />
          On-Screen Keyboards <span className="text-white/40 text-xs hidden sm:inline">(Tap characters to insert at cursor in Script Box above)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(keyMaps) as LangKey[]).map((lang) => (
            <button
              type="button"
              key={lang}
              onPointerDown={handlePointerDown}
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all border cursor-pointer select-none ${
                activeLang === lang
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-medium shadow-sm'
                  : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {keyMaps[lang].name} Keyboard
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {currentMap.groups.map((group, i) => (
          <div key={i} className="space-y-2">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">{group.title}</div>
            <div className="flex flex-wrap gap-2">
              {group.keys.map((key, j) => (
                <button
                  type="button"
                  key={j}
                  onPointerDown={handlePointerDown}
                  onClick={() => onKeyPress(key)}
                  className="h-10 min-w-10 px-2 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f46] active:bg-indigo-600 active:text-white text-white/90 font-medium text-lg border border-white/5 transition-all shadow-sm cursor-pointer select-none active:scale-95"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center">
          {['.', ',', '?', '!', '-'].map((punct, i) => (
            <button
              type="button"
              key={i}
              onPointerDown={handlePointerDown}
              onClick={() => onKeyPress(punct)}
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f46] active:bg-indigo-600 active:text-white text-white/90 font-medium text-lg border border-white/5 transition-all cursor-pointer select-none active:scale-95"
            >
              {punct}
            </button>
          ))}
          
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onClick={onSpace}
            className="h-10 px-6 flex items-center gap-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] active:bg-[#3f3f46] text-emerald-400 font-medium text-sm border border-emerald-500/20 transition-all cursor-pointer select-none active:scale-95 ml-auto"
          >
            <Space className="w-4 h-4" /> Space
          </button>
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onClick={onBackspace}
            className="h-10 px-4 flex items-center gap-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] active:bg-[#3f3f46] text-red-400 font-medium text-sm border border-red-500/20 transition-all cursor-pointer select-none active:scale-95"
          >
            <Delete className="w-4 h-4" /> Backspace
          </button>
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onClick={onEnter}
            className="h-10 px-4 flex items-center gap-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] active:bg-[#3f3f46] text-blue-400 font-medium text-sm border border-blue-500/20 transition-all cursor-pointer select-none active:scale-95"
          >
            <CornerDownLeft className="w-4 h-4" /> Enter
          </button>
        </div>
      </div>
    </div>
  );
}

