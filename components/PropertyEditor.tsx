import React from 'react';
import { ActiveModule, ModuleDefinition } from '../types';
import { MODULE_DEFINITIONS, COMMON_SYMBOLS } from '../constants';
import { X, HelpCircle } from 'lucide-react';

interface PropertyEditorProps {
  module: ActiveModule;
  onChange: (id: string, updates: Partial<ActiveModule['properties']>) => void;
  onClose: () => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ module, onChange, onClose }) => {
  const definition = MODULE_DEFINITIONS.find(d => d.name === module.type);

  if (!definition) return null;

  const handleChange = (key: string, value: any) => {
    onChange(module.id, { [key]: value });
  };

  // Determine which fields to show based on defaultProps + common Starship fields
  const fields = Object.keys({ ...definition.defaultProps, ...module.properties });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white capitalize">{definition.name.replace('_', ' ')}</h3>
            <div className="group relative">
                <HelpCircle size={16} className="text-slate-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-black text-xs text-slate-200 p-2 rounded border border-slate-600 z-50">
                    {definition.description}. <br/>
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
            />
            <p className="text-[10px] text-slate-500">Use variables like {definition.variables.join(', ')}</p>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Style</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={module.properties.style || ''}
                    onChange={(e) => handleChange('style', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-yellow-300 focus:outline-none focus:border-blue-500"
                    placeholder="red bold"
                />
                {/* Color Picker helper could go here, simpler to just let type for now or provide chips */}
            </div>
             <div className="flex flex-wrap gap-1 mt-1">
                {['red', 'green', 'blue', 'yellow', 'cyan', 'purple', 'white', 'bold'].map(c => (
                    <button 
                        key={c}
                        onClick={() => handleChange('style', (module.properties.style || '') + ' ' + c)}
                        className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[10px] rounded text-slate-300"
                    >
                        {c}
                    </button>
                ))}
            </div>
        </div>

        {/* Dynamic Fields for Symbols etc */}
        {fields.filter(f => f !== 'format' && f !== 'style').map(field => (
            <div key={field} className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.replace(/_/g, ' ')}</label>
                <div className="relative">
                    <input
                        type="text"
                        value={module.properties[field] || ''}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    {/* Quick Symbol Picker for symbol fields */}
                    {(field.includes('symbol') || field === 'read_only') && (
                         <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                            <select 
                                onChange={(e) => handleChange(field, e.target.value)}
                                className="bg-slate-800 text-xs text-slate-300 border border-slate-600 rounded"
                                value="" // always reset
                            >
                                <option value="" disabled>Pick</option>
                                {COMMON_SYMBOLS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label} {s.value}</option>
                                ))}
                            </select>
                         </div>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyEditor;
