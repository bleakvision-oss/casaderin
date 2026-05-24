# Manual Test Checklist

Use this checklist to validate baseline safety for the admin and public menu flows.

## Core Admin Flow
- [ ] **Admin login**: Sign in with valid admin credentials and confirm access to the admin dashboard.
- [ ] **Load menu**: Open the menu editor and verify existing menu data loads correctly.
- [ ] **Edit item**: Update an existing menu item (e.g., name, description, or price) and confirm the change appears in the editor.
- [ ] **Add item**: Create a new menu item and confirm it appears in the correct section/category.
- [ ] **Delete item**: Remove a menu item and verify it is no longer shown in the editor list.
- [ ] **Save**: Save all pending admin changes and confirm the save operation completes successfully.
- [ ] **Reload persistence**: Refresh/reopen the admin view after saving and confirm changes persist.

## Public Menu Validation
- [ ] **Public menu render**: Open the public menu page and verify all sections/items render without errors.
- [ ] **Language switching**: Toggle available languages and confirm translated content updates correctly.

## Analytics Validation
- [ ] **Analytics tracking**: Perform key public interactions and verify analytics events are recorded.
- [ ] **Analytics summary**: Open analytics reporting/summary view and verify new events are reflected.

## Data Safety Operations
- [ ] **Backup export/import**: Export a backup, then import/restore it in a safe test flow and confirm data integrity.

## Mobile Validation
- [ ] **Mobile admin**: Validate admin flows (login, edit, save) on a mobile viewport/device.
- [ ] **Mobile public menu**: Validate public menu rendering and language switching on a mobile viewport/device.

## Before Every Refactor PR
Before every refactor PR, run this checklist end-to-end and confirm all items pass.
