import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  ArrowUp,
  ArrowDown,
  Wand2,
  Code,
  Copy,
  Check,
  Palette,
  Upload,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { MODULE_DEFINITIONS, THEMES } from './constants';
import { ActiveModule, ModuleDefinition, Theme } from './types';
import TerminalPreview from './components/TerminalPreview';
import PropertyEditor from './components/PropertyEditor';
import ContextSelector from './components/ContextSelector';
import { generateTOML, parseTOML, parseBase16Theme, themeToStarshipPalette } from './utils/starship';
import { generateConfigFromPrompt } from './services/geminiService';

const PREDEFINED_CONTEXTS: import('./types').PreviewContext[] = [
  {
    id: 'home',
    name: 'Home',
    path: '~',
    os: 'linux',
    time: '14:30:00'
  },
  {
    id: 'git-repo',
    name: 'Git Repo',
    path: '~/projects/starship',
    git: {
      branch: 'main',
      status: '?'
    },
    os: 'linux',
    time: '14:35:00'
  },
  {
    id: 'go-project',
    name: 'Go Project',
    path: '~/go/src/github.com/user/project',
    git: {
      branch: 'feature/api',
      status: '!'
    },
    languages: {
      golang: '1.21.0'
    },
    os: 'macos',
    time: '15:00:00'
  },
  {
    id: 'node-project',
    name: 'Node Project',
    path: '~/dev/react-app',
    git: {
      branch: 'fix/layout',
      status: '+'
    },
    languages: {
      nodejs: '20.5.0'
    },
    package: {
      version: '1.0.0'
    },
    os: 'windows',
    time: '16:20:00'
  },
  {
    id: 'container',
    name: 'Container',
    path: '/app/src',
    container: {
      name: 'devbox'
    },
    docker_context: 'default',
    git: {
      branch: 'main',
      status: ' +'
    },
    os: 'linux',
    time: '17:45:00'
  }
];

// Initial state with a basic setup
const INITIAL_MODULES: ActiveModule[] = [
  { id: '1', type: 'directory', disabled: false, properties: { ...MODULE_DEFINITIONS.find(m => m.name === 'directory')?.defaultProps } },
  { id: '2', type: 'git_branch', disabled: false, properties: { ...MODULE_DEFINITIONS.find(m => m.name === 'git_branch')?.defaultProps } },
  { id: '3', type: 'nodejs', disabled: false, properties: { ...MODULE_DEFINITIONS.find(m => m.name === 'nodejs')?.defaultProps } },
  { id: '4', type: 'line_break', disabled: false, properties: {} },
  { id: '5', type: 'character', disabled: false, properties: { ...MODULE_DEFINITIONS.find(m => m.name === 'character')?.defaultProps } },
];

export default function App() {
  const [modules, setModules] = useState<ActiveModule[]>(INITIAL_MODULES);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showThemeImport, setShowThemeImport] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(THEMES);
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  const [activeContext, setActiveContext] = useState(PREDEFINED_CONTEXTS[0]);
  const [embedPalette, setEmbedPalette] = useState(false);
  const [tomlContent, setTomlContent] = useState(generateTOML(INITIAL_MODULES));
  const [tomlError, setTomlError] = useState<string | null>(null);
  const [themeYamlInput, setThemeYamlInput] = useState('');
  const [themeError, setThemeError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Sync TOML content when modules change (only if not editing TOML directly to avoid loop)
  useEffect(() => {
    if (!showExport) {
      const config: any = {};
      if (embedPalette && activeTheme.palette) {
        const paletteName = activeTheme.name.toLowerCase().replace(/\s+/g, '_');
        config.palette = paletteName;
        config.palettes = {
          [paletteName]: themeToStarshipPalette(activeTheme) || {}
        };
      }
      setTomlContent(generateTOML(modules, config));
    }
  }, [modules, showExport, embedPalette, activeTheme]);

  const handleAddModule = (def: ModuleDefinition) => {
    const newModule: ActiveModule = {
      id: Math.random().toString(36).substr(2, 9),
      type: def.name,
      disabled: false,
      properties: { ...def.defaultProps },
    };
    const insertIdx = modules.length > 1 ? modules.length - 1 : modules.length;
    const newModules = [...modules];
    newModules.splice(insertIdx, 0, newModule);

    setModules(newModules);
    setShowAddMenu(false);
    setSelectedModuleId(newModule.id);
  };

  const handleDeleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
    if (selectedModuleId === id) setSelectedModuleId(null);
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const newModules = [...modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
    setModules(newModules);
  };

  const handleUpdateModule = (id: string, updates: Partial<ActiveModule['properties']>) => {
    setModules(modules.map(m => {
      if (m.id === id) {
        const newProperties = { ...m.properties, ...updates };
        // Sync root disabled state if it's in the updates or properties
        // If 'disabled' is in updates, use it. Otherwise keep existing root state?
        // Actually, if we are editing properties, and 'disabled' changes, we want to update root.
        let newDisabled = m.disabled;
        if ('disabled' in updates) {
          newDisabled = updates.disabled;
        }
        return { ...m, disabled: newDisabled, properties: newProperties };
      }
      return m;
    }));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateConfigFromPrompt(aiPrompt);
      if (result && result.modules) {
        const generatedModules: ActiveModule[] = result.modules.map((m: any) => {
          const def = MODULE_DEFINITIONS.find(d => d.name === m.type);
          return {
            id: Math.random().toString(36).substr(2, 9),
            type: m.type,
            disabled: false,
            properties: { ...(def?.defaultProps || {}), ...m.properties }
          }
        });
        setModules(generatedModules);
      }
    } catch (e) {
      alert("Failed to generate config. Please check API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tomlContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleTomlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newToml = e.target.value;
    setTomlContent(newToml);

    try {
      const { modules: newModules, config } = parseTOML(newToml);
      if (newModules.length > 0) {
        setModules(newModules);
        setTomlError(null);

        // Apply custom palette if defined in TOML
        if (config.palette && config.palettes && config.palettes[config.palette]) {
          const customColors = config.palettes[config.palette];

          // Create a synthetic theme preserving current UI colors but using custom palette
          const newTheme: Theme = {
            ...activeTheme,
            name: config.palette, // Use the name from TOML
            palette: customColors
          };

          setActiveTheme(newTheme);
          setEmbedPalette(true); // Ensure it stays embedded
        }
      } else {
        // Don't update modules if we couldn't parse any (avoids clearing screen on empty text)
      }
    } catch (err) {
      setTomlError("Invalid TOML format");
    }
  };

  const handleImportTheme = () => {
    if (!themeYamlInput.trim()) return;
    const theme = parseBase16Theme(themeYamlInput);
    if (theme) {
      setAvailableThemes([...availableThemes, theme]);
      setActiveTheme(theme);
      setShowThemeImport(false);
      setThemeYamlInput('');
      setThemeError(null);
    } else {
      setThemeError("Invalid Base16 YAML. Please ensure it matches standard structure (palette: base00..base0F).");
    }
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[#0f172a] text-slate-200">

      {/* LEFT SIDEBAR - BUILDER */}
      {showSidebar ? (
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-slate-700 bg-[#1e293b]">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h1 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Starship Architect
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExport(!showExport)}
                className={`p-2 rounded transition-colors ${showExport ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                title="Edit TOML"
              >
                <Code size={20} />
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 rounded hover:bg-slate-700 text-slate-400"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
          </div>

          {/* AI PROMPT AREA */}
          {process.env.API_KEY && (
            <div className="p-4 border-b border-slate-700 bg-[#162032]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Cyberpunk neon style..."
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                />
                <button
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded disabled:opacity-50"
                >
                  {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Wand2 size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* MODULE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className={`
                  group flex items-center gap-2 p-2 rounded border transition-all cursor-pointer
                  ${selectedModuleId === module.id
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
                  ${module.disabled ? 'opacity-50' : 'opacity-100'}
                `}
                onClick={() => {
                  setSelectedModuleId(module.id);
                  if (showExport) setShowExport(false);
                }}
              >
                <div className="text-slate-500 cursor-grab active:cursor-grabbing">
                  <GripVertical size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-bold text-slate-200 capitalize truncate">
                    {module.type.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {module.properties.format || 'Default format'}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveModule(index, 'up'); }}
                    className="p-1 hover:text-blue-400 disabled:opacity-20"
                    disabled={index === 0}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveModule(index, 'down'); }}
                    className="p-1 hover:text-blue-400 disabled:opacity-20"
                    disabled={index === modules.length - 1}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                    className="p-1 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* ADD BUTTON */}
            <div className="relative mt-4">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2 transition-colors"
              >
                <Plus size={20} /> Add Module
              </button>

              {showAddMenu && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                  {MODULE_DEFINITIONS.map(def => (
                    <button
                      key={def.name}
                      onClick={() => handleAddModule(def)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-slate-200 flex justify-between items-center"
                    >
                      <span className="capitalize">{def.name.replace('_', ' ')}</span>
                      <span className="text-xs text-slate-500">{def.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full md:w-12 lg:w-12 flex items-center justify-center border-r border-slate-700 bg-[#1e293b]">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 text-slate-300 hover:text-white"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        </div>
      )}

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-0 relative">

        {/* PREVIEW AREA */}
        <div className="p-6 bg-[#0f172a] flex flex-col justify-center items-center min-h-[300px] relative border-b border-slate-800">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <div className="text-slate-500 text-xs uppercase tracking-widest font-bold">Terminal Preview</div>

            {/* Theme Selector */}
            <div className="flex items-center gap-3">
              <Palette size={16} className="text-slate-400" />
              <select
                value={activeTheme.name}
                onChange={(e) => {
                  const t = availableThemes.find(theme => theme.name === e.target.value);
                  if (t) setActiveTheme(t);
                }}
                className="bg-slate-800 text-xs text-slate-300 border border-slate-600 rounded px-2 py-1 focus:outline-none max-w-[150px]"
              >
                {availableThemes.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowThemeImport(true)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                title="Import Base16/Base24 Theme (YAML)"
              >
                <Upload size={16} />
              </button>
              {activeTheme.palette && (
                <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-600">
                  <input
                    type="checkbox"
                    checked={embedPalette}
                    onChange={(e) => setEmbedPalette(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span title={`Embed ${activeTheme.name} palette in TOML config`}>Embed</span>
                </label>
              )}
            </div>
          </div>
          <div className="w-full max-w-5xl relative z-0 flex flex-col gap-4">
            <div className="flex justify-center">
              <ContextSelector
                contexts={PREDEFINED_CONTEXTS}
                activeContext={activeContext}
                onSelect={setActiveContext}
              />
            </div>
            <TerminalPreview modules={modules} theme={activeTheme} context={activeContext} />
          </div>
        </div>

        {/* EDITOR / CODE AREA */}
        <div className="flex-1 bg-[#131c2e] p-6 overflow-hidden">
          {showExport ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-200">starship.toml</h3>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Editable</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  {copyFeedback ? <Check size={16} /> : <Copy size={16} />}
                  {copyFeedback ? 'Copied!' : 'Copy Config'}
                </button>
              </div>
              {tomlError && (
                <div className="text-red-400 text-xs mb-2 bg-red-900/20 p-2 rounded border border-red-800">
                  Error: {tomlError}
                </div>
              )}
              <textarea
                value={tomlContent}
                onChange={handleTomlChange}
                spellCheck={false}
                className="w-full flex-1 bg-[#0f172a] border border-slate-700 rounded p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          ) : (
            <div className="h-full">
              {selectedModule ? (
                <PropertyEditor
                  module={selectedModule}
                  onChange={handleUpdateModule}
                  onClose={() => setSelectedModuleId(null)}
                  theme={activeTheme}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Settings size={48} className="mb-4 opacity-20" />
                  <p>Select a module to edit its properties</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* THEME IMPORT MODAL */}
      {showThemeImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="font-bold text-white">Import Base16/Base24 Theme</h3>
              <button onClick={() => setShowThemeImport(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-400 mb-2">
                Paste a YAML Base16 or Base24 scheme below.
                Find schemes at <a href="https://github.com/tinted-theming/schemes" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">tinted-theming/schemes</a>.
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Supports both Base16 (16 colors) and Base24 (24 colors) formats. Enable "Embed" to include the palette in your starship.toml.
              </p>
              <textarea
                value={themeYamlInput}
                onChange={(e) => setThemeYamlInput(e.target.value)}
                className="w-full h-64 bg-slate-900 border border-slate-600 rounded p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder={`system: "base24"\nname: "My Theme"\nauthor: "Your Name"\nvariant: "dark"\npalette:\n  base00: "1e1e2e"\n  base01: "181825"\n  ...\n  base0F: "f2cdcd"\n  base10: "1e1e2e"  # Base24 only\n  ...\n  base17: "b4befe"  # Base24 only`}
              />
              {themeError && (
                <div className="mt-2 text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-800">
                  {themeError}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowThemeImport(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImportTheme}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Import Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
