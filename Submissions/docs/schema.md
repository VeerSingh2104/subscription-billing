# Schema

## Table by table: what columns and types does each one have?

### profiles

- `id` — UUID
- `full_name` — text
- `role` — user-defined enum
- `created_at` — timestamp with time zone
- `updated_at` — timestamp with time zone

This table stores the application user's basic information and their role.

### subscriptions

- `id` — UUID
- `customer_name` — text
- `billing_email` — text
- `plan_name` — text
- `billing_cycle` — user-defined enum
- `price` — numeric
- `start_date` — date
- `owner_id` — UUID
- `is_archived` — boolean
- `created_at` — timestamp with time zone
- `updated_at` — timestamp with time zone

This is the main subscription table.

### subscription_collaborators

- `subscription_id` — UUID
- `user_id` — UUID
- `added_at` — timestamp with time zone

This table connects users with subscriptions they collaborate on.

### invoices

- `id` — UUID
- `subscription_id` — UUID
- `billing_period_start` — date
- `billing_period_end` — date
- `amount` — numeric
- `due_date` — date
- `status` — user-defined enum
- `void_reason` — text
- `created_at` — timestamp with time zone
- `updated_at` — timestamp with time zone

This table stores invoices generated for subscriptions.

## Which relationships are one-to-many, and which are many-to-many?

A user can own multiple subscriptions, so `profiles` to `subscriptions` is one-to-many. A subscription can have multiple invoices, so `subscriptions` to `invoices` is also one-to-many. Users and subscriptions have a many-to-many relationship for collaboration. A user can collaborate on multiple subscriptions and a subscription can have multiple collaborators. The `subscription_collaborators` table handles this relationship.

## Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

The database handles basic data integrity such as required fields, UUID relationships, default values and enum values. Foreign keys also make sure that related records point to valid users or subscriptions. Application code handles permissions and business rules. For example, an ACCOUNT_MANAGER can only work with subscriptions they own or collaborate on, while BILLING_ADMIN has broader access. I kept the basic data integrity in the database and the role-specific application behaviour in the code because those rules are easier to express and change at the application level.

## What did you deliberately denormalise?

I deliberately kept `customer_name` and `billing_email` directly on the `subscriptions` table instead of creating another customer or corporation table. For this project, that information is only needed as part of the subscription workflow. Adding another table would have increased the complexity without providing much benefit for the current requirements.

## What would break first if this had 100x the data?

The first problems would probably be around database query performance and dashboard analytics rather than the basic data model. Queries that calculate invoice and subscription statistics would need proper indexes and possibly more efficient aggregation. Large invoice lists and dashboard queries would also need pagination instead of loading too much data at once. At that scale I would also look at query patterns, indexing, caching and possibly precomputed analytics rather than changing the core schema immediately.