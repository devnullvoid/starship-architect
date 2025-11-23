import { ModuleDefinition, Theme } from './types';

export const COMMON_SYMBOLS = [
  { label: 'Arrow', value: '❯' },
  { label: 'Triangle', value: '' },
  { label: 'Git Branch', value: '' },
  { label: 'Node.js', value: '' },
  { label: 'Rust', value: '' },
  { label: 'Python', value: '🐍' },
  { label: 'Docker', value: '' },
  { label: 'Package', value: '📦' },
  { label: 'Error', value: '✖' },
  { label: 'Success', value: '✔' },
  { label: 'Lock', value: '🔒' },
  { label: 'Home', value: '' },
  { label: 'Folder', value: '' },
  { label: 'Time', value: '' },
  { label: 'Battery', value: '🔋' },
];

export const THEMES: Theme[] = [
  {
    name: 'Default',
    colors: {
      bg: '#1e1e1e',
      fg: '#d4d4d4',
      black: '#000000',
      red: '#ef4444',
      green: '#22c55e',
      yellow: '#eab308',
      blue: '#3b82f6',
      purple: '#a855f7',
      cyan: '#06b6d4',
      white: '#ffffff',
      orange: '#f97316',
      gray: '#6b7280',
    }
  },
  {
    name: 'Catppuccin Mocha',
    colors: {
      bg: '#1e1e2e',
      fg: '#cdd6f4',
      black: '#45475a',
      red: '#f38ba8',
      green: '#a6e3a1',
      yellow: '#f9e2af',
      blue: '#89b4fa',
      purple: '#cba6f7',
      cyan: '#89dceb',
      white: '#bac2de',
      orange: '#fab387',
      gray: '#585b70',
    }
  },
  {
    name: 'Tokyo Night',
    colors: {
      bg: '#1a1b26',
      fg: '#c0caf5',
      black: '#414868',
      red: '#f7768e',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      purple: '#bb9af7',
      cyan: '#7dcfff',
      white: '#a9b1d6',
      orange: '#ff9e64',
      gray: '#565f89',
    }
  },
  {
    name: 'Gruvbox Dark',
    colors: {
      bg: '#282828',
      fg: '#ebdbb2',
      black: '#928374',
      red: '#cc241d',
      green: '#98971a',
      yellow: '#d79921',
      blue: '#458588',
      purple: '#b16286',
      cyan: '#689d6a',
      white: '#a89984',
      orange: '#d65d0e',
      gray: '#a89984',
    }
  },
  {
    name: 'Dracula',
    colors: {
      bg: '#282a36',
      fg: '#f8f8f2',
      black: '#6272a4',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      purple: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      orange: '#ffb86c',
      gray: '#44475a',
    }
  }
];

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    name: 'directory',
    description: 'Current working directory',
    defaultProps: {
      format: '[$path]($style)[$read_only]($read_only_style) ',
      style: 'cyan bold',
      read_only: '🔒',
      read_only_style: 'red',
      truncation_length: 3,
      truncation_symbol: '…/',
    },
    variables: ['$path', '$read_only'],
  },
  {
    name: 'git_branch',
    description: 'Active git branch',
    defaultProps: {
      format: 'on [$symbol$branch]($style) ',
      symbol: ' ',
      style: 'purple bold',
    },
    variables: ['$symbol', '$branch'],
  },
  {
    name: 'git_status',
    description: 'Git status symbols',
    defaultProps: {
      format: '([$all_status$ahead_behind]($style) )',
      style: 'red bold',
      conflicted: '🏳',
      ahead: '⇡',
      behind: '⇣',
      diverged: '⇕',
      untracked: '?',
      stashed: '$',
      modified: '!',
      staged: '+',
      renamed: '»',
      deleted: '✘',
    },
    variables: ['$all_status', '$ahead_behind', '$conflicted', '$ahead', '$behind'],
  },
  {
    name: 'nodejs',
    description: 'Node.js version',
    defaultProps: {
      format: 'via [$symbol($version)]($style) ',
      symbol: ' ',
      style: 'green bold',
    },
    variables: ['$symbol', '$version'],
  },
  {
    name: 'rust',
    description: 'Rust version',
    defaultProps: {
      format: 'via [$symbol($version)]($style) ',
      symbol: ' ',
      style: 'red bold',
    },
    variables: ['$symbol', '$version'],
  },
  {
    name: 'python',
    description: 'Python version',
    defaultProps: {
      format: 'via [$symbol$pyenv_prefix($version)(\($virtualenv\))]($style) ',
      symbol: '🐍 ',
      style: 'yellow bold',
    },
    variables: ['$symbol', '$version', '$virtualenv', '$pyenv_prefix'],
  },
  {
    name: 'docker_context',
    description: 'Docker context',
    defaultProps: {
      format: 'via [$symbol$context]($style) ',
      symbol: ' ',
      style: 'blue bold',
    },
    variables: ['$symbol', '$context'],
  },
  {
    name: 'aws',
    description: 'AWS profile',
    defaultProps: {
      format: 'on [$symbol($profile )(\($region\) )]($style)',
      symbol: '☁️  ',
      style: 'orange bold',
    },
    variables: ['$symbol', '$profile', '$region'],
  },
  {
    name: 'cmd_duration',
    description: 'Command duration',
    defaultProps: {
      format: 'took [$duration]($style) ',
      style: 'yellow bold',
    },
    variables: ['$duration'],
  },
  {
    name: 'line_break',
    description: 'Inserts a line break',
    defaultProps: {}, // Special handling
    variables: [],
  },
  {
    name: 'character',
    description: 'The prompt character (usually at the end)',
    defaultProps: {
      format: '$symbol ',
      success_symbol: '[❯](green bold)',
      error_symbol: '[❯](red bold)',
      vicmd_symbol: '[❮](green bold)',
    },
    variables: ['$symbol'],
  }
];

// Mock data for previewing the prompt
export const MOCK_DATA: Record<string, any> = {
  directory: {
    $path: '~/projects/starship-architect',
    $read_only: '🔒',
  },
  git_branch: {
    $symbol: ' ',
    $branch: 'main',
  },
  git_status: {
    $all_status: '!',
    $ahead_behind: '⇡1',
  },
  nodejs: {
    $symbol: ' ',
    $version: 'v18.16.0',
  },
  rust: {
    $symbol: ' ',
    $version: '1.70.0',
  },
  python: {
    $symbol: '🐍 ',
    $version: '3.11.3',
    $virtualenv: 'venv',
    $pyenv_prefix: '',
  },
  docker_context: {
    $symbol: ' ',
    $context: 'default',
  },
  aws: {
    $symbol: '☁️  ',
    $profile: 'dev-account',
    $region: 'us-east-1',
  },
  cmd_duration: {
    $duration: '2s',
  },
  character: {
    $symbol: '❯', // Changes based on success/error state simulation
  }
};