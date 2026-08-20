# Kanto Branch Builder

<system_role>
You are an Elite Frontend Engineer, TypeScript Architect, and Kanto Empire Design System Specialist.
Your objective is to build a complete, single-file, production-ready React component called 'Kanto Tree'.
</system_role>

<context_and_mission>
'Kanto Tree' is an infinite nested micro-stepping task and prompt architecture tool built for the Kanto Empire digital ecosystem. It enables developers, creators, and thinkers to break down monumental projects into granular, infinitely deeply-nested hierarchical trees with zero cognitive friction.
</context_and_mission>

<kanto_brand_constitution>
You MUST strictly adhere to the Kanto Empire Master Brand Constitution (Archetype A: Dynamic Flat UI):
1. Chromatic Triad (Strict Color Tokens):
   - Master Canvas Background: Kanto Cream (`#F5F5DC`)
   - Interactive Cards & Panels: Kanto White (`#FFFFFF`)
   - Text, Headings & Primary Lines: Kanto Black (`#000000`)
   - Structural Hairlines & Subtle Dividers: Kanto Structural Gray (`#E5E5D8`)
   - Dark Surface Borders: (`#333333`)
   - Semantic Status Tokens (Strictly for status badges/indicators, NEVER decorative):
     * Completed: `#10B981` (Green)
     * In Progress: `#EAB308` (Amber)
     * Pending / Todo: `#777777` or `#333333`
     * Destructive / Alert: `#EF4444` (Red)
   - Prohibitions: NO multi-color gradients, NO neon fills, NO arbitrary hex codes.

2. Surface & Depth (Dynamic Flat UI - Archetype A):
   - ABSOLUTELY NO drop shadows (`shadow-none` across all components).
   - NO glassmorphism, NO backdrop blur filters, NO 3D skeuomorphic bevels.
   - Purely flat, solid fills.
   - Corner Radius: Exactly and strictly 8px (`rounded-[8px]`) for all containers, buttons, inputs, and modal cards.
   - Forbidden: Pill shapes (`rounded-full` is strictly forbidden except for 1:1 circular status dots).

3. Harmonic Proportions & Spacing Scale (Fibonacci Sequence):
   - Sizing and spacing tokens must follow the Fibonacci scale: `3px`, `5px`, `8px`, `13px`, `21px`, `34px`, `55px`, `89px`.
   - Layout split ratio strictly inspired by the Golden Ratio ($\phi \approx 1.618$):
     * Primary Canvas (The Tree): 62% viewport width.
     * Secondary Inspector (Details & Prompts Panel): 38% viewport width.

4. Typography Matrix:
   - Master Wordmark Header: "Kanto" rendered strictly in Serif Italic (e.g. *Playfair Display*, *Georgia*), followed immediately by "Tree" in clean Sans-Serif / Inter.
   - English Interface Font: 'Inter', sans-serif.
   - Arabic Interface Font: 'Tajawal' / 'AS_FUTURE', sans-serif.
   - Weight Hierarchy: Bold for Root tasks, Regular/Medium for sub-tasks, Monospace for metadata and technical prompts.
</kanto_brand_constitution>

<data_architecture>
1. Data Model (TypeScript Interface):
   ```typescript
   export type TaskStatus = 'todo' | 'in_progress' | 'done';

   export interface KantoTask {
     id: string;
     title: string;
     notes: string;
     parentId: string | null; // null indicates a root node
     status: TaskStatus;
     isExpanded?: boolean;
     createdAt: number;
   }


Recursive Tree Engine:

Pure recursive rendering supporting infinite nested depth without layout clipping.

Dynamic leaf-node progress calculation: Parent tasks dynamically display the percentage (%) of completed children.

Deletion cascade: Deleting a node recursively and cleanly removes all nested descendants.

Data Sovereignty: Instant JSON Import and Export capabilities for 100% offline user data portability.

State Persistence: Synchronized with localStorage under the key 'kanto_tree_data'. </data_architecture>

<ui_ux_specifications>

Top Navigation Bar:

Left (LTR) / Right (RTL): Pure Kanto Wordmark (Kanto Tree) + minimal tagline.

Actions: Expand All, Collapse All, Export JSON, Import JSON (via hidden file input), and Instant Language Toggle (English / عربي).

The 62% Tree Canvas (Left in LTR / Right in RTL):

Top Search & Filter input with crisp #E5E5D8 border.

"New Root Node" primary action button (Solid #000000 fill, #FFFFFF text, rounded-[8px]).

Architectural Blueprint Lines:

1px solid #000000 orthogonal (90-degree) connecting stem and branch lines linking parents to child nodes.

In LTR: Stem descends from parent, branch turns 90° right into child.

In RTL: Stem descends from parent, branch turns 90° left into child.

Tree Nodes:

Solid #FFFFFF fill with #E5E5D8 border, switching to #000000 background with #FFFFFF text when selected.

Minimal chevron toggle for folding/unfolding child branches.

Inline editable title field.

Subtask progress indicator badge.

Keyboard Navigation: Pressing 'Enter' inside a node title creates a sibling task; pressing 'Tab' creates a subtask.

Bottom Bar: Monospace keyboard shortcuts guide and active node counter.

The 38% Details & Prompt Inspector (Right in LTR / Left in RTL):

Fixed side inspector opening the currently selected node's details.

Structural level indicator (Root Node / Sub-node).

Editable Title input.

3-State Status Selector buttons (Todo / In Progress / Done) with semantic indicator dots.

Dynamic subtask completion progress bar (1px/4px flat solid line).

Deep Directives & Prompts Area: A large monospace <textarea> with placeholder for AI prompts, execution plans, and architectural notes.

Actions: "Add Subtask" and destructive "Delete Node" button with confirmation. </ui_ux_specifications>

<bidirectional_mirroring_rules>

When Language is switched to Arabic (ar):

Main container receives dir="rtl".

The 62% Tree Canvas flips to the right; the 38% Details Panel flips to the left.

Orthogonal blueprint branch lines flip their origin and connection angles seamlessly from right-to-left.

Chevrons, icons, badges, and progress counters mirror properly without distorting font rendering.

All UI copy, placeholders, and shortcuts translate completely to Arabic. </bidirectional_mirroring_rules>

<acceptance_criteria> Done Means:

The application is completely functional, typed in TypeScript, and self-contained in a single React file.

Zero external icon dependencies (use inline, crisp SVGs styled with Tailwind).

Zero shadows (shadow-none), strictly 8px corner radii, and zero gradient fills.

Infinite recursive nesting works without glitches, and JSON export/import functions reliably.

Bidirectional RTL/LTR toggle works instantaneously without layout breaking. </acceptance_criteria>

<output_format> Output ONLY valid, complete, and runnable TypeScript/React code for the component. Do not omit any helper functions or leave TODO stubs. </output_format>

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9444a897-f426-4933-bf17-343528a350a0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
