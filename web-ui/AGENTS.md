# web-ui Learnings

- **Vite Scaffolding:** Running `npm create vite@latest .` in an existing directory creates a nested `src/` folder with default templates. Ensure custom code is placed inside this generated structure, and `index.html` points to the correct entry point (e.g., `/src/main.tsx`).
- **MUI Date Pickers:** In newer versions of `@mui/x-date-pickers` (v9+), the `PickersDay` component has been removed/renamed to `PickerDay`.
- **MUI Layouts:** Due to versioning changes with MUI's `Grid` component (e.g., removal of the `item` prop), using `Box` with flexbox is often a more stable and predictable approach for simple layouts.
- **Submission routing coupling:** Submission detail navigation is split across `src/App.tsx`, `src/pages/MySubmissions.tsx`, and `src/components/Navbar.tsx`; when adding `/submissions/:submissionId`, the navbar must use `location.pathname.startsWith('/submissions')` or the active state breaks on detail pages.
- **Canonical submission URLs:** Submission detail routes should use the backend-facing submission UUID directly, not a derived slug. Keep `src/stubs/submissions.ts`, list-page navigation, and detail-page lookup aligned on the same ID.
- **Safe date rendering:** For submission timestamps, prefer `src/utils/date.ts` over raw `format(new Date(value))`; malformed or missing API values can otherwise throw during render.
