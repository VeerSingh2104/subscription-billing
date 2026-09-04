# Plan

## How did you break the work into sessions?

I split the work into smaller sessions instead of trying to build everything at once. I started with the main application and database functionality, then worked on subscriptions and invoices. After the main workflows were working, I moved on to permissions, dashboard analytics and the remaining admin features. The later sessions were mostly focused on UI improvements, responsive design, theme support, onboarding and fixing issues I found while testing.

## What order did you build in, and why that order?

I started with authentication and the basic application structure because everything else depended on having a working user and role system. After that I worked on subscriptions, since invoices depend on subscriptions. Then I added invoice management and the different permissions around them. Once the core workflows were working, I built the dashboard and administrative features. I left most of the visual polish until later because I wanted the main functionality to be stable first.

## What did you estimate versus what it actually took?

I originally expected the project to take around 12 hours. It ended up taking more than 14 hours because I spent additional time testing different roles, fixing permission issues, refining the UI and going back over some of the navigation and user experience. A few issues that looked small initially also took longer once I tested them in the actual application.

## What did you cut when you ran short?

I mainly cut things that were useful but not necessary for the core requirements. I did not add a full automated test suite, advanced reporting, a payment gateway or additional billing features. I also kept some of the analytics and error-state improvements as future work. I preferred to make the existing workflows work properly and spend the remaining time on testing and UI polish rather than adding more features that would not be fully finished.