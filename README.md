# Early POS & Shop Management System

A small-shop Point of Sale (POS) and inventory management prototype built to explore AI-assisted development, Supabase, and modern web application workflows.

This project allows staff members to create sales vouchers, manage daily sales records, monitor product inventory, and submit incorrect or cancelled vouchers for admin review.

> **Project Status:** Early Version / Prototype  
> This project was created primarily as a learning and experimentation project to test AI-assisted development with Google AI Studio, backend development with Supabase, and the concept of "vibe coding."

---

## Overview

This application is an early POS system designed around the basic workflow of a small retail shop.

Staff can:

- Create sales vouchers by selecting products and quantities
- Automatically calculate voucher totals
- Create and view daily sales logs
- Review previous sales history day by day
- Monitor product inventory
- Receive low-stock notifications
- Submit incorrect or cancelled vouchers for cancellation review

Administrators or owners have additional access to review pending voucher cancellation requests and either approve or reject them.

The application is connected to **Supabase**, allowing sales, products, inventory, and voucher-related data to be stored and updated through a backend database.

---

## Current Features

### 🧾 Sales Voucher

Staff can create a sales voucher by selecting products and specifying quantities.

The system:

1. Selects the products being sold
2. Calculates the total price
3. Creates the voucher
4. Updates the corresponding product inventory
5. Adds the sale amount to the daily revenue

This creates a basic connection between the sales process, inventory, and revenue tracking.

---

### 📦 Product Inventory

Staff can view the current product inventory.

The system tracks product quantities and updates the stock automatically when a voucher is created.

For example:

```text
Product: Coca-Cola
Current Stock: 20

Customer buys: 3

Updated Stock: 17

The application also provides an obvious low-stock notification when a product reaches a low inventory level.

📅 Daily Sales Log

Staff members can create and maintain daily sales records.

The system allows users to:

View today's sales activity
Add vouchers to the daily log
Review previous days
View sales history day by day
Track the total revenue for each day

This provides a simple overview of the shop's daily performance.

💰 Daily Revenue

Voucher sales are connected to the daily revenue calculation.

When a valid voucher is created, its total amount contributes to the revenue for that day.

For example:

Voucher #001     $25
Voucher #002     $40
Voucher #003     $15
--------------------
Daily Revenue    $80

The revenue is connected to the underlying Supabase data rather than being stored only as a frontend value.

⚠️ Voucher Void / Cancellation Request

A staff member may accidentally create an incorrect voucher or a customer may cancel a purchase.

Instead of immediately deleting the voucher, the staff member can submit it as a Void Pending request.

The voucher is then placed into a pending cancellation section.

Only an authenticated administrator or owner can access this section and review the request.

The administrator can:

Approve the cancellation
Reject the cancellation
🔄 Voucher Cancellation Workflow

When an administrator approves a voucher cancellation:

The voucher is marked as cancelled/voided
The voucher's revenue amount is removed from the daily revenue
The products from the cancelled voucher are returned to inventory
The inventory reflects the restored quantities

Example:

Original Sale

Product A
Quantity: 3
Price: $10

Revenue: $30
Stock: -3

After the cancellation is approved:

Revenue: -$30
Stock: +3

This allows the inventory and revenue records to remain consistent with the approved sales.

👥 User Roles
Staff / Member

Staff users can:

Create sales vouchers
View products and inventory
View low-stock notifications
Create daily logs
View previous sales history
Submit voucher cancellation requests
Admin / Owner

Administrators or owners have additional access to:

Review pending voucher cancellations
Authenticate before accessing sensitive cancellation actions
Approve voucher cancellation requests
Reject voucher cancellation requests
🗄️ Backend & Database

The application uses Supabase as the backend platform and database.

Supabase is used to manage and persist application data such as:

Products
Inventory quantities
Sales vouchers
Voucher items
Daily sales records
Revenue information
Voucher cancellation requests
User-related data

The application is designed so that important operations such as inventory changes and revenue updates are connected to the stored backend data.

🤖 AI-Assisted Development

One of the main purposes of this project was to experiment with AI-assisted software development.

I used Google AI Studio as part of the development process to explore how AI tools can assist with:

Application planning
UI development
Feature implementation
Debugging
Code generation
Iterating on application functionality
Rapid prototyping

This project is also an experiment with the concept commonly referred to as "vibe coding", where AI is used as an active development assistant while the developer guides the application's architecture, requirements, and functionality.

The project is intended to help me understand both the advantages and limitations of AI-assisted development rather than demonstrate a fully production-ready software architecture.

🛠️ Technologies
Frontend: [Add your frontend framework here]
Backend / Database: Supabase
AI Development: Google AI Studio
Authentication: Supabase Authentication / application authentication
Version Control: Git & GitHub

Additional technologies may change as the project continues to develop.

🔗 Application Workflow

The main sales workflow can be summarized as:

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
📊 Current Project Scope

The current version focuses on the fundamental POS workflow:

Product management
Inventory tracking
Sales vouchers
Daily sales logs
Revenue tracking
Voucher cancellation requests
Admin approval workflow
Supabase database integration
AI-assisted development experimentation
🚧 Not Included Yet

This is an early version, so several features have intentionally not been implemented yet.

Planned future improvements include:

 Excel / spreadsheet export
 Advanced reporting and analytics
 Multi-tenant architecture
 Multiple independent shops/business accounts
 Payment gateway integration
 More advanced authentication and authorization
 Improved audit logging
 More advanced inventory management
 Production-level security improvements
 Additional POS features
🎯 Purpose of the Project

This project is mainly a learning and experimentation project.

The goals are to:

Experiment with AI-assisted development using Google AI Studio
Learn how to integrate Supabase into a real application
Understand how frontend applications interact with backend data
Practice designing real-world business workflows
Explore rapid prototyping through AI-assisted development
Understand the limitations and challenges of "vibe coding"
Build a practical project that demonstrates my current development knowledge

Rather than focusing only on building a visually appealing application, this project focuses on connecting multiple business operations together, including sales, inventory, revenue, and cancellation workflows.

🔮 Future Direction

The long-term goal is to continue improving this prototype into a more complete shop management system.

Potential future architecture could support multiple businesses using the same application through a multi-tenant architecture, allowing each shop to have its own:

Products
Staff
Sales
Inventory
Revenue
Reports
Business settings

Payment processing and more advanced reporting could also be introduced in future versions.

⚠️ Project Disclaimer

This project is an early-stage prototype created for educational and experimental purposes.

It should not currently be considered a production-ready POS system.

The application was developed partly to experiment with AI-assisted programming and "vibe coding." Therefore, the architecture, security, error handling, and business logic may continue to change as I learn and improve the project.

👨‍💻 Author

Sai Thuta Hlaing

Computing Student | Web Development & Technology

GitHub: github.com/saithuta776-spec

