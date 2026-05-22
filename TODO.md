# TODO - AdminDashboard sidebar fix

- [ ] Fix TypeScript/JSX errors in `frontend/src/pages/admin/AdminDashboard.tsx` (currently broken JSX tags).
  - [ ] Ensure JSX tags are properly opened/closed so `npm run build` succeeds.
- [ ] Implement correct responsive layout:
  - [ ] Desktop (lg+): render `<Sidebar ... />`.
  - [ ] Mobile (<lg): render `<AdminDashboardMobile />` (no desktop sidebar).
- [ ] Ensure content uses `lg:ml-64` only on desktop so it aligns with the fixed sidebar.
- [ ] Run `npm run build` to confirm the project compiles.


