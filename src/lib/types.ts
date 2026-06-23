import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];
export type BlockedDate = Database["public"]["Tables"]["blocked_dates"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];
