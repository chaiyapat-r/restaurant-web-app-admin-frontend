> **Note on Demo Performance:** > The backend is hosted on **Render's Free Tier**. If the application hasn't been accessed recently, the server may be in "Sleep Mode." Please allow **30-60 seconds** for the initial request to "wake up" the server. Once awake, the app will perform normally.

# Restaurant Admin Dashboard

A comprehensive back-office management system designed for restaurant owners, integrated with a full-stack architecture to handle real-time customer orders.

---

## Quick Start (Demo Access)

To test the live system, please use the following credentials:

- **Login URL:** `https://restaurant-web-app-admin-frontend.vercel.app/login`
- **Username:** `admin`
- **Password:** `mypassword123`

---

## How to Demo (Step-by-Step)

Follow these steps to experience the complete "Admin-to-Customer" flow:

1. **Generate QR Code (Open Table):**
   - Navigate to the **"Tables"** menu in the Admin Dashboard.
   - Select a table to display its unique **QR Code**.
2. **Customer Ordering:**
   - Scan the QR Code using your smartphone (this redirects you to the customer storefront with the specific session token).
   - Browse the menu and place a simulated order.
3. **Monitor Orders:**
   - Go back to the Admin **"Dashboard"** to view and manage the incoming order in real-time.

---

## Features & Functionalities

### 1. Dashboard (Order Monitoring & Management)

- **Live Tracking:** Monitor incoming orders from customers immediately.
- **Status Management:** Update order phases (Pending, Cooking, Ready to Serve).

### 2. Master Data Management

Full CRUD (Create, Read, Update, Delete) capabilities to manage restaurant resources:

- **Categories:** Organize menu items into logical groups.
- **Menus:** Manage prices, descriptions, images, and availability.
- **Menu Options:** Configure add-ons like spiciness levels or extra toppings.
- **Tables:** Manage table layout and generate unique QR codes for each station.

### 3. Security & Roles

- **JWT Authentication:** Secure login system using JSON Web Tokens.
- **Role-Based Access Control (RBAC):** Ensures only authorized administrators can access sensitive management data.

---

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide React icons.
- **Backend:** NestJS API (Node.js).
- **Database:** PostgreSQL with Prisma ORM.
- **Infrastructure:** Docker & Docker Compose.

---
