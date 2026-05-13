# Authentication, Signup, and Password Reset

## Scope

This document describes authentication and account recovery features.

Covered:
- Login workflow
- Saved account handling
- Signup request workflow
- Password recovery and reset flows

---

## Login Workflow

Route: `/login`
Component: `Login`
Backend endpoint: `GET /profileAccount`

### Input and validation
- Requires email and password input
- On submit, calls `/profileAccount` with query params

### Success path
- Extracts account info from response
- Resolves admin flag with normalization logic
- If needed, fetches role fallback via `GET /userRole`
- Updates app auth state: logged-in flag, username, email, admin flag
- Persists state into localStorage
- Stores account in `savedAccounts` for switch-account feature (deduplicated by email)
- Shows success message and starts redirect countdown to Home

### Failure path
- Invalid credentials show error message
- Network/server errors show fallback error message

---

## Saved Accounts and Session Persistence

Login writes or updates localStorage keys used across app:
- `isLoggedIn`
- `email`
- `username`
- `isAdmin`
- `savedAccounts`

These values support:
- route protection decisions
- navbar avatar state
- switch-account fast login flow

---

## Signup Request Workflow

Route: `/signup`
Component: `Signup`

### Form behavior
- Collects name, email, password
- Collects sponsor or request message
- Collects desired access level (regular or admin)

### Validation behavior
- Requires non-empty required fields before submit

### Submission flow
1. Build multipart form payload
2. POST to `/uploadSignup`
3. On success, trigger notification via `/sendSignupNotification`
4. Show success/failure feedback to user

Signup does not directly create active login accounts. Requests are reviewed in Administration.

---

## Forgot Password and Reset

### Forgot password request (login/profile entry points)
Endpoint: `POST /forgot-password`

- User provides account email
- Backend sends password recovery email
- UI shows success/error message

### Reset password page
Route: `/reset-password`
Component: `Reset`
Endpoint: `POST /reset-password`

Behavior:
- Reads `email` from URL query string
- Requires new password and confirm password
- Enforces matching password fields
- Enforces minimum length (6)
- On success shows completion message
- On failure shows backend or fallback error

---

## Admin Approval Dependency

Accounts created via signup request become active only after admin review in Administration Sign Up Requests tab.

Admin approval path:
- create account (`/uploadAccount`)
- optionally set admin role (`/edit_user_role`)
- remove pending request (`/deny_request`)
