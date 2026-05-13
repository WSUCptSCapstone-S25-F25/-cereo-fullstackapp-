# Avatar-Accessible Pages: Profile, Administration, and Switch Account

## Scope

This document describes page-level functions reachable through avatar menu entries.

Covered pages:
- Profile (`/profile`)
- Administration (`/administration`, admin only)
- Switch Account (`/switch-account`)

---

## Profile Page Features

Route: `/profile` (login required)

### Account Info and Editing
- display username and email
- edit mode for username
- save/cancel profile editing workflow

### Bio Management
- fetch existing bio by email
- edit bio with character limit
- persist bio updates to backend

### Profile Image
- fetch existing profile image
- choose new image in edit mode
- upload selected image to backend
- preview selected image before save

### Additional Actions
- invite new user (opens `Register` flow inside profile page)
- change password form (new password + confirm)
- password reset request endpoint support is present in page logic

### Feedback
- shows success/error status message for profile operations.

---

## Administration Page Features

Route: `/administration` (logged-in admin required)

### Tabbed Sections
- Statistics (placeholder)
- Manage Users
- Sign Up Requests

### Manage Users
- fetch user list
- sortable columns (name, date joined)
- online/offline status display
- last online timestamp display
- role badge display

### Role Change Flow
- open role modal for selected user
- choose regular/admin role
- typed confirmation required (`Confirm`)
- apply role update and refresh list

### Delete User Flow
- open delete modal for selected non-admin user
- typed confirmation required (`Confirm`)
- delete user and refresh list

### Sign Up Requests
- fetch pending requests
- approve request (create account + role assignment if requested)
- deny request
- refresh pending list after actions

---

## Switch Account Page Features

Route: `/switch-account` (login required)

### Saved Accounts
- load saved accounts from localStorage
- identify and display current account
- list other switchable accounts

### Switch Flow
- select another saved account
- validate account by backend login lookup
- update auth state, user info, admin flag
- persist switched account state to localStorage
- redirect to home on success

### Expired/Invalid Saved Account Handling
- on failed switch, invalid account is removed from saved list
- user receives error/session-expired feedback

### Add Account Shortcut
- "Add account" entry redirects to login page.

### Sign Out Shortcut
- sign-out action clears auth state/localStorage
- redirects to login page.

---

## Route Protection Summary

These avatar-accessible pages are all protected:
- Profile and Switch Account require login
- Administration requires login + admin role

Unauthorized access is redirected to login route.
