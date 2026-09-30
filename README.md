
# RefundAI

AI-assisted refund processing and customer support system.

RefundAI is a full-stack application for handling customer refund requests from submission through review and final status.

The system was built around a simple rule:

> The refund policy makes the business decision. AI provides additional analysis. Support handles anything that needs human review.

## Overview

A customer can select an account and order, submit a refund request, and immediately receive a refund reference.

The request is then checked against the configured refund policy. If the request is eligible, the system can use AI to analyse the customer's reason and identify anything suspicious or conflicting.

Support staff can review the request, see the policy result and AI analysis, and take action where necessary.

Customers can also come back later and enter their refund reference to see the latest status of their request.

The application does not process real payments. Approving a request changes the refund decision and audit state only.



## How the workflow works

The main flow is:


Customer submits refund request
              ↓
     Customer + order lookup
              ↓
       Refund policy check
              ↓
       ┌──────┴──────┐
       ↓             ↓
    DENIED        ELIGIBLE
       ↓             ↓
    DENIED       AI analysis
                     ↓
              ┌──────┴──────┐
              ↓             ↓
            SAFE       Suspicious /
              ↓         conflicting
           APPROVED          ↓
                         ESCALATED


The policy check always happens first.

AI does not override a policy denial. If the AI service is unavailable or the request cannot be safely analysed, the system escalates the request rather than automatically approving it.



## Refund rules

The seeded refund policy currently covers:

* Refunds requested within 30 days of the order
* Final-sale items are not eligible
* Damaged items can qualify for a refund
* Incorrect items can qualify for a refund
* Refunds above $500 require additional human review
* Suspicious or conflicting requests are escalated

These rules are enforced on the backend rather than relying on values sent by the frontend.

The project also includes several seeded orders that represent different refund scenarios, making it easier to test the workflow.



## AI integration

OpenAI is used as an assistance layer around the refund workflow.

Depending on the request, the AI layer can help with:

* Classifying the customer's refund reason
* Analysing the explanation provided by the customer
* Identifying suspicious or conflicting information
* Generating a customer-facing response
* Providing additional decision context for support staff

The AI result is not treated as the source of truth for the refund policy.

### AI fallback

The OpenAI API key supplied for the assessment currently has no available credits, so live AI responses may not be available during evaluation.

The application was designed to handle this rather than fail completely.

If the AI service cannot be used, the backend still applies the deterministic refund policy. Where AI assistance is required, the request is moved to escalation for human review.

This means an unavailable AI service cannot accidentally turn into an automatic refund approval.



## Customer experience

The customer interface provides a simple refund workflow.

A customer can:

* Select their account
* Select an order
* Enter the amount they want refunded
* Explain why they are requesting the refund
* Submit the request
* Receive a unique refund reference
* View the resulting status

Each request receives a reference similar to:


REF-602522938603


The reference can be used later to check the request again.

For example:


Customer submits request
        ↓
REF-602522938603
        ↓
Support reviews request
        ↓
Request status changes
        ↓
Customer enters reference
        ↓
Latest status is retrieved from the API


The status is retrieved from the backend, so it is not dependent on the customer's previous browser session.



## Support dashboard

The support side of the application provides a workspace for reviewing refund requests.

Support staff can see:

* Customer and order information
* Requested refund amount
* Customer's refund reason
* Automated policy decision
* AI analysis when available
* Current request status
* Decision history

Support can also:

* Approve a request
* Deny a request
* Escalate a request

The system keeps the automated policy result separate from the current operational status.

For example:


Policy decision: APPROVED
Current status: ESCALATED


This can happen when a request passes the automated policy but is later sent to support for additional review.


## Data and seed scenarios

The project includes synthetic data so the application can be run without manually creating records first.

The seed data contains:

* 15 customers
* 30 orders
* A configured refund policy
* Different order and refund scenarios

The scenarios include things such as damaged items, final-sale orders, older orders, high-value refunds, already-refunded orders and suspicious cases.

The seed process runs as its own Docker Compose service instead of running every time the backend starts.



## Tech stack

### Frontend

* React
* Vite
* Axios
* Lucide React
* CSS

### Backend

* Node.js
* Express
* MongoDB
* Mongoose
* OpenAI SDK
* Helmet
* CORS
* Morgan

### Infrastructure

* Docker
* Docker Compose
* Nginx


## Project structure


refund-ai-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── seed/
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   │
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── .env.example
└── README.md


The backend is separated into routes, controllers, services and models so that the refund workflow is not tied directly to the HTTP layer.



## Running the project

The easiest way to run the complete application is with Docker.

### Requirements

You only need:

* Docker Desktop
* Docker Compose

Create a `.env` file in the project root:

OPENAI_API_KEY=your_openai_api_key

MONGO_DATABASE=refundai
MONGO_HOST=mongodb


Then run:


docker compose up --build


Once the containers are running, open:


http://localhost:3000


The backend health endpoint is available at:


http://localhost:5000/api/health


It should return:


{
  "success": true,
  "message": "Refund AI API is running"
}


The Docker setup starts:

* MongoDB
* Backend API
* Frontend
* Database seed service

The seed service exits after the initial data has been inserted. This is expected.



## API

### Customers


GET /api/v1/customers

Returns the available synthetic customers.

### Orders


GET /api/v1/orders


Returns the available synthetic orders.

### Create refund request


POST /api/v1/refunds

Example:


{
  "customerId": "customer-id",
  "orderId": "order-id",
  "requestedAmount": 120,
  "reason": "The item arrived damaged."
}


### List refund requests


GET /api/v1/refunds

### Get a refund request


GET /api/v1/refunds/:requestId


The same endpoint is used by the customer reference lookup to retrieve the latest request status.

### Support actions

Approve:


POST /api/v1/refunds/:requestId/action/APPROVE


Deny:


POST /api/v1/refunds/:requestId/action/DENY


Escalate:

POST /api/v1/refunds/:requestId/action/ESCALATE




## Security and reliability

Customer-provided refund descriptions are treated as untrusted input.

In particular, text entered into the refund reason is not treated as an instruction to the AI system. This helps prevent a customer from using the refund description to manipulate the application's decision process.

The backend also uses:

* Helmet for common HTTP security headers
* CORS configuration
* Environment variables for secrets
* Request body limits
* Server-side refund policy enforcement
* Explicit refund states
* Controlled AI failure handling
* Support actions that are recorded separately from the automated policy result

The application follows a fail-safe approach around AI.

If AI fails, the system does not assume that the request is safe to approve.



## Some implementation decisions

### Policy and AI are separate

The refund policy is deterministic because business rules should not depend on an LLM response.

AI is useful for analysing natural-language explanations and identifying cases that deserve additional attention, but it is not responsible for enforcing the core refund rules.

### Human review is part of the workflow

Some requests should not be decided entirely by automation.

High-value, suspicious, conflicting or AI-unavailable cases can be escalated to support.

### No fake payment processing

There is no simulated payment-provider call hidden behind the approval button.

When support approves a request, the application records the decision and updates the request state.

A real production implementation would connect that action to a payment provider and would need additional protections such as idempotency and transaction handling.

### Seed data is intentionally separate

The database seed runs independently from the API server.

This keeps test-data creation separate from application startup and makes the setup easier to reason about.



## Production considerations

This project focuses on the refund workflow required for the assessment.

For a production deployment, I would add:

* Authentication and role-based authorization
* Rate limiting
* Payment-provider integration
* Idempotency for financial operations
* Email or SMS notifications
* Structured application logging
* Monitoring and alerting
* Automated unit and integration tests
* CI/CD
* Managed secrets
* More detailed audit events
* Stronger database and API validation

These are intentionally outside the current assessment scope.



## Current status

The complete workflow is containerized and can be started with Docker Compose.

The implemented flow is:


Customer
   ↓
Select customer + order
   ↓
Submit refund request
   ↓
Refund policy check
   ↓
AI assistance when available
   ↓
Decision / escalation
   ↓
Support review
   ↓
Reference tracking
   ↓
Customer checks latest status


The main focus of the implementation was keeping the business rules predictable while still making room for AI-assisted analysis.

The result is a small but complete refund support system that can run locally with a single Docker Compose command.

