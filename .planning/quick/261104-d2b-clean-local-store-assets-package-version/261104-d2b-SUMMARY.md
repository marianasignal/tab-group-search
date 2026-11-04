# Version 1.0.2 packaging cleanup

Date: 2026-11-04

Implementation commit: `eebdea3`.

## Result

- Preserved both screenshots, both candidate icons, and the 1.0.1 ZIP under `.local-store-assets/`; hashes match their original files.
- Added the local-only directory to `.gitignore`. None of its files are tracked.
- `public/` now contains only the three accepted runtime icons.
- Updated manifest, package metadata, privacy-policy version, and submission documentation to 1.0.2.
- Created `tab-group-search-webstore-1.0.2.zip` and updated `dist.zip` with identical contents.

## Verification

- `npm run typecheck`: passed.
- `npm run build`: passed; 37 modules transformed. Existing Browserslist data-age warning remains.
- Baseline archive check reproduced four unwanted files in 1.0.1.
- New archive contains exactly ten runtime files, with `manifest.json` at root and version 1.0.2.
- Every ZIP entry matches the build by SHA-256; bundled icons also match their source files.
- Archive size decreased from 958354 to 83636 bytes.
- Archive SHA-256: `FB495027E9BD48B8CCD298FBCC84AC9B83AD3B73C32A378F0A2839ABC565AB35`.
- Staged diff and credential-format scan passed; no local store assets or 1.0.1 archive staged.
- Deep release review: security and architecture reviewers found no introduced issues.

## Store follow-up

The user reports 1.0.1 was uploaded to Chrome Web Store. Upload of 1.0.2, submission for review, and approval are not confirmed. Use the new ZIP to replace the old package in the existing store item.
