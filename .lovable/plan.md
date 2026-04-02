

## Fix Admin Login for zakirullah20331@gmail.com

### Problem
The email exists in auth but has no corresponding row in the `profiles` table. The admin login at `/admin` checks `profiles.role = 'admin'` after authentication — since no profile exists, it returns "Unauthorized access."

### Solution (2 steps)

1. **Insert a profile row** for user ID `03b6cafc-df1f-47a4-8559-7710f230513f` with `role = 'admin'` using the database insert tool.

2. **Update the password** for this auth user to `Swat@88991` — since the account was likely created via the phone-based signup flow, the current password is probably the phone number. I'll use the Supabase admin API (via an edge function or auth admin call) to reset the password to the requested one.

### Technical Details

**Step 1 — Profile insert:**
```sql
INSERT INTO profiles (id, name, phone, role, village, address)
VALUES ('03b6cafc-df1f-47a4-8559-7710f230513f', 'Zakir Ullah', '', 'admin', '', '');
```

**Step 2 — Password update:**
Use a temporary edge function calling `supabase.auth.admin.updateUserById()` to set the password to `Swat@88991`, then delete the function.

No code file changes needed — this is purely a data/auth fix.

