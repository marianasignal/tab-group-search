# Quick Task: Prepare Chrome Web Store submission

Date: 2026-11-03

## Scope

Prepare the existing Tab Group Search extension for Chrome Web Store submission. Keep the current interface and local storage model. Do not claim the extension is submitted or approved until the developer dashboard confirms that state.

## Plan and verification

1. Fix the four reproduced TypeScript errors and the production content-script fallback; verify with `npm run typecheck` and a targeted runtime check against the bundled service worker.
2. Remove the invalid `commands` permission, grant `activeTab` for user-triggered injection, and limit automatic injection to HTTP/HTTPS pages; verify the built manifest and referenced assets.
3. Document actual data handling, permission justifications, listing copy, and reviewer instructions; compare every claim with the source implementation.
4. Produce a ZIP with `manifest.json` at its root and no source files or dependencies; verify archive entries, hashes, and the 128-pixel icon.
5. Check developer account access, prepare actual interface screenshots, and upload if access allows. Stop at account login, payment, or unavailable browser control.

## Initial evidence

- Existing production build passes; `npm run typecheck` reports four errors.
- Chrome storage typings return unknown values without the application's storage schema.
- Two message listeners declare unused `sender` parameters.
- Programmatic injection references `src/content/index.tsx`, which is absent from the production build.
- The existing `dist.zip` contains a wrapping `dist/` directory.
- Browser control returned `Not allowed`; account registration, payment, and submission status are not verified.
