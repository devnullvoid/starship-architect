import React, { useLayoutEffect, useRef, useState } from 'react';
import { ActiveModule, Theme, PreviewContext } from '../types';
import { MOCK_DATA, MODULE_DEFINITIONS } from '../constants';
import { parseFormatString, parseStyle } from '../utils/starship';

interface TerminalPreviewProps {
  modules: ActiveModule[];
  theme: Theme;
  context: PreviewContext;
}

const TerminalPreview: React.FC<TerminalPreviewProps> = ({ modules, theme, context }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const charMeasureRef = useRef<HTMLSpanElement>(null);
  const [fillRepeat, setFillRepeat] = useState(60);

  // Dynamically size $fill so it stretches but doesn't overflow the line.
  useLayoutEffect(() => {
    const updateFill = () => {
      const row = rowRef.current;
      const measure = charMeasureRef.current;
      if (!row || !measure) return;

      const rowWidth = row.clientWidth;
      const charWidth = measure.offsetWidth || 8; // fallback average width
      const target = Math.max(10, Math.ceil(rowWidth / Math.max(charWidth, 1)));
      setFillRepeat(target);
    };

    updateFill();
    window.addEventListener('resize', updateFill);
    return () => window.removeEventListener('resize', updateFill);
  }, []);
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
    if (type === 'container') {
      return !!context.container;
    }
    // Language modules
    if (['nodejs', 'golang', 'rust', 'python', 'java', 'kotlin', 'dotnet', 'terraform', 'c', 'elixir', 'elm', 'haskell', 'julia', 'lua', 'nim', 'ocaml', 'perl', 'php', 'ruby', 'scala', 'swift', 'zig'].includes(type)) {
      return !!context.languages?.[type];
    }
    // Container/Env modules - hide by default unless we have specific context for them
    if (['nix_shell', 'conda', 'singularity', 'kubernetes', 'vcsh', 'fossil_branch', 'hg_branch', 'pijul_channel'].includes(type)) {
      return false; // For now, we don't have mock data/context for these, so hide them to avoid clutter
    }

    return true;
  };

  const buildDirectoryPath = (rawPath: string, props: Record<string, any>): string => {
    if (!rawPath) return '';
    const substitutions = props.substitutions || {};
    const truncLen = props.truncation_length ?? 0;
    const truncSymbol = props.truncation_symbol ?? '…/';

    const hasHome = rawPath.startsWith('~');
    const hasRoot = rawPath.startsWith('/');
    const prefix = hasHome ? '~' : hasRoot ? '/' : '';

    const parts = rawPath.replace(/^~?\/+/, '').split('/').filter(Boolean);
    const substituted = parts.map(p => substitutions[p] ?? p);

    let visible = substituted;
    if (truncLen && substituted.length > truncLen) {
      visible = substituted.slice(substituted.length - truncLen);
      if (hasHome) return `~/${truncSymbol}${visible.join('/')}`;
      if (hasRoot) return `/${truncSymbol}${visible.join('/')}`;
      return `${truncSymbol}${visible.join('/')}`;
    }

    const body = visible.join('/');
    if (hasHome) return body ? `~/${body}` : '~';
    if (hasRoot) return body ? `/${body}` : '/';
    return body;
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

        <div
          ref={rowRef}
          className="flex flex-wrap items-center font-medium leading-normal whitespace-nowrap overflow-x-auto"
        >
          {modules.filter(m => !m.disabled && shouldShowModule(m.type)).map((mod, idx) => {
            if (mod.type === 'line_break') {
              return <div key={mod.id} className="basis-full w-full h-0 my-1"></div>;
            }

            if (mod.type === 'fill') {
              // Fill grows and repeats symbol based on available row width
              const def = MODULE_DEFINITIONS.find(d => d.name === 'fill');
              const symbol = mod.properties.symbol || def?.defaultProps.symbol || ' ';
              const style = mod.properties.style || def?.defaultProps.style || '';
              const parsedStyle = parseStyle(style, theme);

              return (
                <div
                  key={mod.id}
                  className="overflow-hidden whitespace-nowrap select-none"
                  style={{
                    ...parsedStyle,
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <span
                    className="inline-block"
                    style={{ display: 'block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {symbol.repeat(fillRepeat)}
                  </span>
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
                variables[v] = buildDirectoryPath(context.path, mod.properties);
              }
              else if (mod.type === 'directory' && v === '$read_only') {
                variables[v] = context.readOnly ? (mod.properties.read_only || def.defaultProps.read_only || '') : '';
              }
              else if (mod.type === 'git_branch' && v === '$branch') {
                variables[v] = context.git?.branch || '';
              }
              else if (mod.type === 'git_status' && (v === '$all_status' || v === '$ahead_behind')) {
                // Simplified git status for preview
                variables[v] = context.git?.status || '';
              }
              else if (mod.type === 'docker_context' && v === '$name') {
                variables[v] = context.docker_context || '';
              }
              else if (context.languages?.[mod.type] && v === '$version') {
                variables[v] = context.languages[mod.type];
              }
              else if (mod.type === 'container' && v === '$name') {
                variables[v] = context.container?.name || '';
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
              <span key={mod.id} className="flex-none">
                {parsedSegments.map((seg, i) => (
                  <span
                    key={i}
                    style={seg.style as React.CSSProperties}
                    className="whitespace-pre"
                  >
                    {seg.text}
                  </span>
                ))}
              </span>
            );
          })}

          {/* Blinking Cursor */}
          <span
            className="inline-block w-2.5 h-5 ml-1 animate-pulse align-middle"
            style={{ backgroundColor: theme.colors.fg }}
          ></span>
          {/* Hidden measurer for dynamic fill sizing */}
          <span ref={charMeasureRef} className="invisible absolute" aria-hidden>
            ·
          </span>
        </div>
      </div>
    </div>
  );
};

export default TerminalPreview;
