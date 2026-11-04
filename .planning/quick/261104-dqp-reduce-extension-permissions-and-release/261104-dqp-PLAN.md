# Reduce extension permissions and release 1.0.3

Date: 2026-11-04

The user approved removing automatic injection on all websites, keeping shortcut and popup search, opening an extension-owned search page on restricted pages, packaging version 1.0.3, and synchronizing GitHub. Chrome Web Store upload and review submission remain manual.

1. Replace manifest content scripts with packaged, user-triggered injection using activeTab and scripting. Verify that the production manifest has no host permissions or automatic content scripts.
2. Reuse the existing search component in an extension-owned page for restricted pages. Remove the Google redirect and the now-unused notifications permission.
3. Update versions and submission/privacy documentation. Run type checking, production build, and browser checks for first/repeated opening, shortcut/popup entry points, restricted-page fallback, search, filtering, and local records.
4. Review the changes, inspect the release ZIP against the build, commit and push the approved changes, and verify the remote commit and ZIP.

Existing stored records and the synchronization algorithm must remain unchanged. Browser checks use an isolated profile with synthetic records.
