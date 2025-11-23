export interface StarshipConfig {
  format: string;
  add_newline: boolean;
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
}