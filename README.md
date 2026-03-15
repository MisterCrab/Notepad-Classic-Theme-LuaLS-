# Notepad++ Classic Theme (VSS, LuaLS)

Light theme inspired by Notepad++ with enhanced Lua support via LuaLS semantic tokens.

## Features

- **Fold underlines** — collapsed regions get a subtle bottom border
- **Semantic Lua highlighting** — blue/purple coloring for globals, standard library namespaces, and aliases
- **Metamethod detection** — `__index`, `__call`, `__band` etc. highlighted as blue bold in table constructors
- **Cross-file alias detection** — `T.floor = math.floor` in one file makes `floor` purple everywhere
- **Instant color pass** — regex-based highlighting fires immediately on file open, before LuaLS finishes loading
- **Unused code differentiation** — multi-line unused blocks dimmed grey, single-line unused variables shown in red
- **Notepad++ bracket matching** — red border around matching brackets
- **Dark Terminal option** — when enabled, adds dark background/foreground/cursor to the terminal; selection and find-match colors are always active regardless of this setting

## Color Scheme

| Element | Color |
|---------|-------|
| Keywords (`local`, `end`, `if`, `self`) | Bold blue `#0000FF` |
| Blue globals (`pairs`, `print`, `require`, `coroutine.*`) | Bold `#0080C0` |
| Purple globals (`string.*`, `table.*`, `math.*`, `wipe`, `strformat`) | Bold `#8000FF` |
| Comments | Green `#008000` |
| Doc comments (non-Lua) | Teal `#008080` |
| Strings | Grey `#808080` |
| Numbers | Orange `#FF8000` |
| Operators, brackets | Bold navy `#000080` |

## Requirements

- [Lua Language Server (LuaLS)](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) for semantic token support
