export interface StarshipConfig {
  format?: string;
  right_format?: string;
  continuation_prompt?: string;
  add_newline?: boolean;
  command_timeout?: number;
  scan_timeout?: number;
  follow_symlinks?: boolean;
  palette?: string;
  palettes?: Record<string, Record<string, string>>;
  [key: string]: any;
}

export interface ModuleDefinition {
  name: string;
  description: string;
  defaultProps: Record<string, any>;
  variables: string[]; // Variables available in the format string (e.g., $symbol, $version)
}

export interface ActiveModule {
  id: string;
  type: string; // references ModuleDefinition.name
  disabled: boolean;
  properties: Record<string, any>; // format, style, symbol, etc.
}

export type ColorType = 'fg' | 'bg';

export interface ParsedStyle {
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

export interface Theme {
  name: string;
  author?: string;
  variant?: 'dark' | 'light';
  system?: 'base16' | 'base24';
  colors: {
    bg: string;
    fg: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    purple: string;
    cyan: string;
    white: string;
    orange: string;
    gray: string;
  };
  // Raw Base16/Base24 palette for export
  // Raw Base16/Base24 palette for export, or custom Starship palette
  palette?: Record<string, string>;
}

export interface PreviewContext {
  id: string;
  name: string;
  path: string;
  os?: string; // e.g. "linux", "macos", "windows"
  readOnly?: boolean;
  git?: {
    branch: string;
    status: string;
  };
  languages?: Record<string, string>; // e.g. { go: "1.21", node: "20.0" }
  cmd_duration?: number;
  time?: string;
  docker_context?: string;
  container?: {
    name: string;
  };
  package?: {
    version: string;
  };
}
