# Chrome Web Store preparation

Date: 2026-11-03

Status: Local package and text materials prepared. Browser validation, actual screenshots, account verification, upload, and submission remain pending.

Implementation commit: `c01a2c9`.

## Changes

- Fixed four TypeScript errors by supplying the existing storage schema and marking unused callback parameters.
- Replaced the production fallback's missing TSX source path with the built manifest's JavaScript and CSS paths.
- Removed the invalid `commands` permission, added user-triggered `activeTab`, and limited static content scripts to HTTP/HTTPS.
- Added `PRIVACY.md` and `store/SUBMISSION.md`, including local browsing-data handling, permission justifications, reviewer instructions, and the existing Google-page fallback.
- Corrected README claims about pinyin support and manual synchronization.
- Created `tab-group-search-webstore-1.0.0.zip` with the manifest at archive root. Updated `dist.zip` to the same package.

## Verification

- `npm run typecheck`: passed after reproducing the four baseline failures.
- `npm run build`: passed, 37 modules transformed. Existing Browserslist data-age warning remains.
- VM regression check: baseline requests absent `src/content/index.tsx`; patched handler injects manifest JS/CSS and retries the message successfully.
- VM normal-path check: a page with an existing receiver receives one message and is not reinjected.
- Actual production service-worker bundle: fallback injection check passed.
- Archive: 10 files match the production build by SHA-256; `manifest.json` is at root.
- Store icon: PNG dimensions verified as 128×128.
- ZIP SHA-256: `12CC453F7C59161BCC1A4084D6DA36492E8C7F5DCE833640AB02609EFA456F31`.
- `git diff --check`: passed for the source and README changes.
- Independent security and architecture reviews: no findings in the submission-preparation changes.
- Credential-format scan of the staged repository: no matches.

The VM checks use mocked Chrome APIs. They do not replace testing in a running Chrome extension.

## Remaining work

1. Restore authorized browser control; the current browser API returned `Not allowed`.
2. Confirm the intended Google developer account and registration/payment status.
3. Run the reviewer steps in a Chrome test profile and capture real screenshots with demonstration data.
4. Upload the candidate ZIP, fill listing/privacy fields, and submit for review.

No Chrome Web Store item or store listing URL has been created in this session.
