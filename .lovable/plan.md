

## Plan: Replace Fake Villages with Real Names + "Add Your Village" Feature

### Current State
- `SetupProfile.tsx` has a hardcoded array of fake village names: `['Chak 45', 'Chak 60', 'Chak 72', 'Moza Ali', 'Basti Lal']`
- A `villages` table already exists in the database with columns: `id`, `name`, `status`, `source`, `submitted_by`, `created_at`
- Admin already has a village management page (`AdminVillages.tsx`) with approve/reject workflow
- The villages table is currently empty

### Changes

**1. Seed the villages table with real village names**
Insert 10 approved villages: Maizara, Kotlai, Paindashah, Sangaar, Gharonotangay, Melagah, Qamboo, Kasai, Hafiz Baba, Surazgho (source: `system`, status: `approved`).

**2. Rewrite `SetupProfile.tsx` to fetch villages from the database**
- Remove the hardcoded array
- Fetch approved villages from the `villages` table on mount
- Display them as selectable buttons (same UI style)
- Add an "Add Your Village" button at the end of the grid
- When clicked, show an input field where the user types their village name
- On submit, insert the new village into the `villages` table with `status: 'pending'`, `source: 'user'`, `submitted_by: user.id`
- Set the user's profile village to the custom name immediately (so they aren't blocked)
- Show a note like "Your village will appear for others after approval"

**3. Update `Profile.tsx`**
- The village field already displays `user?.village` — no change needed. It will show whatever was saved.

**4. No schema changes needed**
The `villages` table already supports this workflow perfectly (status, source, submitted_by columns).

### Technical Details
- The `villages` table RLS already allows authenticated users to insert with `submitted_by = auth.uid()` and public to read approved villages — perfect for this use case.
- The `SetupProfile` page will query `villages` where `status = 'approved'` and order by name.
- Custom village submission creates a pending entry that admins can approve via the existing `AdminVillages` page.

