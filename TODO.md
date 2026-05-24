# TODO - Mobile BottomNavigation + Hide Sidebar

## Step 1
- Identify which admin/hr pages render these modules (employees, hubs, edit requests, leave requests, access control, attendance, payroll, activity logs, security alerts).

## Step 2
- Update shared panels:
  - `frontend/src/components/EditRequestsManagementPanel.tsx`
  - `frontend/src/components/LeaveRequestsPanel.tsx`
  to render `<BottomNavigation />` and hide sidebar on mobile (desktop only sidebar).

## Step 3
- Update admin page wrappers so sidebar is desktop-only and `<BottomNavigation />` renders:
  - `frontend/src/pages/admin/AdminEmployeesPage.tsx`
  - `frontend/src/pages/admin/AdminHubsPage.tsx`
  - `frontend/src/pages/admin/AccessControlPage.tsx`
  - `frontend/src/pages/admin/AttendancePage.tsx`
  - `frontend/src/pages/admin/PayslipPage.tsx`
  - `frontend/src/pages/admin/ActivityLogsPage.tsx`
  - `frontend/src/pages/admin/SecurityAlertsPage.tsx`

## Step 4
- Update HR wrapper pages to ensure mobile behavior (many HR pages simply re-export admin pages; verify which ones require changes):
  - `frontend/src/pages/hr/HrEmployeesPage.tsx`
  - `frontend/src/pages/hr/HrHubsPage.tsx`
  - `frontend/src/pages/hr/HrAccessControlPage.tsx`
  - `frontend/src/pages/hr/HrAttendancePage.tsx`
  - `frontend/src/pages/hr/HrPayslipPage.tsx`
  - `frontend/src/pages/hr/HrActivityLogsPage.tsx`
  - `frontend/src/pages/hr/HrSecurityAlertsPage.tsx`
  - plus any single-page request detail screens if needed.

## Step 5
- Run `npm run build` (or `npm run typecheck` if available) in `frontend/` to ensure TS compiles.

## Step 6
- Quick manual check:
  - On mobile width, sidebar is hidden and bottom navigation is visible.
  - Ensure routes navigate properly for Admin + HR.

