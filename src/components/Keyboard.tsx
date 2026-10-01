import React, { useState } from 'react';
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
};

type LangKey = keyof typeof keyMaps;

export default function Keyboard({ onKeyPress, onBackspace, onSpace, onEnter }: KeyboardProps) {
  const [activeLang, setActiveLang] = useState<LangKey>('tamil');

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
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all border ${
                activeLang === lang
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-medium'
                  : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
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
                  key={j}
                  onClick={() => onKeyPress(key)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f46] active:bg-indigo-600 active:text-white text-white/90 font-medium text-lg border border-white/5 transition-colors shadow-sm"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
          {['.', ',', '?', '!', '-'].map((punct, i) => (
            <button
              key={i}
              onClick={() => onKeyPress(punct)}
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white/90 font-medium text-lg border border-white/5 transition-colors"
            >
              {punct}
            </button>
          ))}
          
          <button
            onClick={onSpace}
            className="h-10 px-6 flex items-center gap-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-emerald-400 font-medium text-sm border border-emerald-500/20 transition-colors ml-auto"
          >
            Space
          </button>
          <button
            onClick={onBackspace}
            className="h-10 px-4 flex items-center gap-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-red-400 font-medium text-sm border border-red-500/20 transition-colors"
          >
            <Delete className="w-4 h-4" /> Backspace
          </button>
          <button
            onClick={onEnter}
            className="h-10 px-4 flex items-center gap-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-blue-400 font-medium text-sm border border-blue-500/20 transition-colors"
          >
            <CornerDownLeft className="w-4 h-4" /> Enter
          </button>
        </div>
      </div>
    </div>
  );
}
