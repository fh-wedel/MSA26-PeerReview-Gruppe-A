# web-ui Learnings

- **Vite Scaffolding:** Running `npm create vite@latest .` in an existing directory creates a nested `src/` folder with default templates. Ensure custom code is placed inside this generated structure, and `index.html` points to the correct entry point (e.g., `/src/main.tsx`).
- **MUI Date Pickers:** In newer versions of `@mui/x-date-pickers` (v9+), the `PickersDay` component has been removed/renamed to `PickerDay`.
- **MUI Layouts:** Due to versioning changes with MUI's `Grid` component (e.g., removal of the `item` prop), using `Box` with flexbox is often a more stable and predictable approach for simple layouts.