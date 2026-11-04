# Permission reduction and 1.0.3 release verification

Date: 2026-11-04
Implementation commit: `122a35c2c91cbf1325cb1db9766e714dd129f1fc`

## Delivered

- Removed automatic content scripts and the notifications permission. Production permissions are `storage`, `tabGroups`, `tabs`, `activeTab`, and `scripting`; no host permissions are declared.
- Shortcut and popup invocations load the packaged panel only in the current eligible HTML page. The CRXJS `onExecute` callback waits for the panel's listener to be ready, eliminating the premature retry timeout observed during reload testing.
- Restricted pages and documents without an HTML body use the extension's own search page. The Google redirect is removed.
- Existing search, filtering, local records, and explicit synchronization behavior are preserved. No storage schema or synchronization algorithm changed.
- Updated application versions, privacy policy, README, and store submission instructions.

## Verification

- `npm run typecheck`: passed.
- `npm run build`: passed. The existing Browserslist data-age warning remains non-blocking.
- Nine command/popup routing checks against the actual TypeScript implementation: passed.
- Sixteen browser checks in an isolated Chrome 156.0.8078.74 profile with synthetic records: passed.
- Browser checks cover absence of automatic injection; denied injection before a user gesture; real extension-action temporary access; first/repeated opening; independent tabs; title search and group filtering; Escape and Enter; closed-tab record retention; reload and cross-origin navigation; Chrome settings fallback; standalone SVG fallback; local-page result opening; explicit sync after confirmation; local-page closing; and absence of the Google redirect.
- Local browser verification scripts, results, screenshots, and profiles remain under ignored `.local-store-assets/`; they are not included in Git or the extension package.
- Security and architecture reviewers checked the final startup flow. The architecture review's body-less-document finding was fixed and verified with a standalone SVG page. No unresolved findings remain.
- Diff review: on target; deep review due to the number of files; no dependency additions.

## Package

- File: `tab-group-search-webstore-1.0.3.zip`
- Size: 87,748 bytes
- Contents: 15 runtime files, with `manifest.json` at the ZIP root
- Every ZIP entry matches the production build byte-for-byte.
- SHA-256: `3027039915DA2A3C4F5CCB66C977E0B7984E9B2C3CAF308E734300FB575A105C`
- Store screenshots, candidate icons, browser profiles, dependencies, and source files are excluded.

## Manual checks and store status

The OS-level Ctrl+Space key dispatch cannot be reproduced by the headless browser. Shortcut registration and the handler are verified; test the actual key combination in the user's Chrome before submission. The live Chrome Web Store was unreachable from the isolated test browser; the restricted-page fallback was verified on Chrome settings, and permission-denial handling was checked separately.

The user still needs to upload 1.0.3 in the Chrome Web Store dashboard, update permission descriptions from `store/SUBMISSION.md`, confirm the privacy fields, and submit for review. No store upload or review submission was performed in this task.
