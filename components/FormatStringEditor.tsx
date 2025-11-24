import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Theme } from '../types';
import GlyphPicker from './GlyphPicker';
import ColorPicker from './ColorPicker';

interface FormatStringEditorProps {
    value: string;
    onChange: (value: string) => void;
    theme: Theme;
}

interface Segment {
    text: string;
    style?: string;
}

const FormatStringEditor: React.FC<FormatStringEditorProps> = ({ value, onChange, theme }) => {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [activePopup, setActivePopup] = useState<{ type: 'glyph' | 'color', field: 'text' | 'style' } | null>(null);

    // Parse format string into segments
    useEffect(() => {
        const parsed: Segment[] = [];
        const regex = /\[(.*?)\]\((.*?)\)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(value)) !== null) {
            if (match.index > lastIndex) {
                parsed.push({ text: value.slice(lastIndex, match.index) });
            }
            parsed.push({ text: match[1], style: match[2] });
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < value.length) {
            parsed.push({ text: value.slice(lastIndex) });
        }
        if (parsed.length === 0 && value) {
            parsed.push({ text: value });
        }
        setSegments(parsed);
    }, [value]);

    const updateSegments = (newSegments: Segment[]) => {
        const newValue = newSegments.map(s => s.style ? `[${s.text}](${s.style})` : s.text).join('');
        onChange(newValue);
    };

    const handleSegmentChange = (index: number, updates: Partial<Segment>) => {
        const newSegments = [...segments];
        newSegments[index] = { ...newSegments[index], ...updates };
        // If style is removed (empty), should we convert to plain text? 
        // For now, keep it as a block but with empty style if user clears it.
        // But if user explicitly wants plain text, they might need to delete the style block and add a text block.
        // Let's keep it simple: if style is present (even empty string), it's a block.
        updateSegments(newSegments);
    };

    const addSegment = () => {
        const newSegments = [...segments, { text: 'New', style: 'white' }];
        updateSegments(newSegments);
        setEditingIndex(newSegments.length - 1);
    };

    const removeSegment = (index: number) => {
        const newSegments = segments.filter((_, i) => i !== index);
        updateSegments(newSegments);
        setEditingIndex(null);
    };

    const handleGlyphSelect = (glyph: string) => {
        if (editingIndex !== null && activePopup) {
            const segment = segments[editingIndex];
            const currentVal = activePopup.field === 'text' ? segment.text : (segment.style || '');
            handleSegmentChange(editingIndex, { [activePopup.field]: currentVal + glyph });
            setActivePopup(null);
        }
    };

    const handleColorSelect = (color: string) => {
        if (editingIndex !== null && activePopup) {
            const segment = segments[editingIndex];
            if (activePopup.field === 'style') {
                // Overwrite style
                handleSegmentChange(editingIndex, { style: color });
            } else {
                // Append to text? No, usually color picker is for style. 
                // But if they opened it on text field, maybe they want to insert a color code?
                // Let's assume for text field they want to append.
                handleSegmentChange(editingIndex, { text: segment.text + `(${color})` });
            }
        }
    };

    return (
        <div className="space-y-2">
            {/* Segments List */}
            <div className="flex flex-wrap gap-2">
                {segments.map((segment, index) => (
                    <button
                        key={index}
                        onClick={() => setEditingIndex(index)}
                        className={`
                            px-2 py-1 rounded text-xs border flex items-center gap-1 max-w-[150px] truncate
                            ${segment.style
                                ? 'bg-slate-800 border-blue-500 text-blue-200'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}
                        `}
                        title={segment.style ? `Style: ${segment.style}` : 'Plain Text'}
                    >
                        <span className="truncate font-mono">{segment.text || '(empty)'}</span>
                        {segment.style && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </button>
                ))}
                <button
                    onClick={addSegment}
                    className="px-2 py-1 rounded text-xs border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-400 flex items-center gap-1"
                >
                    <Plus size={12} /> Add
                </button>
            </div>

            {/* Editor for Selected Segment */}
            {editingIndex !== null && segments[editingIndex] && (
                <div className="bg-slate-800 border border-slate-600 rounded p-3 relative mt-2">
                    <button
                        onClick={() => setEditingIndex(null)}
                        className="absolute right-2 top-2 text-slate-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>

                    <div className="space-y-3 pr-6">
                        {/* Text Input */}
                        <div className="space-y-1 relative">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Content</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={segments[editingIndex].text}
                                    onChange={(e) => handleSegmentChange(editingIndex, { text: e.target.value })}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={() => setActivePopup({ type: 'glyph', field: 'text' })}
                                    className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                                    title="Insert Glyph"
                                >
                                    <span className="text-xs">Aa</span>
                                </button>
                            </div>
                            {activePopup?.type === 'glyph' && activePopup.field === 'text' && (
                                <div className="absolute right-0 top-full z-10">
                                    <GlyphPicker onSelect={handleGlyphSelect} onClose={() => setActivePopup(null)} />
                                </div>
                            )}
                        </div>

                        {/* Style Input (only if it was a styled block or we want to convert it) */}
                        <div className="space-y-1 relative">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Style</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={segments[editingIndex].style || ''}
                                    onChange={(e) => handleSegmentChange(editingIndex, { style: e.target.value })}
                                    placeholder="No style (plain text)"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-yellow-300 focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={() => setActivePopup({ type: 'color', field: 'style' })}
                                    className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 flex items-center justify-center"
                                >
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-red-500 to-blue-500" />
                                </button>
                            </div>
                            {activePopup?.type === 'color' && activePopup.field === 'style' && (
                                <div className="absolute right-0 top-full z-10">
                                    <ColorPicker
                                        value={segments[editingIndex].style || ''}
                                        onChange={handleColorSelect}
                                        onClose={() => setActivePopup(null)}
                                        theme={theme}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-slate-700">
                            <span className="text-[10px] text-slate-500">
                                {segments[editingIndex].style ? 'Styled Block' : 'Plain Text Block'}
                            </span>
                            <button
                                onClick={() => removeSegment(editingIndex)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Remove Block
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormatStringEditor;
