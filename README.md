# LeadMS Backend (CRM Base)

Welcome to the backend of the Lead Management System (LeadMS). This is a foundational Node.js + Express API designed to serve as the core backend for frontend developer internships. 

It handles multi-role authentication, single-device session locking, product management, vendor locking/quoting, and lead assignment.

## 📖 Project Overview & Data Flow

**LeadMS** is a B2B (Business-to-Business) Customer Relationship Management (CRM) tool tailored for multi-tier sales channels. It orchestrates the flow of products and leads between three primary roles: Traders, Vendors, and Team Members.

### Core Roles
1. **Trader**: The top-level supplier. They create and manage the master list of products and set the base prices.
2. **Vendor**: The distributor or sales agency. They browse products created by Traders and "lock" (select) the ones they want to sell. Vendors can also configure their own profit margins, installation fees, and miscellaneous charges to create customized quotes.
3. **Team Member**: The sales representative working under a specific Vendor. They manage customer leads and generate quotes using the products their Vendor has locked.

### Data Flow & Application Lifecycle
1. **Product Initialization**: A Trader signs up, confirms their email, and adds products to the system.
2. **Vendor Onboarding**: A Vendor signs up, confirms their email, and sets up their quoting profile (margins, fees).
3. **Product Curation**: The Vendor views all active products from Traders and "locks" specific products to add them to their sales catalog.
4. **Team Expansion**: The Vendor invites Team Members via email. The Team Member clicks the invitation link to register and is automatically tied to that Vendor.
5. **Lead Generation**: A Team Member (or the Vendor) creates a customer Lead. If created by a Team Member, it is automatically assigned to them. If created by a Vendor, the Vendor delegates it to a specific Team Member.
6. **Quoting**: The Team Member (or Vendor) selects products for the Lead and generates a quote. The backend automatically calculates the final price by applying the Vendor's specific margin and additional fees on top of the Trader's base price.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or Atlas cluster)

### 1. Installation
Clone or navigate to the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy the `.env.example` file to create your own `.env` file:
```bash
cp .env.example .env
```
Ensure you have the following configured in your `.env` file:
- `PORT`: Server port (default 5000).
- `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/crm_backend`).
- `JWT_SECRET`: A secure random string for JWT hashing.
- `CLIENT_URL`: The URL of your frontend application (used in emails).

### 3. Setting Up Gmail SMTP
We use Gmail to send verification, invitation, and password reset emails. You cannot use your standard Gmail password for this; you must generate an **App Password**.

1. Go to your [Google Account > Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. Search for **App Passwords** in the search bar and click on it.
4. When asked for an app name, type something like `Mailing` and click **Create**.
5. Google will display a 16-character password in a yellow box. 
6. **Important:** Copy this password immediately and remove any spaces from it. You will not be able to view this password again once you close the modal.
7. Update your `.env` file with this spaceless 16-character string:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_gmail_address@gmail.com
   SMTP_PASS=the_16_character_app_password_without_spaces
   FROM_EMAIL=your_gmail_address@gmail.com
   ```

### 4. Running the Server
To start the server in development mode (using nodemon for hot-reloading):
```bash
npm run start:dev
```
*(Note: If `start:dev` is not defined in package.json scripts, run `npx nodemon src/server.js` or `node src/server.js`)*

---

## 📚 API Documentation

Base URL: `http://localhost:5000/api`

### Authentication & User Management (`/api/auth`)

All users must verify their email before logging in. The verification link sent to the user's email opens a decorated HTML page that auto-closes after 10 seconds.

#### `POST /register`
Registers a new `trader` or `vendor`.
- **Payload:**
  ```json
  {
    "email": "trader@example.com",
    "password": "securepassword",
    "role": "trader",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response (201):** `{ "message": "Registration successful. Please check your email to verify your account." }`

#### `GET /confirm-email?token=<token>`
(Triggered via email link). Verifies the user's email address and returns an HTML success/failure page.

#### `POST /login`
Authenticates the user and returns JWT tokens.
- **Payload:** `{ "email": "trader@example.com", "password": "securepassword" }`
- **Response (200):**
  ```json
  {
    "accessToken": "ey...",
    "refreshToken": "hex...",
    "user": { "id": "...", "email": "...", "role": "trader" }
  }
  ```

#### `POST /refresh-token`
Generates a new access token using a valid refresh token.
- **Payload:** `{ "refreshToken": "hex..." }`
- **Response (200):** `{ "accessToken": "ey...", "refreshToken": "new_hex..." }`

#### `POST /invite` (Protected: Vendor)
Invites a team member.
- **Header:** `Authorization: Bearer <accessToken>`
- **Payload:**
  ```json
  {
    "email": "team@example.com",
    "designation": "Sales Representative"
  }
  ```
- **Response (200):** `{ "message": "Invitation sent" }`

#### `POST /accept-invitation`
Accepts a team member invitation and sets the password.
- **Payload:**
  ```json
  {
    "token": "<token_from_email>",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "newpassword"
  }
  ```
- **Response (200):** `{ "message": "Account registered successfully. You can now login." }`

---

### Products (`/api/products`)

#### `POST /trader` (Protected: Trader)
Creates a new product.
- **Payload:**
  ```json
  {
    "name": "CRM Software",
    "description": "Enterprise CRM",
    "basePrice": 500,
    "isActive": true
  }
  ```
- **Response (201):** Returns the Product object.

#### `GET /available` (Protected: Vendor)
Fetches all active products available in the system.
- **Response (200):** Array of Product objects.

#### `POST /:id/lock` (Protected: Vendor)
Locks a product so that the vendor (and their team members) can sell it.
- **Response (200):** `{ "message": "Product locked for sale" }`

#### `GET /locked` (Protected: Team-Member, Vendor)
Fetches products locked by the associated vendor.
- **Response (200):** Array of Product objects.

---

### Leads & Quoting (`/api/leads`)

#### `POST /` (Protected: Vendor, Team-Member)
Creates a new lead.
- **Payload:**
  ```json
  {
    "customerName": "Acme Corp",
    "customerEmail": "contact@acme.com",
    "customerPhone": "1234567890",
    "assignedTo": "<team-member-object-id>" // Only vendors provide this. Team members auto-assign to themselves.
  }
  ```
- **Response (201):** Returns the Lead object.

#### `GET /` (Protected: Vendor, Team-Member)
Gets leads belonging to the vendor (or assigned to the team member).
- **Response (200):** Array of Lead objects.

#### `POST /:id/quote` (Protected: Vendor)
Generates a quote for a lead based on selected products and vendor profile configurations (margins, misc charges).
- **Payload:**
  ```json
  {
    "products": [
      { "productId": "<product-id>", "quantity": 2 }
    ]
  }
  ```
- **Response (200):** Returns the updated Lead object containing the `quote` sub-document with calculated pricing.

---

### Vendor Profile (`/api/vendor/profile`)

#### `PUT /` (Protected: Vendor)
Updates the quoting variables for a vendor.
- **Payload:**
  ```json
  {
    "marginPercentage": 15,
    "installationPrice": 100,
    "miscCharges": 50
  }
  ```
- **Response (200):** Returns the updated VendorProfile object.

### Admin Analytics (`/api/admin`)

These endpoints are strictly protected and require the `admin` role.

#### `GET /users`
Fetches a list of all users in the system (excluding passwords).
- **Response (200):** Array of User objects.

#### `GET /leads`
Fetches all leads across the entire system, populated with assignee and vendor details.
- **Response (200):** Array of Lead objects.

#### `GET /analytics`
Returns aggregated analytical data intended for the interns to build a dashboard.
- **Response (200):**
  ```json
  {
    "users": {
      "trader": 5,
      "vendor": 12,
      "team-member": 30
    },
    "leads": {
      "total": 150,
      "byStatus": {
        "new": 50,
        "quoted": 100
      }
    },
    "products": {
      "total": 200,
      "active": 190
    },
    "revenue": {
      "totalQuoted": 50000,
      "totalExpectedMargin": 5000
    }
  }
  ```

---

## 🔒 Security Architecture
- **Single Device Login:** Using `activeRefreshToken` on the `User` schema ensures that logging in from a new device immediately invalidates previous sessions.
- **Role-Based Access Control (RBAC):** All protected routes are wrapped in an `authorize('role')` middleware to ensure strict domain boundaries between Traders, Vendors, and Team Members.
