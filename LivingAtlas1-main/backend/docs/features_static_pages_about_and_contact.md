# Static Pages: About and Contact

## Scope

This document describes static informational pages exposed in the navbar.

Covered:
- About page
- Contact page
- Navigation characteristics

---

## About Page

Route: `/about`
Component: `About`

### Purpose
Provides high-level background and context for the Living Atlas project.

### Behavior
- Read-only informational content
- No authentication requirement
- No form submission or state mutation

---

## Contact Page

Route: `/contact`
Component: `Contact`

### Purpose
Provides communication and support contact details.

### Behavior
- Read-only informational content
- No authentication requirement
- No backend write operations

---

## Navigation Notes

Both pages are:
- directly accessible from top navbar
- available to logged-in and logged-out users
- part of global app navigation shell
