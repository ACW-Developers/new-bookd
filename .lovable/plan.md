# Plan

## 1. Theme & quick fixes
- Default theme = light (drop `prefers-color-scheme`, store light by default; only honor explicit user toggle).
- Dashboard pages: set React Query `placeholderData: keepPreviousData` and prime queries on auth load so the dashboard renders instantly on revisit; show skeletons only on first ever load.

## 2. Availability page crash
- Add null guards around `r.start_time` / `r.end_time` (current `.slice(0,5)` throws when those fields are null after recent schema updates).
- Wrap save in try/catch and guard against empty `state` map. Also handle missing `availability_rules` rows gracefully.

## 3. Schedule / Diary module (professionals)
New table `public.schedule_entries`:
- columns: professional_id, title, notes, event_date, start_time, end_time, repeats (`none|daily|weekly|monthly`), repeat_until, blocks_availability (bool, default true), created/updated.
- RLS: pro manages own; public SELECT only of date/time/repeat (no notes) for `blocks_availability=true` so it can appear on landing.
- Page `Schedule.tsx` in dashboard: list + create/edit/delete, mark repeating, mark blocks-availability, add note.
- Expiry: a query view returns only non-expired (for non-repeating: `event_date >= today`; repeating: until `repeat_until` or forever).

## 4. Landing professional profile — show busy times
- Fetch approved bookings + schedule_entries that block availability for the next 30 days.
- Render an "Unavailable" list under the calendar: date + time range + label ("Booked" / schedule title). Expand existing `busy` array.
- Hire / Request Booking button: if not signed-in, redirect to `/auth?redirect=/pro/:id&action=book`. After login, return and auto-open the booking dialog.

## 5. Client dashboard redesign
Clients shouldn't see professional-only modules (Availability, Schedule, Analytics aimed at pros, "Today's schedule" of incoming bookings).
- New client-specific sidebar in `dashboard-shell.tsx`: Discover, My Bookings, Messages, Notifications, Profile, Settings.
- New `ClientHome.tsx` (used when `!isProfessional`): hero search, KPIs tailored to clients (Upcoming, Pending, Completed, Favorites), Categories carousel, Featured professionals grid.
- `Index.tsx` continues to be the pro dashboard.

## 6. Admin categories
Already implemented in Admin tab — confirm CRUD works and that image upload accepts URL. No new work unless broken.

## Technical notes
- New migration: `schedule_entries` table with GRANTs + RLS + updated_at trigger.
- Trigger to log to `activity_logs` on schedule create/update.
- Reuse `BusySlot` shape on landing by merging bookings + expanded schedule entries client-side.
- All new fetches use react-query with `staleTime: 30s` to feel instant on revisit.

```
landing /pro/:id
  └─ Request Booking → if !user → /auth?redirect=/pro/:id&book=1
client /dashboard
  └─ ClientHome (Discover, KPIs, Categories, Pros)
pro /dashboard
  └─ Existing Home + new /dashboard/schedule
```
