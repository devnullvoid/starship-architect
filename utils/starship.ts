import { ActiveModule, ParsedStyle, Theme } from '../types';
import { MODULE_DEFINITIONS, THEMES } from '../constants';
import { parse } from 'smol-toml';
import { load } from 'js-yaml';

// Helper to resolve color based on theme or hex
const resolveColor = (colorName: string, theme?: Theme): string => {
  if (!colorName) return 'inherit';

  // Hex code
  if (colorName.startsWith('#')) return colorName;

  // Normalize
  let normalized = colorName.toLowerCase();
  if (normalized === 'magenta') normalized = 'purple'; // Alias commonly used in ANSI/Starship

  // Theme color lookup
  if (theme) {
    // Check named colors (red, blue, etc.)
    if (theme.colors[normalized as keyof typeof theme.colors]) {
      return theme.colors[normalized as keyof typeof theme.colors];
    }
    // Check palette colors (base00, base01, etc.)
    if (theme.palette && theme.palette[colorName as keyof typeof theme.palette]) {
      return theme.palette[colorName as keyof typeof theme.palette];
    }
  }

  // Fallback for standard ANSI colors if no theme provided (though theme should always be provided)
  const defaultColors: Record<string, string> = THEMES[0].colors;
  return defaultColors[normalized as keyof typeof defaultColors] || colorName;
};

// Helper to parse a style string like "red bold bg:blue"
export const parseStyle = (styleStr: string, theme?: Theme): ParsedStyle => {
  const style: ParsedStyle = {};
  if (!styleStr) return style;

  const parts = styleStr.split(/\s+/);

  parts.forEach(part => {
    if (part === 'bold') style.fontWeight = 'bold';
    else if (part === 'italic') style.fontStyle = 'italic';
    else if (part === 'underline') style.textDecoration = 'underline';
    else if (part.startsWith('bg:')) {
      const color = part.replace('bg:', '');
      style.backgroundColor = resolveColor(color, theme);
    } else if (part.startsWith('fg:')) {
      const color = part.replace('fg:', '');
      style.color = resolveColor(color, theme);
    } else {
      // Assume fg color if not prefixed
      style.color = resolveColor(part, theme);
    }
  });

  return style;
};

// Render a single module's format string into an HTML structure
export const parseFormatString = (
  formatStr: string,
  variables: Record<string, string>,
  moduleStyle: string,
  theme?: Theme
) => {
  if (!formatStr) return [];

  // Resolve Starship-style optional groups: text wrapped in parentheses only renders
  // when at least one variable inside is non-empty. The parentheses themselves are not rendered.
  const resolveOptionalGroups = (str: string): string => {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      // Handle escape
      if (char === '\\') {
        if (i + 1 < str.length) {
          result += str[i + 1];
          i++;
        } else {
          result += char;
        }
        continue;
      }

      if (char === '(') {
        // If this paren directly follows a style block opener (e.g., "]("),
        // leave it untouched so style parsing works.
        let prev = i - 1;
        while (prev >= 0 && /\s/.test(str[prev])) prev--;
        if (prev >= 0 && str[prev] === ']') {
          result += char;
          continue;
        }

        // Find matching ) respecting escapes and nesting
        let depth = 0;
        let j = i;
        for (; j < str.length; j++) {
          if (str[j] === '\\') { j++; continue; }
          if (str[j] === '(') depth++;
          else if (str[j] === ')') {
            depth--;
            if (depth === 0) break;
          }
        }

        if (j < str.length) {
          const inner = str.substring(i + 1, j);
          // Determine if any variable inside has a non-empty value
          const varMatches = Array.from(inner.matchAll(/\$[a-zA-Z0-9_]+/g));
          const shouldRender = varMatches.length === 0 || varMatches.some(m => {
            const val = variables[m[0]];
            return val !== undefined && val !== '';
          });

          if (shouldRender) {
            result += resolveOptionalGroups(inner); // recurse for nested groups
          }
          i = j; // Skip past the closing paren
          continue;
        }
      }

      result += char;
    }
    return result;
  };

  let currentFormat = resolveOptionalGroups(formatStr);

  // 1. Explicitly replace $style first, as it's a config variable, not a content variable
  currentFormat = currentFormat.split('$style').join(moduleStyle || '');

  // 2. Substitute all other variables
  Object.entries(variables).forEach(([key, val]) => {
    currentFormat = currentFormat.split(key).join(val || '');
  });

  const result: { text: string; style: ParsedStyle }[] = [];
  let buffer = '';

  // Helper to find matching bracket index, respecting escapes and nesting
  const findMatchingBracket = (str: string, start: number): number => {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '\\') {
        i++; // Skip next char
        continue;
      }
      if (str[i] === '[') depth++;
      else if (str[i] === ']') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  };

  // Helper to find closing paren for style, respecting escapes
  const findClosingParen = (str: string, start: number): number => {
    for (let i = start; i < str.length; i++) {
      if (str[i] === '\\') {
        i++;
        continue;
      }
      if (str[i] === ')') return i;
    }
    return -1;
  };

  for (let i = 0; i < currentFormat.length; i++) {
    const char = currentFormat[i];

    if (char === '\\') {
      // Escape sequence: treat next char as literal text
      if (i + 1 < currentFormat.length) {
        buffer += currentFormat[i + 1];
        i++;
      } else {
        buffer += char; // Trailing backslash
      }
      continue;
    }

    if (char === '[') {
      // Potential style block start
      const closeBracketIdx = findMatchingBracket(currentFormat, i);

      if (closeBracketIdx !== -1 && closeBracketIdx + 1 < currentFormat.length && currentFormat[closeBracketIdx + 1] === '(') {
        // Found [...] followed by (
        const styleStart = closeBracketIdx + 2;
        const styleEnd = findClosingParen(currentFormat, styleStart);

        if (styleEnd !== -1) {
          // Valid style block found!

          // 1. Flush buffer
          if (buffer) {
            result.push({ text: buffer, style: {} });
            buffer = '';
          }

          // 2. Extract content and style
          const content = currentFormat.substring(i + 1, closeBracketIdx);
          const styleStr = currentFormat.substring(styleStart, styleEnd);

          // 3. Parse style
          const parsedStyleObj = parseStyle(styleStr, theme);

          // 4. Recursively parse content
          // We pass empty variables/style because they are already substituted in the content
          const innerSegments = parseFormatString(content, {}, '', theme);

          // 5. Merge styles
          innerSegments.forEach(seg => {
            result.push({
              text: seg.text,
              style: { ...parsedStyleObj, ...seg.style }
            });
          });

          // 6. Advance index
          i = styleEnd;
          continue;
        }
      }
    }

    // If not a style block or special char, add to buffer
    buffer += char;
  }

  // Flush remaining buffer
  if (buffer) {
    result.push({ text: buffer, style: {} });
  }

  return result;
};

export const generateTOML = (
  modules: ActiveModule[],
  config?: {
    add_newline?: boolean;
    command_timeout?: number;
    scan_timeout?: number;
    right_format?: string;
    continuation_prompt?: string;
    palette?: string;
    palettes?: Record<string, Record<string, string>>;
  }
): string => {
  let toml = `# Starship Configuration\n# Generated by Starship Architect\n\n`;

  // Add global configuration options
  if (config?.add_newline !== undefined) {
    toml += `add_newline = ${config.add_newline}\n`;
  }
  if (config?.command_timeout !== undefined) {
    toml += `command_timeout = ${config.command_timeout}\n`;
  }
  if (config?.scan_timeout !== undefined) {
    toml += `scan_timeout = ${config.scan_timeout}\n`;
  }
  if (config?.palette) {
    toml += `palette = '${config.palette}'\n`;
  }
  if (toml.includes('=')) {
    toml += '\n';
  }

  const formatParts: string[] = [];

  modules.forEach(mod => {
    if (mod.type === 'line_break') {
      formatParts.push('$line_break');
      return;
    }

    if (mod.type === 'text') {
      // Text modules are just literals in the format string
      // We use the 'format' property which contains the raw string (e.g. "[](surface0)")
      const textContent = mod.properties.format || '';
      formatParts.push(textContent);
      return;
    }

    formatParts.push(`$${mod.type}`);

    // Generate section
    toml += `[${mod.type}]\n`;
    toml += `disabled = ${mod.disabled}\n`;

    Object.entries(mod.properties).forEach(([key, value]) => {
      // Simple string escaping
      if (typeof value === 'string') {
        toml += `${key} = '${value.replace(/'/g, "\\'")}'\n`;
      } else if (typeof value === 'boolean') {
        toml += `${key} = ${value}\n`;
      } else if (typeof value === 'number') {
        toml += `${key} = ${value}\n`;
      } else {
        toml += `${key} = ${value}\n`;
      }
    });
    toml += '\n';
  });

  // Global format string
  toml = `format = """\n${formatParts.join('')}"""\n` +
    (config?.right_format ? `right_format = """\n${config.right_format}\n"""\n` : '') +
    (config?.continuation_prompt ? `continuation_prompt = '${config.continuation_prompt}'\n` : '') +
    '\n' + toml;

  // Add palettes if defined
  if (config?.palettes) {
    Object.entries(config.palettes).forEach(([paletteName, colors]) => {
      toml += `\n[palettes.${paletteName}]\n`;
      Object.entries(colors).forEach(([colorName, colorValue]) => {
        toml += `${colorName} = '${colorValue}'\n`;
      });
    });
  }

  return toml;
};

/**
 * Parses a TOML string back into ActiveModule[]
 * This is a best-effort parser for the specific subset of TOML used by Starship
 */
export const parseTOMLToModules = (tomlString: string): ActiveModule[] => {
  try {
    const parsed = parse(tomlString) as Record<string, any>;
    const format = parsed.format as string;

    const modules: ActiveModule[] = [];

    if (format) {
      // Tokenizer regex: matches $variable or literal text
      // 1. $variable: \$([a-zA-Z0-9_]+)
      // 2. Literal text: anything else until the next $
      const regex = /\$([a-zA-Z0-9_]+)|([^$]+)/g;
      let match;

      while ((match = regex.exec(format)) !== null) {
        if (match[1]) {
          // It's a module variable (e.g. $directory)
          const modName = match[1];

          if (modName === 'line_break') {
            modules.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'line_break',
              disabled: false,
              properties: {}
            });
            continue;
          }

          const def = MODULE_DEFINITIONS.find(d => d.name === modName);
          if (def) {
            const configProps = parsed[modName] || {};
            modules.push({
              id: Math.random().toString(36).substr(2, 9),
              type: modName,
              disabled: configProps.disabled === true,
              properties: {
                ...def.defaultProps,
                ...configProps
              }
            });
          }
        } else if (match[2]) {
          // It's a literal text segment (e.g. [](surface0))
          // We create a 'text' module for this
          const textContent = match[2];

          modules.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'text',
            disabled: false,
            properties: {
              format: textContent
            }
          });
        }
      }
    } else {
      // Fallback: just take keys that match module definitions
      const moduleOrder = Object.keys(parsed).filter(k =>
        MODULE_DEFINITIONS.some(def => def.name === k)
      );

      moduleOrder.forEach(modName => {
        if (modName === 'line_break') {
          modules.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'line_break',
            disabled: false,
            properties: {}
          });
          return;
        }

        const def = MODULE_DEFINITIONS.find(d => d.name === modName);
        if (!def) return;

        const configProps = parsed[modName] || {};

        modules.push({
          id: Math.random().toString(36).substr(2, 9),
          type: modName,
          disabled: configProps.disabled === true,
          properties: {
            ...def.defaultProps,
            ...configProps
          }
        });
      });
    }

    return modules;

  } catch (error) {
    console.error("Failed to parse TOML", error);
    return [];
  }
};

/**
 * Ensures a color has a # prefix
 */
const ensureHexPrefix = (color: string): string => {
  if (!color) return color;
  return color.startsWith('#') ? color : `#${color}`;
};

/**
 * Parses a Base16/Base24 YAML string into a Theme object
 */
export const parseBase16Theme = (yamlString: string): Theme | null => {
  try {
    const parsed: any = load(yamlString);
    if (!parsed || !parsed.palette) {
      console.warn("Invalid Base16/Base24 YAML format");
      return null;
    }

    const p = parsed.palette;
    const system = parsed.system || 'base16';

    // Build the palette object
    const palette: any = {
      base00: ensureHexPrefix(p.base00),
      base01: ensureHexPrefix(p.base01),
      base02: ensureHexPrefix(p.base02),
      base03: ensureHexPrefix(p.base03),
      base04: ensureHexPrefix(p.base04),
      base05: ensureHexPrefix(p.base05),
      base06: ensureHexPrefix(p.base06),
      base07: ensureHexPrefix(p.base07),
      base08: ensureHexPrefix(p.base08),
      base09: ensureHexPrefix(p.base09),
      base0A: ensureHexPrefix(p.base0A),
      base0B: ensureHexPrefix(p.base0B),
      base0C: ensureHexPrefix(p.base0C),
      base0D: ensureHexPrefix(p.base0D),
      base0E: ensureHexPrefix(p.base0E),
      base0F: ensureHexPrefix(p.base0F),
    };

    // Add Base24 colors if present
    if (system === 'base24' && p.base10) {
      palette.base10 = ensureHexPrefix(p.base10);
      palette.base11 = ensureHexPrefix(p.base11);
      palette.base12 = ensureHexPrefix(p.base12);
      palette.base13 = ensureHexPrefix(p.base13);
      palette.base14 = ensureHexPrefix(p.base14);
      palette.base15 = ensureHexPrefix(p.base15);
      palette.base16 = ensureHexPrefix(p.base16);
      palette.base17 = ensureHexPrefix(p.base17);
    }

    return {
      name: parsed.name || 'Custom Theme',
      author: parsed.author,
      variant: parsed.variant || 'dark',
      system: system as 'base16' | 'base24',
      colors: {
        bg: palette.base00,     // Default Background
        fg: palette.base05,     // Default Foreground
        black: palette.base01,  // Lighter Background (Used for status bars)
        red: palette.base08,
        green: palette.base0B,
        yellow: palette.base0A,
        blue: palette.base0D,
        purple: palette.base0E,
        cyan: palette.base0C,
        white: palette.base07,  // Light Background / White
        orange: palette.base09,
        gray: palette.base03,   // Comments / Gray
      },
      palette
    };
  } catch (error) {
    console.error("Failed to parse Theme YAML", error);
    return null;
  }
};

/**
 * Converts a Theme's palette to a Starship palette format
 */
export const themeToStarshipPalette = (theme: Theme): Record<string, string> | null => {
  if (!theme.palette) return null;

  const palette: Record<string, string> = {};
  Object.entries(theme.palette).forEach(([key, value]) => {
    if (value) {
      palette[key] = value;
    }
  });

  return palette;
};
