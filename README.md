<div align="center">

# ⭐ Starship Architect

**A Visual Configuration Builder for [Starship](https://starship.rs) - The Cross-Shell Prompt**

Build, customize, and preview your Starship prompt configuration with an intuitive visual interface.

[Features](#features) • [Quick Start](#quick-start) • [Usage](#usage) • [Configuration Support](#configuration-support)

</div>

---

## ✨ Features

- **🎨 Visual Builder**: Drag-and-drop interface for arranging prompt modules
- **👁️ Live Preview**: Real-time terminal preview with theme support
- **📦 100+ Modules**: Comprehensive support for all Starship modules
  - Core modules (directory, character, status, time, etc.)
  - Git modules (branch, status, commit, state, metrics)
  - 50+ language modules (Node.js, Python, Rust, Go, Java, and more)
  - Cloud providers (AWS, Azure, GCloud, OpenStack)
  - Container tools (Docker, Kubernetes, Terraform, Pulumi)
  - And many more!
- **🎭 Theme System**:
  - 5 built-in themes (Default, Catppuccin Mocha, Tokyo Night, Gruvbox Dark, Dracula)
  - Full Base16/Base24 YAML theme import from [tinted-theming/schemes](https://github.com/tinted-theming/schemes)
  - Palette embedding in starship.toml for portable configurations
- **⚙️ Property Editor**: Fine-tune every aspect of each module
- **📝 TOML Export**: Generate ready-to-use `starship.toml` configuration
- **🔄 TOML Import**: Edit TOML directly and see changes reflected in the UI
- **🎨 Advanced Configuration**: Support for palettes, right prompt, and global settings
- **🤖 AI Generation** (Optional): Generate configurations from natural language prompts using Gemini AI

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/starship-architect.git
   cd starship-architect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Optional: AI Features

To enable AI-powered configuration generation:

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set the environment variable:
   ```bash
   export API_KEY=your_gemini_api_key
   ```
3. Restart the development server

---

## 📖 Usage

### Building Your Prompt

1. **Add Modules**: Click the "Add Module" button to browse and add modules
2. **Arrange Modules**: Use the up/down arrows to reorder modules
3. **Configure**: Click on any module to edit its properties
4. **Preview**: See changes in real-time in the terminal preview
5. **Export**: Click the code icon to view and copy your TOML configuration

### Module Organization

Modules are organized by category:
- **Core/System**: character, username, hostname, directory, time, etc.
- **Git**: git_branch, git_status, git_commit, git_state, git_metrics
- **Languages**: nodejs, python, rust, golang, java, ruby, php, and 40+ more
- **Cloud/Infrastructure**: aws, azure, gcloud, kubernetes, terraform, docker
- **Containers**: docker_context, kubernetes, nix_shell, singularity
- **Tools**: package, cmake, conda, helm, gradle, and more

### Customizing Properties

Each module has configurable properties:
- **format**: The display format string with variables
- **symbol**: Icon or text symbol
- **style**: Color and text styling (e.g., "bold red", "blue bold")
- **disabled**: Toggle module on/off
- Module-specific properties (e.g., truncation_length for directory)

### Theme Support

1. **Select Theme**: Use the theme dropdown in the preview area
2. **Import Base16/Base24**: Click the upload icon to import theme YAML files
   - Find 200+ themes at [tinted-theming/schemes](https://github.com/tinted-theming/schemes)
   - Supports both Base16 (16 colors) and Base24 (24 colors)
   - Example: [Catppuccin Mocha](https://raw.githubusercontent.com/tinted-theming/schemes/refs/heads/spec-0.11/base24/catppuccin-mocha.yaml)
3. **Embed Palette**: Check "Embed" to include the color palette in your starship.toml
   - Makes your configuration portable across systems
   - Uses Starship's native palette system
   - Allows using palette colors like `base08`, `base0D` in styles

### Exporting Configuration

1. Click the **Code** icon in the top-right
2. Review or edit the generated TOML
3. Click **Copy Config** to copy to clipboard
4. Save to `~/.config/starship.toml`

---

## 🔧 Configuration Support

### Supported Starship Features

#### Global Options
- `format` - Main prompt format
- `right_format` - Right-aligned prompt
- `continuation_prompt` - Multi-line prompt continuation
- `add_newline` - Add newline before prompt
- `command_timeout` - Command execution timeout
- `scan_timeout` - File scanning timeout
- `palette` - Color palette selection
- `palettes` - Custom color palettes

#### All Official Modules

**Core Modules** (18):
`character`, `username`, `hostname`, `directory`, `cmd_duration`, `line_break`, `status`, `shell`, `time`, `shlvl`, `jobs`, `battery`, `env_var`, `sudo`, `localip`, `memory_usage`, `os`, `fill`

**Git Modules** (10):
`git_branch`, `git_commit`, `git_state`, `git_status`, `git_metrics`, `hg_branch`, `pijul_channel`, `fossil_branch`, `fossil_metrics`

**Language Modules** (50+):
`nodejs`, `python`, `rust`, `golang`, `java`, `ruby`, `php`, `dotnet`, `c`, `bun`, `deno`, `elixir`, `erlang`, `haskell`, `julia`, `kotlin`, `lua`, `nim`, `ocaml`, `perl`, `raku`, `scala`, `swift`, `zig`, `vlang`, `crystal`, `dart`, `elm`, `fennel`, `gleam`, `purescript`, `rlang`, `red`, `solidity`, `typst`, `cobol`, `daml`, `haxe`, `opa`, `quarto`, `rye`

**Package/Build Tools** (7):
`package`, `cmake`, `conda`, `meson`, `helm`, `gradle`, `buf`

**Cloud/Infrastructure** (8):
`aws`, `azure`, `gcloud`, `openstack`, `docker_context`, `kubernetes`, `terraform`, `pulumi`

**Container/Virtualization** (6):
`container`, `singularity`, `vagrant`, `nix_shell`, `guix_shell`, `spack`

**Other Tools** (3):
`direnv`, `vcsh`, `custom`

---

## 🎨 Examples

### Minimal Setup
```
directory → git_branch → character
```

### Developer Setup
```
username → directory → git_branch → git_status → nodejs → python → rust
line_break → character
```

### Full-Featured
```
username → hostname → directory → git_branch → git_status → git_metrics
docker_context → kubernetes → aws
package → nodejs → python → golang → rust
line_break → jobs → cmd_duration → character
```

### With Embedded Palette

When you enable "Embed" with a theme, your starship.toml will include the palette:

```toml
format = """
$directory$git_branch$character
"""

palette = 'catppuccin_mocha'

[directory]
style = 'bold base0D'  # Using palette color

[palettes.catppuccin_mocha]
base00 = '#1e1e2e'
base01 = '#181825'
base08 = '#f38ba8'
base0D = '#89b4fa'
# ... all palette colors
```

---

## 🏗️ Build & Deploy

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (via inline classes)
- **smol-toml** - TOML parsing
- **js-yaml** - YAML parsing for Base16 themes
- **Lucide React** - Icons
- **Gemini AI** (optional) - AI-powered config generation

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🙏 Acknowledgments

- [Starship](https://starship.rs) - The amazing cross-shell prompt
- [Base16](https://github.com/tinted-theming/schemes) - Color scheme system
- All the contributors and the open-source community

---

<div align="center">

**Built with ❤️ for the developer community**

[Report Bug](https://github.com/yourusername/starship-architect/issues) • [Request Feature](https://github.com/yourusername/starship-architect/issues)

</div>
