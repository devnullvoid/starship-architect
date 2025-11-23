import React from 'react';
import { ActiveModule, Theme, PreviewContext } from '../types';
import { MOCK_DATA, MODULE_DEFINITIONS } from '../constants';
import { parseFormatString, parseStyle } from '../utils/starship';

interface TerminalPreviewProps {
  modules: ActiveModule[];
  theme: Theme;
  context: PreviewContext;
}

const TerminalPreview: React.FC<TerminalPreviewProps> = ({ modules, theme, context }) => {
  // Helper to check if a module should be visible in the current context
  const shouldShowModule = (type: string): boolean => {
    if (type === 'git_branch' || type === 'git_status' || type === 'git_commit' || type === 'git_state' || type === 'git_metrics') {
      return !!context.git;
    }
    if (type === 'package') {
      return !!context.package;
    }
    if (type === 'docker_context') {
      return !!context.docker_context;
    }
    // Language modules
    if (['nodejs', 'golang', 'rust', 'python', 'java', 'kotlin', 'dotnet', 'terraform', 'c', 'elixir', 'elm', 'haskell', 'julia', 'lua', 'nim', 'ocaml', 'perl', 'php', 'ruby', 'scala', 'swift', 'zig'].includes(type)) {
      return !!context.languages?.[type];
    }
    // Container/Env modules - hide by default unless we have specific context for them
    if (['nix_shell', 'conda', 'container', 'singularity', 'kubernetes', 'vcsh', 'fossil_branch', 'hg_branch', 'pijul_channel'].includes(type)) {
      return false; // For now, we don't have mock data/context for these, so hide them to avoid clutter
    }

    return true;
  };

  return (
    <div
      className="w-full rounded-lg overflow-hidden shadow-2xl border font-mono text-sm md:text-base transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.bg,
        color: theme.colors.fg,
        borderColor: theme.colors.black // Using the darker black/mantle color for border
      }}
    >
      {/* Window Controls */}
      <div
        className="px-4 py-2 flex items-center gap-2 border-b"
        style={{
          backgroundColor: theme.colors.black, // Typically darker than bg (mantle/base01)
          borderColor: theme.colors.bg // Slight separation
        }}
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.red }}></div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.yellow }}></div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.green }}></div>
        <div className="ml-2 text-xs select-none opacity-50" style={{ color: theme.colors.gray }}>user@machine: {context.path}</div>
      </div>

      {/* Terminal Content */}
      <div className="p-6 min-h-[120px]">
        <div className="mb-2 select-none text-xs" style={{ color: theme.colors.gray }}># Live Preview</div>

        <div className="flex flex-wrap items-center font-medium leading-snug">
          {modules.filter(m => !m.disabled && shouldShowModule(m.type)).map((mod, idx) => {
            if (mod.type === 'line_break') {
              return <div key={mod.id} className="w-full h-0 basis-full my-1"></div>;
            }

            if (mod.type === 'fill') {
              // Fill module should push remaining content to the right
              // We can achieve this by making this element grow
              // Also render the symbol repeated to fill the space
              const def = MODULE_DEFINITIONS.find(d => d.name === 'fill');
              const symbol = mod.properties.symbol || def?.defaultProps.symbol || ' ';
              const style = mod.properties.style || def?.defaultProps.style || '';
              const parsedStyle = parseStyle(style, theme);

              return (
                <div
                  key={mod.id}
                  className="flex-grow overflow-hidden whitespace-nowrap select-none"
                  style={{ ...parsedStyle, minWidth: '1rem' }}
                >
                  {symbol.repeat(200)}
                </div>
              );
            }

            const def = MODULE_DEFINITIONS.find(d => d.name === mod.type);
            if (!def) return null;

            // Get format string (use instance prop or default)
            const format = mod.properties.format || def.defaultProps.format;
            const style = mod.properties.style || def.defaultProps.style || '';

            // Prepare mock variables for this module
            const variables: Record<string, string> = {};

            // 1. Populate with definition variables
            def.variables.forEach(v => {
              const propKey = v.substring(1);

              // Special handling for 'character' module:
              // The $symbol variable is derived from success_symbol (or error_symbol) configuration,
              // NOT from mock data or a direct 'symbol' property.
              if (mod.type === 'character' && v === '$symbol') {
                // We assume success state for the preview
                variables[v] = mod.properties.success_symbol || def.defaultProps.success_symbol || '❯';
              }
              // OS Module - Mock Arch Linux
              else if (mod.type === 'os' && v === '$symbol') {
                variables[v] = ' '; // Arch Linux symbol
              }
              // Context-aware overrides
              else if (mod.type === 'directory' && v === '$path') {
                variables[v] = context.path;
              }
              else if (mod.type === 'git_branch' && v === '$branch') {
                variables[v] = context.git?.branch || '';
              }
              else if (mod.type === 'git_status' && (v === '$all_status' || v === '$ahead_behind')) {
                // Simplified git status for preview
                variables[v] = context.git?.status || '';
              }
              else if (context.languages?.[mod.type] && v === '$version') {
                variables[v] = context.languages[mod.type];
              }
              else if (mod.type === 'package' && v === '$version') {
                variables[v] = context.package?.version || '';
              }
              else if (mod.type === 'time' && v === '$time') {
                variables[v] = context.time || '12:00:00';
              }
              // Standard variable resolution
              else if (mod.properties[propKey]) {
                variables[v] = mod.properties[propKey];
              }
              else if (MOCK_DATA[mod.type] && MOCK_DATA[mod.type][v]) {
                variables[v] = MOCK_DATA[mod.type][v];
              } else {
                variables[v] = '';
              }
            });

            const parsedSegments = parseFormatString(format, variables, style, theme);

            return (
              <React.Fragment key={mod.id}>
                {parsedSegments.map((seg, i) => (
                  <span
                    key={i}
                    style={seg.style as React.CSSProperties}
                    className="whitespace-pre"
                  >
                    {seg.text}
                  </span>
                ))}
              </React.Fragment>
            );
          })}

          {/* Blinking Cursor */}
          <span
            className="inline-block w-2.5 h-5 ml-1 animate-pulse align-middle"
            style={{ backgroundColor: theme.colors.fg }}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default TerminalPreview;