import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
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
    // Parse current value
    const currentParts = value.split(/\s+/);
    const currentColors = currentParts.filter(p => !MODIFIERS.includes(p));
    const currentModifiers = currentParts.filter(p => MODIFIERS.includes(p));

    const toggleModifier = (mod: string) => {
        if (currentModifiers.includes(mod)) {
            onChange([...currentColors, ...currentModifiers.filter(m => m !== mod)].join(' '));
        } else {
            onChange([...currentColors, ...currentModifiers, mod].join(' '));
        }
    };

    const selectColor = (color: string) => {
        // Replace existing color or add if none
        // Simple logic: assume only one color for now (fg) or bg:color
        // If user clicks a color, we replace the main color part
        // This is a simplification; Starship supports 'fg bg' but usually people just want one main color
        onChange([color, ...currentModifiers].join(' '));
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 flex flex-col p-3 gap-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Color Picker</h4>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            {/* Named Colors */}
            <div>
                <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Standard</div>
                <div className="grid grid-cols-4 gap-1">
                    {NAMED_COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => selectColor(c)}
                            className={`
                h-6 rounded text-xs capitalize flex items-center justify-center border
                ${currentColors.includes(c) ? 'border-white ring-1 ring-white' : 'border-transparent hover:border-slate-500'}
              `}
                            style={{ backgroundColor: c === 'black' ? '#333' : c, color: c === 'white' || c === 'yellow' || c === 'cyan' ? 'black' : 'white' }}
                        >
                            {c}
                        </button>
                    ))}
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
                  ${currentColors.includes(key) ? 'border-white ring-1 ring-white' : 'border-transparent hover:border-slate-500'}
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
