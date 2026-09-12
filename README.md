# Early POS & Shop Management System

An early Point of Sale (POS) and inventory management system designed for small shops.

This project allows staff members to create sales vouchers, manage daily sales records, monitor product inventory, track daily revenue, and submit incorrect or cancelled vouchers for admin review.

> **Project Status:** Early Version / Prototype
>
> This project was created as a learning and experimentation project to explore AI-assisted development with Google AI Studio, Supabase, and the concept of "vibe coding."

## Overview

This application is an early POS system focused on the basic workflow of a small retail shop.

Staff members can:

- Create sales vouchers by selecting products and quantities
- Automatically calculate voucher totals
- Add sales to the daily log
- View previous sales history day by day
- Monitor product inventory
- Receive low-stock notifications
- Submit incorrect or cancelled vouchers for cancellation review

Administrators or owners can review pending voucher cancellation requests and approve or reject them.

## Current Features

### 🧾 Sales Voucher

Staff can create a sales voucher by selecting products and specifying quantities.

The system:

1. Selects the products being sold
2. Calculates the total price
3. Creates the voucher
4. Updates the corresponding product inventory
5. Adds the sale amount to the daily revenue

This connects the sales process, inventory, and revenue tracking.

### 📦 Product Inventory

Staff members can view the current product inventory.

When a voucher is created, the system automatically decreases the corresponding product stock based on the quantity sold.

The system also provides an obvious low-stock notification when a product reaches a defined low-stock level.

### 📅 Daily Sales Log

Staff members can create and maintain daily sales records.

The system allows users to:

- View today's sales activity
- Add vouchers to the daily log
- View previous days
- Review sales history day by day
- View the total revenue for each day

### 💰 Daily Revenue

Sales vouchers are connected to the daily revenue calculation.

When a valid voucher is created, its total amount is added to the revenue for that day.

Example:

    Voucher #001     $25
    Voucher #002     $40
    Voucher #003     $15
    --------------------
    Daily Revenue    $80

The revenue is connected to the underlying Supabase database.

### ⚠️ Voucher Void / Cancellation Request

A staff member may accidentally create an incorrect voucher or a customer may cancel a purchase.

Instead of immediately deleting the voucher, the staff member can submit the voucher as a **Void Pending** request.

The voucher is then placed into a pending cancellation section.

Only an authenticated administrator or owner can access this section and review the request.

The administrator can:

- Approve the cancellation
- Reject the cancellation

### 🔄 Voucher Cancellation Workflow

When an administrator approves a voucher cancellation:

1. The voucher is marked as cancelled/voided
2. The voucher's revenue amount is removed from the daily revenue
3. The products from the cancelled voucher are returned to inventory
4. The inventory reflects the restored quantities

Example:

    Original Sale

    Product A
    Quantity: 3
    Price: $10

    Revenue: +$30
    Stock: -3

After the cancellation is approved:

    Revenue: -$30
    Stock: +3
    Voucher: VOID

This keeps the inventory and revenue records consistent with the approved sales.

## 👥 User Roles

### Staff / Member

Staff users can:

- Create sales vouchers
- View products and inventory
- View low-stock notifications
- Create daily logs
- View previous sales history
- Submit voucher cancellation requests

### Admin / Owner

Administrators or owners have additional access to:

- Access the pending voucher cancellation section
- Authenticate before accessing sensitive cancellation actions
- Review voucher cancellation requests
- Approve voucher cancellation requests
- Reject voucher cancellation requests

## 🗄️ Backend & Database

The application uses **Supabase** as the backend platform and database.

Supabase is used to store and manage application data such as:

- Products
- Inventory quantities
- Sales vouchers
- Voucher items
- Daily sales records
- Revenue information
- Voucher cancellation requests
- User-related data

The application connects the sales workflow with the database so that voucher creation, inventory changes, and revenue updates are reflected in the stored data.

## 🤖 AI-Assisted Development

One of the main purposes of this project was to experiment with AI-assisted software development.

I used **Google AI Studio** as part of the development process to explore:

- Application planning
- UI development
- Feature implementation
- Debugging
- Code generation
- Iterative development
- Rapid prototyping

This project is also an experiment with the concept commonly referred to as **"vibe coding"**, where AI is used as an active development assistant while the developer guides the application's requirements, functionality, and overall direction.

The purpose was not to create a fully production-ready POS system, but to understand how AI tools can support the development process and where human development knowledge is still required.

## 🛠️ Technologies

- **Backend / Database:** Supabase
- **AI-Assisted Development:** Google AI Studio
- **Version Control:** Git & GitHub

> Add your frontend framework and other technologies here if they are part of this project.

## 🔗 Application Workflow

The main sales workflow is:

    Staff
      │
      ▼
    Select Products
      │
      ▼
    Create Voucher
      │
      ├──────────────► Update Inventory
      │
      └──────────────► Update Daily Revenue
                             │
                             ▼
                        Daily Log

Voucher cancellation follows a separate approval workflow:

    Staff Creates Voucher
            │
            ▼
    Voucher is Incorrect / Customer Cancels
            │
            ▼
    Submit Void Request
            │
            ▼
    Pending Cancellation
            │
            ▼
    Admin / Owner Review
           / \
          /   \
      Reject   Approve
        │         │
        ▼         ▼
     No Change   Restore Inventory
                 Remove Revenue
                 Mark Voucher Void

## 📊 Current Project Scope

The current version focuses on the fundamental POS workflow:

- Product management
- Inventory tracking
- Sales vouchers
- Daily sales logs
- Revenue tracking
- Voucher cancellation requests
- Admin approval workflow
- Supabase database integration
- AI-assisted development experimentation

## 🚧 Not Included Yet

This is an **early version**, so several features have not been implemented yet.

Planned future improvements include:

- [ ] Excel / spreadsheet export
- [ ] Advanced reporting and analytics
- [ ] Multi-tenant architecture
- [ ] Support for multiple independent shops/businesses
- [ ] Payment gateway integration
- [ ] More advanced authentication and authorization
- [ ] Improved audit logging
- [ ] More advanced inventory management
- [ ] Production-level security improvements
- [ ] Additional POS features

## 🎯 Purpose of the Project

This project is mainly a learning and experimentation project.

The goals are to:

1. Experiment with AI-assisted development using Google AI Studio
2. Learn how to integrate Supabase into a real application
3. Understand how frontend applications interact with backend data
4. Practice designing real-world business workflows
5. Explore rapid prototyping through AI-assisted development
6. Understand the advantages and limitations of "vibe coding"
7. Build a practical project that demonstrates my current development knowledge

The project focuses on connecting multiple business operations together, including sales, inventory, revenue, and voucher cancellation workflows.

## 🔮 Future Direction

The long-term goal is to continue improving this prototype into a more complete shop management system.

Potential future architecture could support multiple businesses using the same application through a **multi-tenant architecture**, allowing each shop to have its own:

- Products
- Staff
- Sales
- Inventory
- Revenue
- Reports
- Business settings

Payment processing and more advanced reporting could also be introduced in future versions.

## ⚠️ Project Disclaimer

This project is an **early-stage prototype** created for educational and experimental purposes.

It should not currently be considered a production-ready POS system.

The application was developed partly to experiment with AI-assisted programming and "vibe coding." Therefore, the architecture, security, error handling, and business logic may continue to change as the project develops.

## 👨‍💻 Author

**Sai Thuta Hlaing**

Computing Student | Web Development & Technology

GitHub: https://github.com/saithuta776-spec
