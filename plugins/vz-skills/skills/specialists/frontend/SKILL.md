---
name: frontend
description: Frontend engineering checklist for UI components, pages, state, styling, accessibility, and client-side performance within the discovered framework and conventions. Use inside plan/implement/review when the change touches user interface code (React, Vue, Svelte, Angular, plain DOM, CSS).
argument-hint: "[component or page]"
---

# Frontend engineering

A specialist overlay on the lifecycle. Use the discovered framework; do not import another framework's idioms.

## Inputs

- Repository brief: framework (from `stack.frameworks`), bundler, test runner (vitest/jest/playwright/cypress), lint/format commands, existing component patterns (Grep for a sibling component and its test).
- The acceptance criteria for the UI behaviour.

## Checklist

### Structure and state
- Follow the existing folder/component/co-location pattern; one component per concern; reuse existing primitives (buttons, inputs, layout) before creating new ones.
- State lives at the lowest level that needs it; derived values are computed, not duplicated; server state uses the project's data layer (query library, store, loaders) rather than ad hoc fetches.
- Side effects are explicit, cancellable, and cleaned up (unsubscribe, abort controllers, timers).

### Correctness and resilience
- Loading, empty, error, and success states all exist and are reachable in tests.
- Forms: validation messages, disabled submit while pending, keyboard submit, no double submit.
- Internationalization/formatting via the project's utilities (dates, numbers, currency), never hand-rolled.

### Accessibility (not optional)
- Semantic elements first (`button`, `nav`, `label` + `input`, headings in order); ARIA only to fill real gaps.
- Keyboard: every interactive element focusable and operable; visible focus; focus management on dialogs/menus; Escape closes.
- Text alternatives for images/icons; colour is not the only signal; contrast meets WCAG AA for text.
- Announce dynamic changes where needed (live regions for async results/errors).

### Styling
- Use the existing system (tokens, utility classes, CSS modules, styled components); no inline magic numbers; responsive at the project's breakpoints; respects `prefers-reduced-motion` for animations.

### Performance
- Avoid re-render storms (stable callbacks/memo where the framework needs it, keys on lists); lazy-load heavy routes/components with the project's mechanism; images sized and lazy; no large dependencies added for small utilities (check bundle impact if the project reports it).

### Tests
- Behavioural tests with the project's runner: render, interact (click/type/keyboard), assert visible outcome and accessibility roles/names. Snapshot tests only where the project already relies on them.
- E2E only for critical flows and only if the suite exists and runs locally (otherwise NOT VERIFIED).

## Verification commands

Use CONFIRMED commands from discovery: unit tests, lint (often includes `jsx-a11y`), typecheck, and build (catches CSS/asset problems). Run the dev server only if asked or if the acceptance criteria require visual confirmation; report what you observed.

## Output

Fold findings into the plan slices or review findings; cite the checklist item and the file.

## Validation scenarios

- Adding a modal: focus trap, Escape, return focus, aria-modal, and a keyboard test are in the slices.
- A list rendered without keys or with index keys while items reorder -> review finding with the fix.
