# Subscription Billing Platform

A full-stack subscription billing management application built with
**Next.js**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Features

### Authentication & Authorization

-   Supabase authentication
-   Protected application routes
-   Role-based access control
-   Billing Admin and Account Manager access separation
-   PostgreSQL Row Level Security (RLS)

### Subscription Management

-   View customer subscriptions
-   Subscription plans and billing cycles
-   Subscription ownership and collaborators
-   Archived subscription handling

### Invoice Management

-   Create invoices for existing subscriptions
-   Billing periods, amounts, and due dates
-   Controlled invoice status workflow
-   Invoice history and audit trail
-   Invoice notes
-   Role-based invoice visibility

### Invoice Status Workflow

``` text
DRAFT → ISSUED → PAID
  │        │
  └──────→ VOID
           │
        FINAL STATE

PAID = final
VOID = final
```

Invalid status transitions are validated server-side.

### Credit Notes

-   Billing Admins can issue credit notes
-   Credit amount cannot exceed the invoice amount
-   Credit note reason is required
-   Credit note issuance is recorded in invoice history

### Invoice PDF

-   Server-side invoice PDF generation
-   Download invoices directly from the invoice detail page
-   Dedicated API route for PDF generation

### Dashboard & Navigation

-   Dashboard with account and subscription overview
-   Application-wide navigation
-   Light/dark theme toggle
-   Sign-out functionality
-   Dedicated invoice detail pages

## Tech Stack

-   **Next.js 16**
-   **React 19**
-   **TypeScript**
-   **Tailwind CSS 4**
-   **Supabase**
    -   Authentication
    -   PostgreSQL
    -   Row Level Security
-   **pdf-lib** for invoice PDF generation

## Project Structure

``` text
src/
├── app/
│   ├── api/
│   │   └── invoices/
│   │       └── [id]/
│   │           └── pdf/
│   │               └── route.ts
│   ├── components/
│   │   ├── app-navbar.tsx
│   │   ├── logout-button.tsx
│   │   └── theme-toggle.tsx
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── admin-controls.tsx
│   │   │   ├── collaborator-control.tsx
│   │   │   ├── invoice-controls.tsx
│   │   │   ├── invoice-create-form.tsx
│   │   │   └── invoice-status-control.tsx
│   │   └── page.tsx
│   ├── invoices/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── credit-note-controls.tsx
│   │   │   ├── invoice-history.tsx
│   │   │   ├── invoice-notes.tsx
│   │   │   └── invoice-pdf-button.tsx
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── subscriptions/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── lib/
    └── supabase/
        ├── client.ts
        └── server.ts
```

## Database

The application uses PostgreSQL through Supabase.

Main entities include:

-   `profiles`
-   `subscriptions`
-   `subscription_collaborators`
-   `invoices`
-   `invoice_history`
-   `invoice_notes`
-   `credit_notes`

Invoice statuses:

``` text
DRAFT
ISSUED
PAID
VOID
```

Row Level Security policies control access based on authentication,
role, subscription ownership, and collaboration relationships.

## Getting Started

### 1. Clone the repository

``` bash
git clone <your-repository-url>
cd subscription-billing
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root:

``` env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the values from your Supabase project.

### 4. Start the development server

``` bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

``` bash
npm run dev
```

Starts the development server.

``` bash
npm run build
```

Creates a production build.

``` bash
npm run start
```

Starts the production server.

``` bash
npm run lint
```

Runs ESLint.

## Roles

### Billing Admin

Billing Admins can perform privileged billing operations such as:

-   Creating invoices
-   Updating invoice statuses
-   Issuing credit notes
-   Viewing invoices within the billing scope
-   Viewing invoice history

### Account Manager

Account Managers can access invoices and related information for
subscriptions they own or collaborate on, according to the database RLS
policies.

## Invoice PDF API

``` text
GET /api/invoices/[id]/pdf
```

Generates a PDF for the selected invoice.

## Audit Trail

Important billing actions are stored in `invoice_history`.

Examples:

-   `CREATED`
-   `STATUS_CHANGED`
-   `CREDIT_NOTE_ISSUED`

History records include the actor, invoice, status changes, additional
details, and timestamp.

## Security

The application uses multiple layers of authorization:

1.  Supabase authentication
2.  Server-side user verification
3.  Role-based access checks
4.  PostgreSQL Row Level Security
5.  Server-side invoice transition validation
6.  Server-side credit note validation
7.  Invoice audit logging

Authorization is not dependent solely on client-side UI restrictions.

## Future Improvements

-   Improved invoice PDF design
-   Invoice search and filtering
-   Pagination
-   Better inline form error handling
-   Credit-adjusted invoice totals
-   Email invoice delivery
-   Recurring invoice generation
-   Payment integration
-   Dashboard analytics
-   Automated tests
-   Production deployment and monitoring

## Author

**Veer**

Built as a full-stack subscription billing project demonstrating Next.js
App Router, TypeScript, Supabase, PostgreSQL, RLS, Server Actions, API
routes, role-based authorization, PDF generation, and audit logging.
