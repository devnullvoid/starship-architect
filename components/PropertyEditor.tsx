import React from 'react';
import { ActiveModule, ModuleDefinition, Theme } from '../types';
import { MODULE_DEFINITIONS, COMMON_SYMBOLS } from '../constants';
import { X, HelpCircle } from 'lucide-react';
import GlyphPicker from './GlyphPicker';
import ColorPicker from './ColorPicker';

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
            // If there is existing text, append or replace? 
            // Usually for symbols it's a replacement or insertion.
            // Let's just replace for now as these are usually single symbol fields.
            // But if it's a format string, we might want to insert.
            // For now, simple replacement for symbol fields.
            handleChange(activePopup.field, glyph);
            setActivePopup(null);
        }
    };

    const handleColorSelect = (color: string) => {
        if (activePopup) {
            handleChange(activePopup.field, color);
            // Don't close immediately to allow adding modifiers
        }
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
                {/* Common Fields: Format & Style */}
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format String</label>
                    <input
                        type="text"
                        value={module.properties.format || ''}
                        onChange={(e) => handleChange('format', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="[$symbol...]($style)"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-[10px] text-slate-500">Use variables like {definition.variables.join(', ')}</p>
                </div>

                <div className="space-y-1 relative">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Style</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={module.properties.style || ''}
                            onChange={(e) => handleChange('style', e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-yellow-300 focus:outline-none focus:border-blue-500"
                            placeholder="red bold"
                            onClick={(e) => { e.stopPropagation(); setActivePopup({ type: 'color', field: 'style' }); }}
                        />
                        <div
                            className="w-8 h-8 rounded border border-slate-600"
                            style={{ backgroundColor: 'transparent' /* TODO: parse style to show preview */ }}
                        />
                    </div>
                    {activePopup?.type === 'color' && activePopup.field === 'style' && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <ColorPicker
                                value={module.properties.style || ''}
                                onChange={handleColorSelect}
                                onClose={() => setActivePopup(null)}
                                theme={theme}
                            />
                        </div>
                    )}
                </div>

                {/* Dynamic Fields for Symbols etc */}
                {fields.filter(f => f !== 'format' && f !== 'style').map(field => (
                    <div key={field} className="space-y-1 relative">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.replace(/_/g, ' ')}</label>
                        <div className="relative flex gap-2">
                            <input
                                type="text"
                                value={module.properties[field] || ''}
                                onChange={(e) => handleChange(field, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {/* Quick Symbol Picker for symbol fields */}
                            {(field.includes('symbol') || field === 'read_only') && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActivePopup({ type: 'glyph', field }); }}
                                    className="px-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                                >
                                    <span className="text-xs">Glyph</span>
                                </button>
                            )}
                        </div>
                        {activePopup?.type === 'glyph' && activePopup.field === field && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <GlyphPicker
                                    onSelect={handleGlyphSelect}
                                    onClose={() => setActivePopup(null)}
                                />
                            </div>
                        )}
                        {/* Add Color Picker for other style fields */}
                        {field.includes('style') && (
                            <div className="absolute right-0 top-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActivePopup({ type: 'color', field }); }}
                                    className="text-[10px] text-blue-400 hover:text-blue-300"
                                >
                                    Pick Color
                                </button>
                                {activePopup?.type === 'color' && activePopup.field === field && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ColorPicker
                                            value={module.properties[field] || ''}
                                            onChange={handleColorSelect}
                                            onClose={() => setActivePopup(null)}
                                            theme={theme}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PropertyEditor;
