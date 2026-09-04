# Architecture

## What are the moving pieces, and how do they talk to each other?

The application is built around Next.js and Supabase.

The main frontend is made using Next.js, React, TypeScript and Tailwind CSS.
The application uses a mix of server components and client components depending
on what each page needs.

Supabase handles authentication and provides the PostgreSQL database. The
application gets the currently logged in user through Supabase Auth and uses
the user's profile and role to determine what they are allowed to do.

The main data is stored in PostgreSQL. The important parts are profiles,
subscriptions, subscription collaborators and invoices. Subscriptions are
connected to their owners and collaborators, while invoices are connected to
subscriptions.

The dashboard reads subscription and invoice data and uses it to display
analytics and operational information.

The navbar is shared across the application. It receives information such as
the user's role from the page and uses that to show the appropriate navigation
items. For example, Alerts is only shown to BILLING_ADMIN users.

Vercel hosts the Next.js application while Supabase provides the authentication
and database services.

## Where does each piece run?

The Next.js application runs on Vercel.

The pages that need server side access run through Next.js server components
and server side logic. This is where authenticated user information and
database queries can be handled without exposing unnecessary logic to the
browser.

Client components run in the user's browser. These are mainly used for things
that need interaction, such as theme switching, navigation interactions,
guided tours, and invoice or subscription controls.

Supabase Auth and PostgreSQL run on Supabase.

The browser communicates with the deployed Next.js application, and the
application communicates with Supabase when it needs authentication or
database data.

## What is the request path for one representative user action, end to end?

A good example is an Account Manager creating a subscription.

First, the user logs into the application through the login page. Supabase
Authentication verifies the user's credentials and provides the authenticated
session.

When the user opens the subscriptions page, the application gets the
authenticated user and their profile. The profile contains their role, which
is used to determine what actions they can perform.

When the Account Manager submits the subscription form, the application checks
the relevant permissions and whether the user is allowed to create the
subscription.

The subscription data is then written to the PostgreSQL database through
Supabase.

The page can then read the updated subscription data and display the newly
created subscription to the user.

The same general pattern is used for invoices and other application actions.
The exact permissions depend on the user's role and, for Account Managers,
whether they own or collaborate on the relevant subscription.

## What did you decide not to build, and why?

I decided not to build a separate backend service or API server because the
application did not need one. Next.js server-side functionality together with
Supabase was enough for the requirements and kept the project simpler.

I also did not build a separate corporations table. The current application
treats the customer or company associated with a subscription as the
subscription's customer information. Adding another abstraction would have
made the data model more complicated without being necessary for the current
requirements.

I did not build a full payment gateway or real payment processing system
either. The application is focused on subscription and invoice management,
including invoice statuses, rather than actually charging customers.

I also did not add a large automated testing framework yet. The main workflows
were tested manually during development, while automated testing would be one
of the areas I would work on next.

Finally, I avoided adding unnecessary features just to make the application
larger. The focus was on completing the required subscription, invoice,
collaboration, role and dashboard workflows and making those workflows usable.