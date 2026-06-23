import { supabase } from "@/integrations/supabase/client";

export const api = {
  featuredPros: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_professional", true)
      .order("rating", { ascending: false })
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },
  allPros: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_professional", true)
      .order("rating", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  categories: async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    return data ?? [];
  },
  professional: async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  proRules: async (id: string) => {
    const { data } = await supabase.from("availability_rules").select("*").eq("professional_id", id);
    return data ?? [];
  },
  proBusySlots: async (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("bookings")
      .select("event_date,start_time,end_time,status")
      .eq("professional_id", id)
      .in("status", ["pending", "approved"])
      .gte("event_date", today)
      .order("event_date", { ascending: true });
    return data ?? [];
  },
};

