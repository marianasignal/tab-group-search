# Published store installation entry

Date: 2026-11-05

Verified the public Chrome Web Store listing at:
`https://chromewebstore.google.com/detail/fdkkfaokcpdgclionojiliblbacphljl`

The official page identifies the product as 标签组检索插件 - Tab Group Search and shows version 1.0.3.

## Changes

- Added a prominent installation link immediately below the README title.
- Added store installation instructions before the existing source installation instructions.
- Updated the current store submission status and project activity record to reflect verified publication.

## Verification

- Both README installation links match the verified official listing and its 32-character extension ID.
- The displayed version matches `src/manifest.json`.
- `git diff --check` and `npm run typecheck` passed.
- The 1.0.3 ZIP retains SHA-256 `3027039915DA2A3C4F5CCB66C977E0B7984E9B2C3CAF308E734300FB575A105C`.
- Quick documentation review: on target; no unresolved findings; no specialist review required.
