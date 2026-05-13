# Navbar Pages and Navigation Features

## Scope

This document describes all pages and navigation behaviors exposed by the top navbar.

Covered:
- Brand and external links
- Static page links
- Auth-dependent links
- Route guards and redirect behavior

---

## Navbar Structure

Navbar contains:
- Brand title link: `RWC Living Atlas` -> `/`
- External CEREO link -> `https://cereo.wsu.edu/`
- Main navigation links
- Auth area (Register/Login OR avatar profile menu)

---

## Always-Visible Navbar Links

### Home
- Route: `/`
- Component: `Home`
- Purpose: main map workspace and all side panels.

### About
- Route: `/about`
- Component: `About`
- Purpose: project mission and overview text.

### Contact
- Route: `/contact`
- Component: `Contact`
- Purpose: address, phone, and email contact information.

### Updates
- Route: `/update-history`
- Component: `ChangelogHistory`
- Purpose: release history and feature changes by date.

### User Manual
- Route: `/user-manual`
- Component: `UserManual`
- Purpose: sectioned in-app documentation for all major features.

---

## Logged-Out Navbar Links

When user is not logged in, navbar shows:
- Register (`/signup`)
- Login (`/login`)

### Register Page
- Route: `/signup`
- Component: `Signup`
- Core functions:
  - request access form
  - desired access level selection
  - sponsor/message field
  - submit signup request and admin notification

### Login Page
- Route: `/login`
- Component: `Login`
- Core functions:
  - account login
  - auth state/localStorage persistence
  - admin flag resolution (including fallback role check)
  - auto redirect countdown to home after success
  - forgot-password request trigger

---

## Logged-In Navbar Auth Area

When user is logged in, Register/Login links are replaced with avatar + username entry.

Clicking the avatar entry opens profile modal menu (documented separately).

---

## Route Guards Relevant to Navbar Navigation

### Profile Guard
- `/profile` requires login
- unauthenticated users are redirected to `/login`

### Administration Guard
- `/administration` requires logged-in admin
- non-admin or logged-out users are redirected to `/login`

### Switch Account Guard
- `/switch-account` requires login
- otherwise redirected to `/login`

---

## Active Link Styling

Navbar applies active class for current route on main links.

Auth links (`/login`, `/signup`) also receive active style when selected.

---

## Auth State Persistence

App stores and restores auth state using localStorage:
- login flag
- email
- username
- admin flag
- auth storage version

Navbar rendering depends directly on this resolved auth state.

---

## 404 Handling

Unknown routes are handled by catch-all route and show `404 - Page Not Found`.
