import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { COMMON_SYMBOLS } from '../constants';

interface GlyphPickerProps {
    onSelect: (glyph: string) => void;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'common', name: 'Common' },
    { id: 'powerline', name: 'Powerline' },
    { id: 'nerd', name: 'Nerd Fonts' },
    { id: 'emoji', name: 'Emoji' },
];

interface GlyphSymbol {
    label: string;
    value: string;
    isPowerline?: boolean;
    isEmoji?: boolean;
}

const GlyphPicker: React.FC<GlyphPickerProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');

    const filteredSymbols = (COMMON_SYMBOLS as GlyphSymbol[]).filter(s => {
        const matchesSearch = s.label.toLowerCase().includes(search.toLowerCase()) ||
            s.value.includes(search);
        const matchesCategory = category === 'all' ||
            (category === 'powerline' && s.isPowerline) ||
            (category === 'nerd' && !s.isPowerline && !s.isEmoji) || // Rough heuristic
            (category === 'emoji' && s.isEmoji) ||
            (category === 'common' && !s.isPowerline && !s.isEmoji && !s.value.match(/[^\x00-\x7F]/)); // Basic ASCII

        // For now, just filter by search as our COMMON_SYMBOLS list isn't fully categorized yet in the plan
        // We will rely mostly on search
        return matchesSearch;
    });

    return (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 flex flex-col">
            <div className="p-2 border-b border-slate-700 flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search glyphs..."
                        className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        autoFocus
                    />
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-5 gap-1">
                {filteredSymbols.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => { onSelect(s.value); onClose(); }}
                        className="aspect-square flex items-center justify-center text-lg hover:bg-slate-700 rounded text-slate-200 hover:text-white transition-colors"
                        title={s.label}
                    >
                        {s.value}
                    </button>
                ))}
                {filteredSymbols.length === 0 && (
                    <div className="col-span-5 text-center text-xs text-slate-500 py-4">
                        No glyphs found
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlyphPicker;
