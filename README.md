# Bakana's Editor Enhancement Suite (BEES)

**Bakana's Editor Enhancement Suite (BEES)** brings browser DevTools console-style autocompletion and editing enhancements directly into Foundry VTT's standard Macro Editor (`MacroConfig`).

---

## Features

- **DevTools Console Tab-Completion**:
  - Tab autocompletion for JavaScript keywords, global objects, and expressions.
  - Deep property chain inspection (`game.user.character.system.attributes.hp.`).
  - Auto-detection of macro context variables (`actor`, `token`, `character`, `speaker`, `args`, `scope`, `this`).
  - Local script variable, function, and class introspection.
  - Bracket property access (`game["actors"]`) and optional chaining (`canvas?.tokens?.`).
  - Longest Common Prefix (LCP) completion on partial matches.
- **Visual Autocomplete Popup**:
  - Sleek floating suggestion menu positioned right at the caret.
  - Color-coded badges indicating member classification:
    - **ƒ** (Method / Function)
    - **P** (Property)
    - **G** (Getter)
    - **C** (Class / Constructor)
    - **K** (Reserved Keyword)
    - **V** (Variable / Local Scope)
  - Keyboard navigation (`Tab`, `Shift+Tab`, `ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- **Editor Enhancements**:
  - Context-aware auto-indentation on `Enter` (preserving indentation and expanding after `{`, `(`, `[`).
  - Outdenting on `Shift+Tab`.
  - Non-blocking standard Tab indentation when no token is present.
- **Cross-Version Foundry Adapters**:
  - Decoupled adapters supporting Foundry VTT v12, v13, and v14+.

---

## Compatibility

- **Foundry VTT**: v12, v13, v14+
- **Game Systems**: System agnostic (D&D 5e, PF2e, PF1e, etc.)

---

## Installation

Install via the Foundry VTT Module Directory or by using the Manifest URL:

```
https://github.com/aljames-arctic/bakana-editor-enhancement-suite/releases/latest/download/module.json
```

---

## Configuration Settings

Available under **Game Settings > Configure Settings > Bakana's Editor Enhancement Suite**:

| Setting | Type | Default | Description |
|---|---|---|---|
| **Enable Tab Completion** | Boolean | `true` | Enable DevTools console-style tab completion in MacroConfig. |
| **Tab Size** | Number | `2` | Number of spaces inserted on Tab or auto-indent. |
| **Auto Indentation** | Boolean | `true` | Automatically preserve and format indentation on Enter. |
| **Max Suggestions** | Number | `50` | Maximum candidate matches shown in dropdown menu. |
| **Log Verbosity** | Select | `warn` | Diagnostic logging level (`error`, `warn`, `info`, `debug`). |

---

## License

MIT License — Copyright (c) 2026 bakanabaka
