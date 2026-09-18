# Set up a new Supabase database

The Dani-Note app requires the tables and policies in `supabase/migrations`.

## Supabase dashboard

1. Open the new Supabase project.
2. Open **SQL Editor** and create a new query.
3. Open each `.sql` file in `supabase/migrations` in filename order.
4. Paste and run each file before moving to the next one.
5. Confirm that **Table Editor** contains `profiles`, `folders`, and `documents`.
6. Redeploy the Vercel project.

Run the files in this order:

1. `20260820215603_094781ba-0e37-48a2-ba73-1abebf308409.sql`
2. `20260820215609_8d5dcc7c-6a3c-45b0-bca4-7765d1d9b91d.sql`
3. `20260821055426_7af6d522-6288-4a1c-ae18-be624761e8fe.sql`
4. `20260822083254_4ee46ab5-6e7a-4a33-9fb5-190e883d97df.sql`
5. `20260825025216_1955ca77-bcd2-4ea1-8966-6e14a89b1fe2.sql`

The second file revokes permissions from the user trigger function. The fourth file is a cleanup statement for an old user and is safe to run on a new database.

Do not paste a service-role key into the app or GitHub. The browser only needs the public Supabase URL and publishable key.
