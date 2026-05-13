# Avatar Menu Modal Features

## Scope

This document describes all functions available from the navbar avatar menu modal.

Covered:
- Modal open/close behavior
- Menu item visibility rules
- Action routing
- Logout behavior

---

## Entry Conditions

Avatar menu modal is available only when `isLoggedIn === true`.

Navbar auth area then displays:
- user icon
- current username
- clickable profile button

---

## Open/Close Behavior

- Clicking avatar button toggles modal open/close.
- Clicking inside modal uses event stopPropagation to avoid accidental closure.
- Selecting a menu link closes modal before or during route navigation.

---

## Menu Items

### Profile
- Route: `/profile`
- Always shown for logged-in users.

### Administration (conditional)
- Route: `/administration`
- Shown only when `isAdmin` is true.

### Switch Account
- Route: `/switch-account`
- Always shown for logged-in users.

### Logout
- Route target link: `/login`
- Also triggers logout handler before navigation.

---

## Logout Action Details

Logout menu item executes parent `onLogout` callback, then closes modal.

Logout callback resets:
- login state
- email
- username
- admin flag
- auth-related localStorage values

After logout, UI returns to logged-out navbar state with Register/Login links.

---

## Admin Visibility Logic

Administration link appears only when both conditions are true:
- logged in
- admin flag true

Even if link is hidden, direct route access is still protected by route guard in app router.

---

## Related UX Notes

- Username is displayed beside avatar icon as quick identity indicator.
- Avatar button receives active style while menu is open.
- Menu provides account-focused actions only; public pages remain in main navbar links.
