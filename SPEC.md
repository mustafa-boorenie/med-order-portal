ORDERING PORTAL FOR MEDICAL SUPPLIES AND PERISHABLES

1. Introduction & Objectives

The Medical Ordering Portal is an internal enterprise application for cash-pay medication and medical-supply orders. It enables clinicians and administrators to manage product catalogs, patient payments, inventory of perishables, and pharmacy orders in an intuitive, HIPAA-compliant fashion. 

Primary Objectives:

Streamline patient payment flows.

Provide doctors with a secure login to easily track inventory, order stock, and prescribe medications.

Offer administrators real-time visibility into stock, orders, payments, and key operational metrics.

Integrate with external pharmacy systems via FHIR or proprietary APIs to submit, track, and document medication orders.

2. Intended Values & Guiding Principles

Security & Compliance: 100% HIPAA adherence. PHI segregated from payment tokens is kept anyonymous and secure.

Usability & Accessibility: Intuitive UX for clinicians under time pressure. Mobile-responsive dashboards and easy to follow intents.

Scalability & Resilience: The service aims to be scalable and seamlessly quick with architecture aimed at ensuring 100% uptime.

Data-Driven Operations: Real-time analytics on inventory velocity, revenue, order fulfillment times; automated low-stock alerts.

Interoperability: Standard FHIR models for medication orders; pluggable connectors to multiple pharmacy vendors; extendable integration framework.

3. User Roles & Personas

Role

Description

Key Permissions

Doctor

Licensed clinician placing orders for patients; views patient history and order status.

Place/edit/cancel orders for own patients; view inventory; review payments.

Admin

Operations staff managing inventory, users, orders, and analytics.

CRUD on products; view/all orders and payments; user management; system logs.

Patient

End-user making cash payments for medications via a public interface.

Browse products; create order; complete payment; view own order statuses.

4. Key Use Cases

Patient Order Flow: Patient selects products → fills in personal info → pays via credit card/ACH → receives order confirmation.

Doctor-Assisted Order: Doctor logs in → accesses patient’s profile → selects items → submits order → patient payment link auto-generated.

Inventory Management: Admin views stock levels → adjusts quantities/manually enters lot expirations → configures reorder thresholds and notifications.

Admin Analytics: Admin reviews orders-per-day chart, revenue dashboard, low-stock report; exports CSV of monthly metrics.

Pharmacy Submission: System transforms order into FHIR MedicationRequest or vendor-specific payload → sends to configured pharmacy API → logs response and status.

5. Functional Requirements

Authentication & Authorization

OAuth2/OIDC login via Okta or Auth0 for doctors and admins; scoped tokens and role-based access control.

Public, unauthenticated patient checkout flow using a secure, time-limited token link.

Product Catalog & Inventory

CRUD on products: name, SKU, price, lot numbers, expiration dates, quantity on-hand, par levels.

Automatic low-stock email/SMS alerts (via a scheduler).

Order Management

Stateful orders: pending, paid, fulfilled, cancelled.

Order-item relationships; quantity validation against stock.

Payment integration with Stripe (tokenization only; no PHI in Stripe metadata).

Payment Processing

/payments/create-intent endpoint generating Stripe PaymentIntents.

Webhook handler for payment confirmation; transitions order to paid on success.

Admin Portal & Analytics

Dashboard: time-series charts (orders, revenue), inventory alerts, payment reconciliation.

Data table views: products, users, orders, payments; CSV export.

Pharmacy Integration Layer

Pluggable connectors supporting FHIR R4 MedicationRequest / MedicationDispense.

Configurable per-pharmacy credentials (API URLs, keys, message mapping).

Retry logic, logging of request/response payloads, error handling.

6. Non-Functional Requirements

Performance: API responses <200ms 95th percentile; CDN-cached assets.

Reliability: 99.9% uptime; database read replicas; multi-AZ failover.

Security: TLS everywhere; encryption at rest (AES-256); vulnerability scans; BAA in place with all vendors.

Maintainability: Monorepo with clear module boundaries; automated tests (unit, integration); CI/CD with lint, typecheck, test, deploy.

Compliance & Auditing: Immutable audit logs for all data changes; role-based access logs; quarterly compliance reports.

7. System Architecture

[Frontend (Next.js @ Vercel)] <--> [API Gateway / Edge Functions]
    ↕                         ↕
[Auth (Okta/OIDC)]         [Backend Services (NestJS / Express)]
                                ↕
                          [PostgreSQL (Amazon RDS)]
                                ↕
       [Pharmacy Connector Modules]    [Stripe Payment Service]

Monorepo: /frontend, /backend, /integrations, /scripts, /infra.

Communication: REST or tRPC between front & back; background jobs for inventory alerts & external API retries.

8. Data Model Overview

User: id, email, role, createdAt

Product: id, name, sku, priceCents, quantity, expirationDate, parLevel, createdAt

Order: id, patientName, patientEmail, doctorId, totalCents, status, createdAt

OrderItem: orderId, productId, quantity

Payment: id, orderId, stripePaymentIntentId, status, amountCents, createdAt

PharmacyLog: orderId, requestPayload, responsePayload, status, timestamp

9. Deployment & DevOps

Infra-as-Code: Terraform modules for AWS ECS cluster, RDS instance, IAM roles, S3 (for audit logs).

CI/CD: GitHub Actions or CircleCI pipelines for lint → test → build → deploy to Vercel (frontend) and ECS (backend).

Monitoring: CloudWatch metrics, DataDog dashboards, PagerDuty alerts for failures.
