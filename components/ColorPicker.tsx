import React, { useState } from 'react';
import { X, Check, Droplet, Type } from 'lucide-react';
import { Theme } from '../types';

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    theme?: Theme;
}

const NAMED_COLORS = [
    'black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'
];

const MODIFIERS = [
    'bold', 'dimmed', 'italic', 'underline', 'inverted'
];

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, onClose, theme }) => {
    const [activeLayer, setActiveLayer] = useState<'fg' | 'bg'>('fg');
    const [isBright, setIsBright] = useState(false);
    const [customColor, setCustomColor] = useState('');

    // Parse current value
    const parts = value.split(/\s+/).filter(p => p);
    const currentModifiers = parts.filter(p => MODIFIERS.includes(p));

    let currentFg: string | null = null;
    let currentBg: string | null = null;

    parts.forEach(p => {
        if (MODIFIERS.includes(p)) return;
        if (p.startsWith('bg:')) {
            currentBg = p.replace('bg:', '');
        } else if (p.startsWith('fg:')) {
            currentFg = p.replace('fg:', '');
        } else {
            // Assume it's fg if not specified and not a modifier
            // But check if we already found an fg? Last one wins?
            currentFg = p;
        }
    });

    const updateValue = (newFg: string | null, newBg: string | null, newMods: string[]) => {
        const newParts = [];
        if (newFg && newFg !== 'none') newParts.push(newFg);
        if (newBg && newBg !== 'none') newParts.push(`bg:${newBg}`);
        newParts.push(...newMods);
        onChange(newParts.join(' '));
    };

    const selectColor = (color: string) => {
        const finalColor = isBright && !color.startsWith('#') && !color.startsWith('bright-') ? `bright-${color}` : color;
        if (activeLayer === 'fg') {
            updateValue(finalColor, currentBg, currentModifiers);
        } else {
            updateValue(currentFg, finalColor, currentModifiers);
        }
    };

    const clearLayer = () => {
        if (activeLayer === 'fg') {
            updateValue(null, currentBg, currentModifiers);
        } else {
            updateValue(currentFg, null, currentModifiers);
        }
    };

    const toggleModifier = (mod: string) => {
        const newMods = currentModifiers.includes(mod)
            ? currentModifiers.filter(m => m !== mod)
            : [...currentModifiers, mod];
        updateValue(currentFg, currentBg, newMods);
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customColor) {
            selectColor(customColor);
            setCustomColor('');
        }
    };

    const currentColor = activeLayer === 'fg' ? currentFg : currentBg;

    return (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 flex flex-col p-3 gap-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Color Picker</h4>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex bg-slate-900 rounded p-1 gap-1">
                <button
                    onClick={() => setActiveLayer('fg')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${activeLayer === 'fg' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Type size={12} /> Text
                </button>
                <button
                    onClick={() => setActiveLayer('bg')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs transition-colors ${activeLayer === 'bg' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Droplet size={12} /> Background
                </button>
            </div>

            {/* Selected Color Indicator & Clear */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                    {activeLayer === 'fg' ? 'Text Color: ' : 'Background: '}
                    <span className="font-mono text-white">{currentColor || 'None'}</span>
                </div>
                {currentColor && (
                    <button onClick={clearLayer} className="text-[10px] text-red-400 hover:text-red-300">
                        Clear
                    </button>
                )}
            </div>

            {/* Named Colors */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Standard</div>
                    <button
                        onClick={() => setIsBright(!isBright)}
                        className={`text-[10px] px-1 rounded border ${isBright ? 'bg-yellow-900 border-yellow-700 text-yellow-200' : 'border-slate-600 text-slate-400'}`}
                    >
                        Bright
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                    {NAMED_COLORS.map(c => {
                        const displayColor = isBright ? `bright-${c}` : c;
                        // Approximate hex for preview (simplified)
                        const previewColor = c === 'black' ? '#333' : c;
                        return (
                            <button
                                key={c}
                                onClick={() => selectColor(c)}
                                className={`
                                    h-6 rounded text-xs capitalize flex items-center justify-center border
                                    ${currentColor === displayColor ? 'border-white ring-1 ring-white' : 'border-transparent hover:border-slate-500'}
                                `}
                                style={{ backgroundColor: previewColor, color: c === 'white' || c === 'yellow' || c === 'cyan' ? 'black' : 'white' }}
                                title={displayColor}
                            >
                                {c}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Palette Colors (if theme available) */}
            {theme && theme.palette && (
                <div>
                    <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Palette ({theme.name})</div>
                    <div className="grid grid-cols-6 gap-1">
                        {Object.entries(theme.palette).map(([key, hex]) => (
                            <button
                                key={key}
                                onClick={() => selectColor(key)}
                                className={`
                  h-6 rounded text-[8px] flex items-center justify-center border
                  ${currentColor === key ? 'border-white ring-1 ring-white' : 'border-transparent hover:border-slate-500'}
                `}
                                style={{ backgroundColor: hex as string, color: parseInt((hex as string).replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
                                title={`${key}: ${hex}`}
                            >
                                {key.replace('base', '')}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Color Input */}
            <form onSubmit={handleCustomSubmit} className="flex gap-1">
                <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Hex (#fff) or ID (255)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <button type="submit" className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200">
                    Set
                </button>
            </form>

            {/* Modifiers */}
            <div>
                <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Modifiers</div>
                <div className="flex flex-wrap gap-1">
                    {MODIFIERS.map(mod => (
                        <button
                            key={mod}
                            onClick={() => toggleModifier(mod)}
                            className={`
                px-2 py-1 rounded text-xs border
                ${currentModifiers.includes(mod)
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'}
              `}
                        >
                            {mod}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ColorPicker;
