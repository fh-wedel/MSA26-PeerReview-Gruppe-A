# web-ui Learnings

- **Vite Scaffolding:** Running `npm create vite@latest .` in an existing directory creates a nested `src/` folder with default templates. Ensure custom code is placed inside this generated structure, and `index.html` points to the correct entry point (e.g., `/src/main.tsx`).
- **MUI Date Pickers:** In newer versions of `@mui/x-date-pickers` (v9+), the `PickersDay` component has been removed/renamed to `PickerDay`.
- **MUI Layouts:** Due to versioning changes with MUI's `Grid` component (e.g., removal of the `item` prop), using `Box` with flexbox is often a more stable and predictable approach for simple layouts.
- **Submission routing coupling:** Submission detail navigation is split across `src/App.tsx`, `src/pages/MySubmissions.tsx`, and `src/components/Navbar.tsx`; when adding `/submissions/:submissionId`, the navbar must use `location.pathname.startsWith('/submissions')` or the active state breaks on detail pages.
- **Canonical submission URLs:** Submission detail routes should use the backend-facing submission UUID directly, not a derived slug. Keep `src/stubs/submissions.ts`, list-page navigation, and detail-page lookup aligned on the same ID.
- **Safe date rendering:** For submission timestamps, prefer `src/utils/date.ts` over raw `format(new Date(value))`; malformed or missing API values can otherwise throw during render.
- **UI verification command:** `npm run lint` currently covers both `src/` and `infra/` and may fail on unrelated baseline lint debt; for scoped frontend changes, `npm run build` is the reliable regression check unless lint cleanup is in scope.
- **Vite Proxy Configuration:** To mirror production AWS API Gateway routing, the Vite dev server must proxy `/api` requests to the local Spring Boot backend (e.g., `http://localhost:8080`) via `vite.config.ts`.
- **Frontend-Backend Plugin Name Coupling:** The frontend `SubmissionReviewMode` type and stubs must use the exact string identifiers returned by the backend workflow plugins (e.g., `double-blind`, not `double blind`).
- **MUI Snackbar Positioning:** To maintain consistency with the application's toast notification style, `Snackbar` components should use `anchorOrigin={{ vertical: 'top', horizontal: 'right' }}` and `sx={{ mt: 8 }}`.
