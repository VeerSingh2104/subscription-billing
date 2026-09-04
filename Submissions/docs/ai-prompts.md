# AI prompts

I used AI during the project mainly for help with UI changes, debugging and
figuring out better ways to implement some features. My usual process was to
ask about one specific thing, implement it, test it myself and then go back
with another prompt if something was not working properly.

## UI and visual design

### Prompt

I have an existing Next.js and Supabase subscription billing application.
Help me improve the UI and make it look modern, minimal and professional.
I want a finance style design with better spacing, typography, navigation and
some subtle glassmorphism without changing the existing functionality.

### What I got

The AI suggested changes to the navigation, dashboard layout, spacing,
borders, transparency and overall visual hierarchy.

### What I implemented and tested

I applied the changes to the frontend and tested the different pages including
the dashboard, subscriptions and invoices. I also checked how the layout
looked on different screen sizes.

The first version had a bit too much of the card and container look so I
refined it further and made the overall design cleaner with fewer boxes.

## Dark and light theme

### Prompt

Add persistent dark and light theme support to my existing Next.js application.
The selected theme should stay after navigation and refreshing the browser.
Do not change the backend, database, authentication or business logic.

### What I got

The AI suggested using localStorage to remember the selected theme and
initializing the theme early so that the wrong theme does not briefly appear
when the page loads.

### What I implemented and tested

I added the theme toggle and the theme initialization and then tested switching
between both themes, moving between pages and refreshing the browser.

The theme stayed persistent after refresh so I kept the implementation.

## Guided onboarding tour

### Prompt

Add a guided onboarding tour to the application which highlights the main
navigation items and important dashboard sections. Keep it frontend only and
do not change the backend or existing business logic.

### What I got

The AI suggested adding tour targets to the existing UI elements and creating
a reusable guided tour component.

### What I implemented and tested

I added the tour targets to the navbar and dashboard and tested it with the
different user roles.

Some elements needed to behave differently depending on the role so I adjusted
the tour targets and visibility to match what each user can actually access.

## Role based navigation

### Prompt

The Alerts navigation item should only be visible to BILLING_ADMIN users.
ACCOUNT_MANAGER users should not see it. The pages already know the user's
role so avoid unnecessary client side role detection.

### What I got

The AI suggested passing the user's role from the server rendered pages to the
navbar using an isAdmin prop.

### What I implemented and tested

I updated the navbar and the relevant pages and tested it using both the
Billing Admin and Account Manager accounts.

The Billing Admin could see Alerts and the Account Manager could not.

## One thing that did not work properly

### Prompt

Make the Alerts navigation item load its alert count and only show it to
Billing Admin users.

### What I got

The first implementation made the Alerts component check the user's role on
the client. It technically worked but there was a noticeable delay before
the navigation item appeared.

### What I implemented and tested

I implemented the first approach and tested the navbar. I noticed the delay
when loading the page and it did not feel right from a UI perspective.

I then asked AI to help remove the unnecessary client side role check.

### What I corrected

I changed it so the existing server rendered pages pass the role to the navbar
instead.

The navbar now receives

`isAdmin={profile.role === 'BILLING_ADMIN'}`

and immediately knows whether to show Alerts.

The Alerts component only loads the alert count in the background.

I tested this again with both roles and the delay was gone. The Billing Admin
still sees Alerts and the Account Manager does not.

## Dashboard

### Prompt

The dashboard has a placeholder section for Account Managers. Remove it while
keeping the Billing Admin administration section and the rest of the dashboard
functionality unchanged.

### What I got

The AI identified the conditional rendering responsible for the Account
Manager placeholder.

### What I implemented and tested

I removed the placeholder and tested the dashboard using both roles.

The Billing Admin still has the administration section while the Account
Manager sees the normal dashboard without the unused placeholder.

## Demo data

### Prompt

Create realistic demo data for the subscription billing application so a
reviewer can test multiple companies, account managers, subscriptions,
collaborators and different invoice statuses.

### What I got

The AI suggested demo companies, subscriptions with different billing cycles,
collaboration relationships and invoices with different statuses.

### What I implemented and tested

Before running the SQL I checked the actual database schema and enum values
so I would not be inserting data based on assumptions.

I then added the demo subscriptions, collaborators and invoices and checked
that they appeared correctly in the application.

I also tested the seeded data through the actual application instead of only
checking whether the SQL query succeeded.

## Debugging

### Prompt

I am getting an error after changing the invoices page to pass the user's role
to the navbar. Find the problem without changing the existing invoice
functionality.

### What I got

The AI found that the invoices page did not have a profile variable available
when the navbar was being rendered.

### What I implemented and tested

I added the profile role lookup to the server side page and passed the role to
the navbar.

I then tested the invoices page again and checked that the existing invoice
functionality still worked.

## Final review

### Prompt

Review the application before submission and point out anything I should
check or improve without inventing features that are not already implemented.

### What I got

The AI suggested checking role permissions, responsive behavior, loading and
error states, UI consistency and the submission documentation.

### What I implemented and tested

I went through the main application flows and tested both user roles. I also
checked the demo data and made the final UI and navigation refinements.

I kept the remaining improvements as future work instead of adding unnecessary
features right before submission.

## Overall process

My general process when using AI was pretty simple

1. Pick one specific problem or feature
2. Ask AI for an approach
3. Check the suggested code against my existing code
4. Implement it
5. Test it in the application
6. If something was wrong or could be better, ask another prompt
7. Make the correction and test it again

I mainly used AI as a development and debugging assistant. I still checked the
changes myself and tested them against the actual application before keeping
them.