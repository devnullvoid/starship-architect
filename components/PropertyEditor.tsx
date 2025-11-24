import React from 'react';
import { ActiveModule, ModuleDefinition, Theme } from '../types';
import { MODULE_DEFINITIONS, COMMON_SYMBOLS } from '../constants';
import { X, HelpCircle } from 'lucide-react';
import GlyphPicker from './GlyphPicker';
import ColorPicker from './ColorPicker';
import KeyValueEditor from './KeyValueEditor';
import FormatStringEditor from './FormatStringEditor';

interface PropertyEditorProps {
    module: ActiveModule;
    onChange: (id: string, updates: Partial<ActiveModule['properties']>) => void;
    onClose: () => void;
    theme: Theme;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ module, onChange, onClose, theme }) => {
    const definition = MODULE_DEFINITIONS.find(d => d.name === module.type);
    const [activePopup, setActivePopup] = React.useState<{ type: 'glyph' | 'color', field: string, selection?: { start: number, end: number } } | null>(null);
    const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

    if (!definition) return null;

    const handleChange = (key: string, value: any) => {
        onChange(module.id, { [key]: value });
    };

    // Determine which fields to show based on defaultProps + common Starship fields
    const fields = Object.keys({ ...definition.defaultProps, ...module.properties });

    const handleGlyphSelect = (glyph: string) => {
        if (activePopup) {
            const currentValue = module.properties[activePopup.field] || '';
            const strValue = String(currentValue);

            // Insert at cursor position if we have it, otherwise append
            if (activePopup.selection) {
                const { start, end } = activePopup.selection;
                const newValue = strValue.slice(0, start) + glyph + strValue.slice(end);
                handleChange(activePopup.field, newValue);
            } else {
                handleChange(activePopup.field, strValue + glyph);
            }
            setActivePopup(null);
        }
    };

    const handleColorSelect = (color: string) => {
        if (activePopup) {
            const isStyle = activePopup.field.toLowerCase().includes('style');
            if (isStyle) {
                handleChange(activePopup.field, color);
            } else {
                const currentValue = module.properties[activePopup.field] || '';
                const strValue = String(currentValue);

                if (activePopup.selection) {
                    const { start, end } = activePopup.selection;
                    // If text is selected, wrap it: [text](style)
                    // If no text selected (start===end), just insert the style string wrapped in (): (style)
                    // The user requested: [text to style](fg:colorX bg:colorY styleZ)

                    if (start !== end) {
                        const selectedText = strValue.slice(start, end);
                        const newValue = strValue.slice(0, start) + `[${selectedText}](${color})` + strValue.slice(end);
                        handleChange(activePopup.field, newValue);
                    } else {
                        // No selection: insert (style) at cursor
                        const newValue = strValue.slice(0, start) + `(${color})` + strValue.slice(end);
                        handleChange(activePopup.field, newValue);
                    }
                } else {
                    // Fallback if no selection info: append
                    handleChange(activePopup.field, strValue + `(${color})`);
                }
            }
        }
    };

    const openPopup = (type: 'glyph' | 'color', field: string) => {
        const input = inputRefs.current[field];
        let selection = undefined;
        if (input) {
            selection = {
                start: input.selectionStart || 0,
                end: input.selectionEnd || 0
            };
        }
        setActivePopup({ type, field, selection });
    };

    const renderField = (field: string) => {
        const value = module.properties[field];
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        const isBoolean = typeof value === 'boolean';
        const isNumber = typeof value === 'number';
        const isStyle = field.toLowerCase().includes('style');

        if (field === 'format') {
            return (
                <div key={field} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format String</label>
                    <FormatStringEditor
                        value={String(value || '')}
                        onChange={(newValue) => handleChange(field, newValue)}
                        theme={theme}
                    />
                </div>
            );
        }

        if (isObject) {
            return (
                <div key={field} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.replace(/_/g, ' ')}</label>
                    <KeyValueEditor
                        value={value}
                        onChange={(newValue) => handleChange(field, newValue)}
                    />
                </div>
            );
        }

        if (isBoolean) {
            return (
                <div key={field} className="flex items-center justify-between py-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.replace(/_/g, ' ')}</label>
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleChange(field, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            );
        }

        // Default to text input for strings and numbers (numbers converted to string for input)
        return (
            <div key={field} className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.replace(/_/g, ' ')}</label>
                <div className="relative flex gap-2">
                    <input
                        ref={el => inputRefs.current[field] = el}
                        type={isNumber ? "number" : "text"}
                        value={value === undefined ? '' : value}
                        onChange={(e) => handleChange(field, isNumber ? Number(e.target.value) : e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono`}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Pickers for string fields */}
                    {!isNumber && !isBoolean && (
                        <div className="flex gap-1">
                            {!isStyle && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); openPopup('glyph', field); }}
                                    className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 flex items-center justify-center"
                                    title="Insert Glyph"
                                >
                                    <span className="text-xs">Aa</span>
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); openPopup('color', field); }}
                                className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 flex items-center justify-center"
                                title="Pick Color"
                            >
                                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-red-500 to-blue-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Popups */}
                {activePopup?.field === field && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {activePopup.type === 'glyph' && (
                            <GlyphPicker
                                onSelect={handleGlyphSelect}
                                onClose={() => setActivePopup(null)}
                            />
                        )}
                        {activePopup.type === 'color' && (
                            <ColorPicker
                                value={String(value || '')}
                                onChange={handleColorSelect}
                                onClose={() => setActivePopup(null)}
                                theme={theme}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col h-full" onClick={() => setActivePopup(null)}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white capitalize">{definition.name.replace('_', ' ')}</h3>
                    <div className="group relative">
                        <HelpCircle size={16} className="text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-xs text-slate-200 p-2 rounded border border-slate-600 z-50">
                            {definition.description}. <br />
                            Variables: {definition.variables.join(', ')}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                {/* Render all fields dynamically */}
                {fields.map(field => renderField(field))}
            </div>
        </div>
    );
};

export default PropertyEditor;
