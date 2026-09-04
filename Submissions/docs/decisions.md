# Decisions

## Decision 1

- **Chose:** Next.js with Supabase
- **Rejected:** A separate backend service
- **Why:** It was enough for the application requirements and kept the overall setup simpler.

## Decision 2

- **Chose:** PostgreSQL through Supabase
- **Rejected:** A separate database setup
- **Why:** It worked well with Supabase authentication and kept the data layer in one place.

## Decision 3

- **Chose:** Role-based permissions using BILLING_ADMIN and ACCOUNT_MANAGER
- **Rejected:** Giving all users the same access
- **Why:** Different users need different levels of access to subscriptions, invoices and administration.

## Decision 4

- **Chose:** Show the Alerts navigation item based on the user's role
- **Rejected:** Showing it to every user
- **Why:** Alerts are an administrative feature and should only be available to BILLING_ADMIN users.

## Decision 5

- **Chose:** Determine the Alerts visibility on the server and load the alert count separately
- **Rejected:** Checking the user's role inside the client-side Alerts component
- **Why:** The first approach caused a noticeable delay when the navigation loaded.

**Later reversed:** I initially used client-side role detection for the Alerts component. After testing it and noticing the delay, I changed it so the existing server-rendered pages pass the admin status directly to the navbar.