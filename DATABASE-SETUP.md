# DigilizeForms Database Setup

This document provides instructions on how to set up the database for DigilizeForms.

## Prerequisites

- A Supabase account and project
- Your Supabase project URL and anon key (found in the Supabase dashboard under Project Settings > API)

## Setup Steps

1. **Create Database Tables**

   In your Supabase dashboard, navigate to the SQL Editor and run the SQL queries in the `database-setup.sql` file.

   This will:
   - Create the required tables (profiles, forms, form_responses)
   - Set up Row Level Security
   - Create access policies
   - Add necessary indexes
   - Create a trigger for automatic profile creation

2. **Enable Email Authentication**

   In your Supabase dashboard:
   - Go to Authentication > Providers
   - Make sure Email is enabled
   - For development, you may want to disable email confirmations

3. **Update Environment Variables**

   Make sure your `.env` and `.env.local` files contain:

   ```
   REACT_APP_SUPABASE_URL=your-supabase-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   REACT_APP_SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   ```

   Replace the placeholders with your actual Supabase project values.

## Schema Overview

- **profiles**: Extends Supabase auth.users with additional user information
- **forms**: Stores all form metadata and structure
- **form_responses**: Stores form submissions

## Automatic Profile Creation

When a new user signs up or is created in the Supabase auth system, a database trigger automatically creates a corresponding record in the `profiles` table. This ensures that:

1. Foreign key constraints are maintained
2. Users can immediately create forms after signup
3. No manual profile creation is needed

## Row Level Security (RLS)

The database uses Row Level Security to ensure:

- Users can only access their own profiles
- Users can only view, edit, and delete their own forms
- Anyone can submit responses to published forms
- Form owners can view responses for their forms

## Troubleshooting

If you encounter errors related to database tables not existing, make sure you've run the SQL script in the Supabase SQL Editor. 

You can verify the tables exist in the Supabase dashboard under Database > Tables.

### Foreign Key Constraint Error on Forms

If you see an error like `"Error saving form: insert or update on table 'forms' violates foreign key constraint 'forms_user_id_fkey'"`, it means your user profile hasn't been properly created in the profiles table.

This can happen if:
1. The database trigger is not working properly
2. You're using an account that was created before the trigger was implemented

**Solutions:**

1. **For accounts created before the trigger implementation:**
   - Use the built-in repair utility by opening your browser console (F12) and typing `fixMyProfile()`
   - Or run the SQL command shown in option 3

2. **Check database setup:**
   - Open your browser console
   - Type `checkDatabase()` to verify all tables are correctly set up
   - If issues are reported, review the SQL setup script

3. **Manual fix in Supabase:**
   - Go to your Supabase dashboard
   - Open the SQL Editor
   - Run: `INSERT INTO profiles (id, name, email) SELECT id, email, email FROM auth.users WHERE id = 'your-user-id'`
   - Replace 'your-user-id' with your actual user ID 