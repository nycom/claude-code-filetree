<h1 align="center">Claude Code Filetree</h1>

<p align="center">
  An IDE-style file tree for Claude Code that shows what Claude is doing and where in files
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-%E2%89%A5_2.1.287-D97757?logo=claude&logoColor=fff" alt="Claude Code 2.1.287 or newer">
  <img src="https://img.shields.io/badge/type-mod-6f42c1" alt="Claude Code mod">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

<p align="center">
  <img src="media/filetree-shimmer.gif" alt="filetree shimmering the file Claude is editing" width="900">
</p>

> [!NOTE]
> filetree is a Claude Code **mod** and needs **Claude Code 2.1.287+**. In the terminal it shows in the right sidebar, which needs the fullscreen layout (`/tui fullscreen`) and a terminal at least 110 columns wide; in the Desktop app it opens in the app's side pane. Tested on Linux, macOS and Windows; mods don't load in WSL sessions of the Desktop app.

---

## Installation

The repo is its own plugin marketplace. Run this in the terminal:

```bash
claude plugin marketplace add data-goblin/claude-code-filetree
claude plugin install filetree@claude-code-filetree
```

Or inside a Claude Code session:

```text
/plugin marketplace add data-goblin/claude-code-filetree
/plugin install filetree@claude-code-filetree
```

Installed it as `filetree@filetree` before the repository was renamed? Nothing to do: that install keeps loading and keeps receiving updates.

## Features

- Interactive file tree for the working directory where you're using Claude Code; it follows the cwd, or `/filetree <path>` pins another folder
- Search the file tree, including folders you have not opened yet
- Git status per file and folder in color, with exact lines changed (`+N` `-N`) on modified files and `?:N M:N D:N` file counts on folders
- Branch, upstream and ahead/behind in the header
- Visual indicator of Claude reads and searches (purple), writes (orange) and commits (green); collapsed folders open to show the file. While a row shimmers its badge column also reads `r`, `w` or `●` (folders showing git counts keep the counts), so the kind never depends on colour alone. Every shimmer step keeps at least 4.5:1 contrast on the background in both themes; with Claude Code's **Reduce motion** setting on, the row holds a static colour instead of shimmering

  <img src="media/filetree-read.gif" alt="Files shimmer purple while Claude reads and searches them" width="800">

- Git and GitHub operations via `git` and `gh` (commit, push, pull, checkout, merge, PR and more) shown as a status at the bottom of the pane

  <img src="media/filetree-git.gif" alt="A committed file shimmers green and the footer shows the commit" width="800">

- Selection-aware: the selected file is passed to Claude as context through a `prompt.submit` hook, and `@path` mentions in a prompt reveal that file in the tree

  <img src="media/filetree-ask.gif" alt="Selecting config.yaml in the tree and asking Claude what it changed there" width="800">

- The date column is relative: `14:02` today, `3d`, `5w`, then `2025-11`
- Long names are cut in the middle by terminal cells, so CJK and emoji line up, and keep their extension (`very-lo…e.test.ts`)
- The row under the cursor is drawn in your foreground colour, and hovering blends the selection colour toward the background rather than painting over it
- File and folder sizes: the `Σ` header button swaps the date column for sizes; folders show their disk usage (`du`, or a summed listing on Windows), worked out in the background for the rows on screen. After a Bash call that writes, only the folders above the changed files are re-sized; ignored folders such as `node_modules` are re-sized only when a lockfile changed. If the scan finds no changed file, or hits its depth cap (`find` goes 6 levels deep, 4 outside a repo), every folder is re-sized
- Double-click a file to open it in its default app
- Click to select, arrow keys to move through the tree
- Light on large repos: outside a repo it only checks once whether one exists, and every git call is scoped to the cwd
- Nerd Font icons with a plain Unicode fallback
- Opens by itself on the first real file change: nothing opens at session start, and the first write (Edit or Write, when **Claude activity** includes writes) or any file change found after a Bash call opens the pane. A pane already showing, including one the Desktop app drew itself, is never re-opened, and a change of folder never opens a closed pane (only `/filetree` does, in the terminal and the Desktop app alike). A pane that fails to open, or that the host leaves unplaced (for example, too narrow), is tried again on the next change, and an inline pane is never auto-opened
- Light and dark palettes follow Claude Code's `theme` setting. `auto` follows the OS appearance (macOS, Windows, GNOME; under WSL, Windows' through `reg.exe`) and is re-checked every 60 seconds while the pane is open
- Omarchy theming: the pane takes its colors and background from `~/.local/state/omarchy/current/theme/colors.toml` (`foreground`, `accent`, `red`, `selection`, `background`, with `color7`, `color4`, `color1` as fallbacks; muted text is `dark_foreground`, else `muted`, else `color8`). The file is checked every 2 seconds while it exists and every 60 seconds while it is missing, so a theme switch or a theme set up later is picked up. A theme with `mode = "light"` leaves the palette to Claude Code's setting, or to the skin while one is on
- Follows the [skins](https://github.com/nycom/claude-skins) mod, with a skins version that publishes its theme (`skins.theme`): while a skin is on, the skin's own mode (light or dark) picks the pane's palette in place of Claude Code's `theme` setting, and the pane does not check the OS appearance itself. Skins cannot read the Windows appearance, so under `auto` on Windows and WSL the pane still checks it and leaves out a skin of the other mode. A skin gives the pane its colors, on the terminal's background as skins draws, and changes with `/skin`; Omarchy's colors are left out while a skin colors the pane, and come back where a skin of the other mode is left out. With skins off, not installed, or a skins version that does not publish its theme, the pane themes as above

### Resizing the pane

You can resize the pane with the mouse, or by setting custom `pane:grow` or `pane:shrink` keybindings in `keybindings.json`

<p align="center">
  <img src="media/filetree-resize.gif" alt="Dragging the filetree pane edge to resize it" width="900">
</p>

## Settings

All settings are in `/config` under filetree.

- **Claude activity:** what shimmers: `reads and writes` (default), `writes`, `reads` or `none`. Git status, line counts and the git status at the bottom always show.
- **Follow Claude:** `on` (default) scrolls the tree to what Claude reads, writes or commits; `off` keeps the view where you put it, and highlights still show.
- **Right column:** `date` (default) or `size`; what the right column shows when a session starts. The `Σ` button in the header toggles it.
- **Glyphs:** `auto` (default) uses Nerd Font icons when a Nerd Font is installed and your terminal started after it was installed, plain Unicode in the desktop app, and Nerd Font over SSH. `nerd` or `plain` forces one.

## herdr

Clicking rows needs herdr 0.9.1 or later. herdr 0.9.0 and older accept pixel mouse reporting but still send cell positions, which would put every click in the session in the wrong place, so on those versions the rows ignore the mouse and the rest of the pane and session keep working. Run `herdr update` to get row clicks.

## Contributing

Turn on the pre-commit hook once per clone; it runs `claude plugin validate` and the plugin tests before each commit that touches the plugin:

```bash
git config core.hooksPath .githooks
```

The same checks run on macOS, Windows and Linux in CI on every push that touches the plugin.

## License

[MIT](LICENSE)

*This project is inspired by my Omarchy app [FileBlade](https://github.com/data-goblin/fileblade)*
