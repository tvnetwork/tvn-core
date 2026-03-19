# Creator Dashboard Template

A comprehensive, beautifully designed Creator Dashboard Template built with React and TypeScript. Originally extracted from a production creator platform, this template provides a solid foundation for building author platforms, course creator dashboards, and digital product storefronts.

## Tech Stack
- **Frontend Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database / Auth:** Supabase (Migrations included)
- **Rich Text Editor:** Tiptap
- **Icons:** Lucide React

## Features
- **Public Storefront:** Landing pages for digital products, books, and blog posts.
- **Creator Dashboard:** Admin interface to manage content, subscribers, and settings.
- **Authentication:** Supabase-powered login and session management.
- **Rich Content Management:** Built-in WYSIWYG editor for articles and product descriptions.
- **Database Migrations:** Pre-configured SQL files to easily spin up a Supabase instance.

## Use Cases
- Personal portfolios and author websites
- Independent course creator platforms
- Newsletter and blog publishing systems
- Digital product storefronts

## Setup Instructions

### 1. Install Dependencies
Make sure you have Node.js installed, then run:

`npm install`

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` and fill in your Supabase keys and API credentials:

`cp .env.example .env`

### 3. Run Development Server
Start the Vite development server:

`npm run start`

## Notes
- Ensure you have executed the included `supabase_migration_*.sql` files in your Supabase SQL Editor to set up the required tables and policies.
- This is a template project. All placeholder text and generic data should be updated before deploying to production.
