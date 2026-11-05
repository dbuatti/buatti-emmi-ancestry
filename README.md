# Welcome to your Dyad app

> **New here (or a fresh AI session)?** Read **`HANDOFF.md`** first — a dated briefing pack
> (project state, data-model traps, verified links, ranked next steps). `AGENTS.md` is the
> full PM log behind it.

## Copy the whole family tree (for pasting into a Claude chat)

Two ways, same output:

1. **In the app** — the **Copy family tree** button in the header puts the whole tree on the clipboard.
2. **From the terminal** —

   ```bash
   pnpm export:tree      # or: node scripts/export-family-tree.mjs
   ```

   This writes `family-tree-export.md` at the repo root *and* copies the same text to the
   clipboard (pbcopy + pbpaste verification). Upload the `.md` file if a paste ever truncates.

   Flags: `--no-clipboard` (file only), `--out <path>` (different filename).

The export covers all 84 people, grouped by family line (BUATTI–GALANTI, CHIAPPINI–PIRRI,
EMMI–PATANÈ, PATANÈ–D'AGATA / VECCHIO–RAITI) and ordered by generation (Daniele = 0,
parents = -1 …), followed by EXCLUDED CANDIDATES and OPEN QUESTIONS. Uncertain readings are
preserved verbatim; missing fields are printed as `unknown`.

Source: `src/lib/exportFamilyTree.ts` (shared by the button and the script).
