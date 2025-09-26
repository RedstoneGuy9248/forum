# Forum Project

A simple forum with secure login, posts, comments, and profiles.

## Features

* Sign up, log in, and log out (uses secure HttpOnly cookies).
* Navbar updates based on login status.
* Create posts and comments when logged in.
* Fast pagination for posts.
* View and edit user profiles (display name and description).
* View other users’ posts from their profiles.
* Automatically removes expired tokens.

## Technologies Used

* Node.js
* Express.js
* EJS
* MariaDB
* bcrypt
* node-cron 

## Prerequisites

* Node.js
* npm
* MariaDB Server & Client

## Setup
1. Clone the repository locally

2. Import the database schema:

   ```bash
   mysql -u username -p database_name < schema.sql
   ```

3. Configure environment variables:

   * Copy `.env.example` to `.env`
   * Fill in your own database credentials and secrets.

4. Install dependencies:

   ```bash
   npm install
   ```

5. Run:

   ```bash
   npm test
   ```
