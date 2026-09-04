# Submission

## Links

- **GitHub repository:** [https://github.com/VeerSingh2104/subscription-billing.git](https://github.com/VeerSingh2104/subscription-billing.git)
- **Live application:** [https://subscription-billing-alpha.vercel.app/](https://subscription-billing-alpha.vercel.app/)

## Notes for the reviewer

This is a subscription billing management application with role-based access for
BILLING_ADMIN and ACCOUNT_MANAGER users.

The application includes subscription management, invoice management, invoice
status tracking, credit notes, collaborators, alerts, dashboard analytics, and
role-based permissions.

The demo environment contains sample companies, subscriptions, and invoices so
the main workflows can be tested immediately.

Please use the demo credentials below when reviewing the application.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| BILLING_ADMIN | demo.admin@subscriptionbilling.com | DEMOADMIN123 |
| ACCOUNT_MANAGER | demo.manager@subscriptionbilling.com | DEMOMANAGER123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | Next.js, React, TypeScript, Tailwind CSS | Component-based UI with server/client rendering and a responsive interface |
| Backend | Next.js server-side logic, Supabase | Handles authentication, authorization, data access, and application workflows |
| Database | PostgreSQL via Supabase | Relational structure for users, subscriptions, collaborators, and invoices |
| Hosting | Vercel | Deployment and hosting for the Next.js application |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | User authentication | Done | Login and signup are implemented using Supabase Authentication |
| 2 | Role-based access control | Done | BILLING_ADMIN and ACCOUNT_MANAGER have different permissions |
| 3 | Subscription management | Done | Subscriptions can be created, viewed, edited, and archived |
| 4 | Subscription ownership and collaboration | Done | Account managers can work with subscriptions they own or collaborate on |
| 5 | Invoice management | Done | Invoices can be created and managed according to user permissions |
| 6 | Invoice status management | Done | Supports DRAFT, ISSUED, PAID, and VOID invoice states |
| 7 | Credit notes and invoice controls | Done | Billing administrators can manage invoice adjustments and related controls |
| 8 | Dashboard and analytics | Done | Dashboard provides subscription, invoice, revenue, and operational information |
| 9 | Alerts and administrative controls | Done | Billing administrators have access to alerts and administration features |
| 10 | Responsive and polished user interface | Done | Responsive navigation, dark/light theme support, guided onboarding, and modern UI styling |

## How much time did you actually spend?

More than 14 hours.

## What would you do next, with another 12 hours?

With another 12 hours, I would focus primarily on refinement and testing rather
than adding large new features.

- Add more automated tests for role-based permissions and billing workflows.
- Expand testing for edge cases around invoices, subscriptions, and collaborators.
- Improve loading, empty, and error states across the application.
- Perform a final accessibility review.
- Further optimize database queries and application performance.
- Add additional reporting and analytics where useful.
- Do a final consistency pass across spacing, typography, navigation, and responsive layouts.

## What are you least happy with in this codebase, and why?

The area I am least happy with is the complexity around role-based permissions
and billing workflows.

There are several different combinations of ownership, collaboration, user roles,
and invoice permissions that need to work correctly. This makes some parts of the
application more complex than I would ideally like.

I would also like to add more automated tests around these permission-sensitive
flows. The application has been tested manually during development, but a more
comprehensive automated test suite would make future changes safer and the
codebase easier to maintain.