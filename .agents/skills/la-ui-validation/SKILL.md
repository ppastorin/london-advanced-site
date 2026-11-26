---
name: la-ui-validation
description: Validate London Advanced interface changes across generated pages, languages, responsive layouts and interaction states. Use for changes to HTML, CSS, navigation, templates, imagery, overlays, forms, tools, Studio previews, accessibility or any other user-visible web behaviour.
---

# UI validation

Validate the smallest representative surface that proves the change without skipping a
language, viewport or state that can fail independently.

## Establish the matrix

1. Read the root `AGENTS.md` and inspect the current implementation plus one comparable
   page or component.
2. List the affected routes, English and Italian variants, reusable templates, viewport
   classes and interaction states. State why any matrix dimension is not applicable.
3. Define observable acceptance criteria before editing. Include the reported defect and
   likely regressions such as overflow, cropping, hidden controls or excessive spacing.

## Validate locally

1. Run the narrow relevant tests while iterating. Regenerate the preview through the
   repository build rather than hand-editing deployment output.
2. Use a browser against the generated or local preview. Check a narrow mobile viewport
   around 390 x 844 and a desktop viewport around 1440 x 900 for responsive changes; add
   the breakpoint nearest the defect when relevant.
3. Exercise the affected state, not only the initial page. Test keyboard access, focus,
   form errors, empty and populated results, menus, overlays or loading states when the
   change can affect them.
4. Compare screenshots or inspected layout values at the affected viewport. Check:
   - no horizontal overflow, clipping or unsafe text placement;
   - deliberate image aspect ratio, crop and focal point;
   - readable hierarchy, spacing and contrast;
   - usable controls, visible focus and meaningful labels;
   - correct links, navigation and EN/IT language pairing.
5. Recheck one unaffected comparable route when a shared template or stylesheet changed.
   Do not take blanket screenshots of unrelated pages.

## Release evidence

- Run the full `npm test` before release and follow `la-safe-deployment` for the pull
  request, merge and Cloudflare gates.
- After deployment, repeat the decisive browser check on the canonical live URL. Do not
  treat source inspection, unit tests or a successful build as visual proof.
- Report the routes, languages, viewports, states and browser evidence checked, plus any
  limitation. If browser validation is unavailable, stop short of claiming UI approval.
