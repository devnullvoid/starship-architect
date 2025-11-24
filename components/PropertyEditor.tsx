import React from 'react';
import { ActiveModule, ModuleDefinition, Theme } from '../types';
import { MODULE_DEFINITIONS, COMMON_SYMBOLS } from '../constants';
import { X, HelpCircle } from 'lucide-react';
import GlyphPicker from './GlyphPicker';
import ColorPicker from './ColorPicker';
import KeyValueEditor from './KeyValueEditor';

interface PropertyEditorProps {
    module: ActiveModule;
    onChange: (id: string, updates: Partial<ActiveModule['properties']>) => void;
    onClose: () => void;
    theme: Theme;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ module, onChange, onClose, theme }) => {
    const definition = MODULE_DEFINITIONS.find(d => d.name === module.type);
    const [activePopup, setActivePopup] = React.useState<{ type: 'glyph' | 'color', field: string } | null>(null);

    if (!definition) return null;

    const handleChange = (key: string, value: any) => {
        onChange(module.id, { [key]: value });
    };

    // Determine which fields to show based on defaultProps + common Starship fields
    const fields = Object.keys({ ...definition.defaultProps, ...module.properties });

    const handleGlyphSelect = (glyph: string) => {
        if (activePopup) {
            handleChange(activePopup.field, glyph);
            setActivePopup(null);
        }
    };

    const handleColorSelect = (color: string) => {
        if (activePopup) {
            handleChange(activePopup.field, color);
        }
    };

    const renderField = (field: string) => {
        const value = module.properties[field];
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        const isBoolean = typeof value === 'boolean';
        const isNumber = typeof value === 'number';

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
                        type={isNumber ? "number" : "text"}
                        value={value === undefined ? '' : value}
                        onChange={(e) => handleChange(field, isNumber ? Number(e.target.value) : e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono`}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Pickers for string fields */}
                    {!isNumber && !isBoolean && (
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setActivePopup({ type: 'glyph', field }); }}
                                className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 flex items-center justify-center"
                                title="Insert Glyph"
                            >
                                <span className="text-xs">Aa</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActivePopup({ type: 'color', field }); }}
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
