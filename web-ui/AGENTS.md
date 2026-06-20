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
- **API Client Generation:** The environment lacks a Java Runtime, blocking standard `openapi-generator-cli`. Use `swagger-typescript-api` (configured in npm scripts) to generate API clients from backend OpenAPI JSON specs.
- **Missing JSON Parsing in Generated API:** If a backend OpenAPI spec lacks a `content` schema, `swagger-typescript-api` will return the raw Response object instead of parsed `.data`. Explicitly pass `{ format: 'json' }` to generated client methods (e.g. `configApiClient.getRoot({ format: 'json' })`) to force parsing.
- **Duplicate API Calls in Dev:** `React.StrictMode` in `main.tsx` intentionally fires `useEffect` hooks twice. If this clutters the network tab during local debugging, temporarily remove the `<React.StrictMode>` wrapper.
- **MUI Typography `fontWeight` Bug:** Passing `fontWeight` as a top-level prop to `<Typography>` triggers confusing TypeScript errors ("No overload matches this call"). Always place it inside the `sx` prop (`sx={{ fontWeight: 600 }}`).
- **TypeScript `verbatimModuleSyntax`:** Because this is enabled in the TS config, all imported types/interfaces must
  strictly use the `type` keyword (e.g., `import { type Foo }`). Normal type imports will fail the `tsc -b` build.
- **Role-Based Access Control:** User roles are extracted from the `cognito:groups` claim in the JWT by
  `AuthContext.tsx`. They are mapped to lowercase strings (e.g., `'admin'`) and used for frontend access control.
- **API Generation Script Maintenance:** When consuming a new backend service API, you must manually add its OpenAPI
  JSON path to a new `generate:api:<service>` script in `package.json` to include it in the generation process.
- **API Client Interceptors:** OpenAPI generated clients (`swagger-typescript-api`) accept a `customFetch` option in
  their `ApiConfig`. Use this to inject global HTTP logic like JWT token refresh interceptors.
- **Frontend Fetch Standards:** Exclusively use the OpenAPI generated API clients. Refactor any legacy raw `fetch()`
  calls in hooks/components to use the corresponding generated API client.
- **Silent 403s on Refresh:** When refreshing Cognito tokens on a 403 error, explicitly update `sessionStorage` with the
  new tokens and retry the request within the interceptor. Decouple this from `AuthContext` to prevent circular
  dependencies.
