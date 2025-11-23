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
  theme?: Theme,
  depth: number = 0
) => {
  if (!formatStr) return [];
  if (depth > 10) return [{ text: formatStr, style: {} }]; // Prevent infinite recursion

  let currentFormat = formatStr;

  // Perform variable substitution and escape cleanup only at the top level
  // (or if we assume the input string hasn't been processed yet, but here we process the whole string first)
  if (depth === 0) {
    // 1. Explicitly replace $style first, as it's a config variable, not a content variable
    currentFormat = currentFormat.split('$style').join(moduleStyle || '');

    // 2. Substitute all other variables
    Object.entries(variables).forEach(([key, val]) => {
      currentFormat = currentFormat.split(key).join(val || '');
    });

    // 3. Clean up escape characters (e.g. \[ becomes [, \) becomes ))
    currentFormat = currentFormat.replace(/\\([\[\]\(\)])/g, '$1');
  }

  const result: { text: string; style: ParsedStyle }[] = [];

  let remaining = currentFormat;

  while (remaining.length > 0) {
    const openIdx = remaining.indexOf('[');

    if (openIdx === -1) {
      // No more style blocks
      result.push({ text: remaining, style: {} });
      break;
    }

    if (openIdx > 0) {
      // Text before the block
      result.push({ text: remaining.substring(0, openIdx), style: {} });
      remaining = remaining.substring(openIdx);
    }

    // Now remaining starts with [
    // Find the matching ](...) pattern
    let bracketDepth = 0;
    let closeIdx = -1;

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i] === '[') bracketDepth++;
      else if (remaining[i] === ']') {
        bracketDepth--;
        if (bracketDepth === 0) {
          // Found the closing bracket for the outer block
          // Check if next char is (
          if (i + 1 < remaining.length && remaining[i + 1] === '(') {
            closeIdx = i;
            break;
          }
        }
      }
    }

    if (closeIdx !== -1) {
      // We found the closing ], check for style parens
      const styleStart = closeIdx + 2; // after ](
      const styleEnd = remaining.indexOf(')', styleStart);

      if (styleEnd !== -1) {
        const content = remaining.substring(1, closeIdx);
        const styleRaw = remaining.substring(styleStart, styleEnd);
        const blockStyle = parseStyle(styleRaw, theme);

        // Recursively parse the content
        // We pass empty variables/style because they are already substituted in the content
        const innerSegments = parseFormatString(content, {}, '', theme, depth + 1);

        // Merge styles: inner segments' style overrides block style (or merges with it)
        innerSegments.forEach(seg => {
          result.push({
            text: seg.text,
            style: { ...blockStyle, ...seg.style }
          });
        });

        remaining = remaining.substring(styleEnd + 1);
        continue;
      }
    }

    // If we get here, we didn't find a valid style block starting at openIdx
    // Treat the [ as literal text and continue searching
    result.push({ text: '[', style: {} });
    remaining = remaining.substring(1);
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
  toml = `format = """\n${formatParts.join('')}\n"""\n` +
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

          // Try to parse [text](style) if present, otherwise raw text
          // Note: The 'text' module's format is just '$text', so we pass the raw content as the 'text' property.
          // However, if the content is complex (like multiple segments), we might want to just treat it as the format string itself?
          // Actually, the 'text' module we added has format: '$text'. 
          // If we put the entire segment into 'text' property, it will be rendered as is.
          // But wait, if the segment is "[](surface0)", and we put that in 'text', 
          // parseFormatString will eventually parse it again when rendering the module.

          modules.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'text',
            disabled: false,
            properties: {
              format: '$text',
              text: textContent,
              style: ''
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