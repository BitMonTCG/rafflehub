# BitMon Raffle Hub

This project implements a web application for raffling Pokemon cards. Users can buy raffle tickets for a chance to win the right to purchase a featured rare Pokemon card at a significant discount.

## Project Overview

Based on the initial prompt and codebase structure, the application aims to provide:

*   **Raffle System:** Sell a fixed number of tickets (e.g., 100) for $1 each. Once sold out, a winner is randomly selected.
*   **Prize:** The winner gets an exclusive opportunity to buy the card at 50% off its estimated retail value.
*   **User Interface:** Displays active raffles, ticket counts, time remaining (if applicable), card details (value, discounted price), and potentially a marketplace listing.
*   **Visuals:** Intended to feature premium card displays, zoom functionality, and animations.
*   **Payments:** Integration with BTCPay Server for handling payments (likely for ticket purchases).
*   **Winner Notifications:** Automatically notifies winners via email when they've won a raffle.

## Architecture

The project is structured as a monorepo with distinct client, server, and shared components:

*   **`client/`**: Contains the frontend code.
    *   **Framework**: React with Vite
    *   **Routing**: `wouter`
    *   **UI Components**: Shadcn UI built upon Radix UI and styled with Tailwind CSS.
    *   **State Management/Data Fetching**: TanStack Query (`@tanstack/react-query`)
    *   **Key Files**:
        *   `client/src/hooks/useRaffles.ts`: Raffle management hooks
        *   `client/src/hooks/useTicket.ts`: Ticket purchase and management hooks
        *   `client/src/components/raffle/RaffleCard.tsx`: Raffle display component
        *   `client/src/components/raffle/PurchaseTicketModal.tsx`: Ticket purchase UI
        *   `client/src/components/raffle/CardViewModal.tsx`: Card detail view
        *   `client/src/contexts/AuthContext.tsx`: Authentication context

*   **`server/`**: Contains the backend API and logic.
    *   **Framework**: Express.js
    *   **Database**: PostgreSQL (production) / SQLite (local development) accessed via Drizzle ORM.
    *   **Payments**: Integration with BTCPay Server using `btcpay-greenfield-node-client`.
    *   **Notifications**: Email notifications using Nodemailer.
    *   **Core Files**:
        *   `server/index.ts`: Server entry point, middleware setup, initialization.
        *   `server/routes.ts`: Defines API endpoints for raffles, tickets, users, and winners.
        *   `server/db.ts`: Database connection and schema configuration.
        *   `server/storage.ts`: Database operations and business logic.
        *   `server/DatabaseStorage.ts`: Storage interface implementation.
        *   `server/btcpayService.ts`: BTCPay Server integration.
        *   `server/btcpayDirectService.ts`: Direct BTCPay Server API interactions.
        *   `server/emailService.ts`: Email notification service for winners.

*   **`shared/`**: Contains code shared between the client and server.
    *   **Key Files**:
        *   `shared/schema.ts`: Database schema definitions using Drizzle ORM.
        *   `shared/types.ts`: TypeScript type definitions shared across client and server.

## Key Technologies

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query, Wouter
*   **Backend**: Node.js, Express.js, TypeScript
*   **Database**: PostgreSQL (production), SQLite (local development), Drizzle ORM
*   **Payments**: BTCPay Server
*   **Notifications**: Nodemailer
*   **Testing**: Vitest, Testing Library, Supertest, MSW

## Configuration Files

*   **Environment & Build**:
    *   `package.json`: Project dependencies and scripts
    *   `tsconfig.json`: TypeScript configuration
    *   `vite.config.ts`: Vite build configuration
    *   `.env`: Environment variables template
        ```env
        NODE_ENV=development
        DATABASE_URL=
        BTCPAY_PAIRING_CODE=
        BTCPAY_WEBHOOK_SECRET=
        BTCPAY_STORE_ID=
        BASE_URL=http://localhost:5000
        
        # Email Configuration (for winner notifications)
        EMAIL_HOST=smtp.example.com
        EMAIL_PORT=587
        EMAIL_SECURE=false
        EMAIL_USER=your_email@example.com
        EMAIL_PASSWORD=your_password
        EMAIL_FROM=BitMon Raffle Hub <noreply@bitmonraffles.com>
        ```

*   **Database**:
    *   `drizzle.config.ts`: Drizzle ORM configuration
    *   `migrations/`: Database migration files
    *   `schema.pg.ts`: PostgreSQL schema (production)
    *   `schema.sqlite.ts`: SQLite schema (development)

## Development Setup

1.  **Environment Configuration**:
    *   Create a `.env` file in the project root
    *   Required environment variables:
        *   `NODE_ENV`: Set to "development" for local development
        *   `DATABASE_URL`: Database connection string
        *   `BTCPAY_PAIRING_CODE`: BTCPay Server pairing code (optional for development)
        *   `EMAIL_HOST`, `EMAIL_PORT`, etc.: SMTP server details for winner notifications

2.  **Database Setup**:
    *   Development uses SQLite by default
    *   Database file: `sqlite.db` (automatically created)
    *   Sample data is initialized on first run

3.  **Running the Development Server**:
    ```bash
    npm run dev
    ```
    *   Server runs on port 5000
    *   Includes hot module reloading for frontend
    *   Automatic TypeScript compilation with `tsx`

4.  **API Endpoints**:
    *   Raffles: `/api/raffles`
    *   Tickets: `/api/tickets`
    *   Users: `/api/users`
    *   Winners: `/api/winners`
    *   Stats: `/api/stats`

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Database Setup**:
    *   **Local Development**: The application is configured to use a local SQLite database file (`sqlite.db` in the project root) when `NODE_ENV` is not set to `production`. Drizzle will automatically create and manage this file.
    *   **Production (PostgreSQL)**: Ensure you have PostgreSQL running and configure the `DATABASE_URL` environment variable (check `server/db.ts`).
    *   Apply database schema (creates/updates `sqlite.db` locally):
        ```bash
        npm run db:push
        ```
3.  **Environment Variables**:
    *   Set up necessary environment variables for database connection, BTCPay Server credentials, email configuration, etc.
    *   For email notifications to work, make sure to configure the email-related variables.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    This will start the backend server and the Vite development server for the frontend, typically accessible at `http://localhost:5000`.
5.  **Build for Production**:
    ```bash
    npm run build
    ```
6.  **Run Production Server**:
    ```bash
    npm run start
    ```

## Testing

The project uses Vitest as the primary testing framework, along with Testing Library for React component testing, Supertest for API testing, and MSW for mocking API requests.

### Testing Architecture

The test suite is organized into three main categories:

1. **Client Tests** (`tests/client/`): Tests for React components and hooks using Testing Library and MSW for API mocking.
2. **Server Tests** (`tests/server/`): Unit tests for server-side logic, focusing on the storage layer and business logic.
3. **Integration Tests** (`tests/integration/`): End-to-end tests for API endpoints using Supertest to make actual HTTP requests to the Express server.

### Running Tests

You can run the test suite using the following npm scripts:

```bash
# Run all tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with UI for visual inspection
npm run test:ui

# Generate test coverage report
npm run test:coverage
```

### Key Test Files

- **Client Tests**:
  - `tests/client/RaffleCard.test.tsx`: Tests for the RaffleCard component
  - `tests/client/useRaffles.test.ts`: Tests for the raffle-related hooks

- **Server Tests**:
  - `tests/server/storage.test.ts`: Tests for the storage layer, focusing on raffle and winner functionality

- **Integration Tests**:
  - `tests/integration/raffle-api.test.ts`: Tests for the raffle API endpoints

### Implemented Tests

#### Client Component Tests
The `RaffleCard.test.tsx` file tests the RaffleCard component with the following test cases:
- Rendering of raffle information (title, price, rarity, etc.)
- Ticket purchase button behavior
- "Sold Out" display when all tickets are sold
- "Raffle Ended" display when a raffle is inactive
- Processing state during ticket purchase
- Modal opening for the card view

#### Client Hook Tests
The `useRaffles.test.ts` file tests the raffle-related hooks with the following test cases:
- `useRaffles`: Fetching active and all raffles
- `useCreateRaffle`: Creating new raffles and handling errors
- `useUpdateRaffle`: Updating existing raffles and verifying query invalidation

#### Server Logic Tests
The `storage.test.ts` file tests the storage layer with the following test cases:
- Retrieving raffles by ID
- Ending raffles and selecting winners
- Handling of active/inactive raffle states
- Selection of winners only from paid tickets
- Winner notification process

#### Integration Tests
The `raffle-api.test.ts` file tests the API endpoints with the following test cases:
- GET /api/raffles: Fetching all raffles and filtering active ones
- GET /api/raffles/:id: Retrieving a specific raffle
- POST /api/raffles: Creating new raffles with authentication and authorization
- POST /api/raffles/:id/end: Ending raffles and selecting winners

### Test Setup

The tests use the following setup:

- **Vitest Configuration**: Defined in `vitest.config.ts`
- **Test Environment**: JSDOM for client tests, Node for server tests
- **Global Setup**: Defined in `tests/setup.ts`, includes MSW setup for API mocking
- **Mock Data**: Each test file includes its own mock data for testing specific functionality

### Adding New Tests

When adding new tests:

1. Follow the existing structure to maintain organization
2. Place client component/hook tests in `tests/client/`
3. Place server logic tests in `tests/server/`
4. Place API endpoint tests in `tests/integration/`
5. Use descriptive test names following the pattern: "it should [expected behavior]"

## Winner Notification System

The application includes an automatic winner notification system that sends emails to raffle winners when a raffle ends and a winner is selected.

### Features:

- **Automatic Emails**: When a raffle ends and a winner is selected, the system automatically sends a congratulatory email to the winner.
- **Winner Details**: The email includes information about the won card, the original price, the discounted winner price, and instructions for claiming the prize.
- **Claim Link**: A direct link to claim the prize is included in the email.

### Implementation:

1. **Email Service**: Utilizes Nodemailer to send emails through a configured SMTP server.
2. **Template**: A responsive HTML email template with a professional design that matches the app's branding.
3. **Integration**: Integrated with the raffle ending process to ensure winners are notified immediately.

### Configuration:

To enable winner notifications, set the following environment variables:
```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_password
EMAIL_FROM=BitMon Raffle Hub <noreply@bitmonraffles.com>
```

## Notes

*   The implementation details for fetching Pokemon card information (e.g., names, images, retail values) are not immediately apparent from the file structure and may need further investigation or implementation.
*   The exact payment flow using BTCPay Server should be reviewed in `server/btcpayService.ts` and `server/routes.ts`.

## TODO / Future Development

Based on the project overview and current structure, the following areas need development or further investigation:

*   [x] **Pokemon Card Data Integration**: Implement the logic to fetch and display detailed Pokemon card information (names, images, estimated retail values) for the raffles. *(Analysis: Core fetching and integration into admin form seems complete via `pokemonAPI.ts`)*
*   [x] **Payment Flow Implementation**: Fully implement and test the BTCPay Server integration for purchasing raffle tickets, ensuring the flow is robust and handles potential errors. Review and finalize logic in `server/btcpayService.ts` and `server/routes.ts`. *(Analysis: Invoice creation, webhook handling, and ticket status updates appear implemented.)*
*   [~] **User Authentication**: Implement a user authentication system if required (e.g., for tracking purchases, managing user profiles). `client/src/contexts/AuthContext.tsx` exists but implementation status is unclear. *(Analysis: Backend API routes for register, login, logout (`/api/register`, `/api/login`, `/api/logout`, `/api/user/me`) are implemented in `server/routes.ts`. Missing frontend UI components and `AuthContext` logic for calling APIs and managing user state.)*
*   [x] **Winner Selection Logic**: Finalize and test the backend logic for randomly selecting a winner once all tickets are sold. *(Analysis: `endRaffle` function in storage and corresponding API route exist and implement random selection from paid tickets.)*
*   [x] **Winner Notification**: Implement a system to notify the winner (e.g., via email, in-app notification). *(Analysis: Implemented email notifications using Nodemailer with HTML templates.)*
*   [~] **UI Enhancements**: Implement the planned visual features like premium card displays, zoom functionality, and animations mentioned in the overview. *(Analysis: Animations implemented with `framer-motion` and custom CSS/JS effects. No dedicated zoom feature found.)*
*   [x] **Testing**: Add comprehensive unit and integration tests for both the client and server components to ensure reliability. *(Analysis: Tests have been created using Vitest, Testing Library, and Supertest covering key components and functionality.)*
*   [ ] **Deployment Strategy**: Define and configure a deployment process for staging and production environments. *(Analysis: No deployment configuration files found.)*
*   [ ] **(Optional) Marketplace Feature**: Consider implementing the potential marketplace listing feature mentioned in the overview. *(Analysis: No code related to a user marketplace found.)* 