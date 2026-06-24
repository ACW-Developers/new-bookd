import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Search, MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";

type Partner = { id: string; full_name: string; avatar_url: string | null };

export default function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Existing conversation partners (anyone I've talked to)
  const { data: convos = [] } = useQuery({
    queryKey: ["dm-convos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("sender_id,recipient_id,body,created_at,read")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(200);
      const seen = new Map<string, { partnerId: string; last: string; at: string; unread: number }>();
      for (const m of data ?? []) {
        const pid = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        const prev = seen.get(pid);
        if (!prev) seen.set(pid, { partnerId: pid, last: m.body, at: m.created_at, unread: m.recipient_id === user!.id && !m.read ? 1 : 0 });
        else if (m.recipient_id === user!.id && !m.read) prev.unread += 1;
      }
      const ids = [...seen.keys()];
      if (ids.length === 0) return [] as (Partner & { last: string; at: string; unread: number })[];
      const { data: profs } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      return [...seen.values()].map((c) => {
        const p = (profs ?? []).find((x) => x.id === c.partnerId);
        return { ...c, id: c.partnerId, full_name: p?.full_name ?? "Unknown", avatar_url: p?.avatar_url ?? null };
      });
    },
    refetchInterval: 15_000,
  });

  // People I can start a conversation with (everyone except me)
  const { data: people = [] } = useQuery({
    queryKey: ["dm-people", search],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("profiles").select("id,full_name,avatar_url,profession").neq("id", user!.id).limit(20);
      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: thread = [] } = useQuery({
    queryKey: ["dm-thread", user?.id, partnerId],
    enabled: !!user && !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user!.id})`)
        .order("created_at", { ascending: true });
      // Mark received messages as read
      await supabase.from("messages").update({ read: true }).eq("recipient_id", user!.id).eq("sender_id", partnerId).eq("read", false);
      qc.invalidateQueries({ queryKey: ["dm-convos"] });
      return data ?? [];
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length]);

  // Realtime new messages -> refetch thread/list
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("dm-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["dm-convos"] });
        qc.invalidateQueries({ queryKey: ["dm-thread"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const send = async () => {
    if (!user || !partnerId || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: partnerId, body });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["dm-thread"] });
    qc.invalidateQueries({ queryKey: ["dm-convos"] });
  };

  const partner = useMemo(() => {
    return convos.find((c) => c.id === partnerId) ?? people.find((p) => p.id === partnerId) ?? null;
  }, [convos, people, partnerId]);

  return (
    <DashboardShell title="Messages" subtitle="Chat directly with clients and professionals.">
      <div className="grid h-[70vh] gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-3 border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find someone…" className="pl-9" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {convos.length > 0 && (
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Conversations</p>
            )}
            {convos.map((c) => (
              <button key={c.id} onClick={() => setPartnerId(c.id)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${partnerId === c.id ? "bg-accent" : "hover:bg-muted"}`}>
                <UserAvatar src={c.avatar_url} name={c.full_name} seed={c.id} className="h-9 w-9 rounded-full text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.last}</p>
                </div>
                {c.unread > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{c.unread}</span>}
              </button>
            ))}
            {search.trim() && (
              <>
                <p className="mt-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">People</p>
                {people.map((p) => (
                  <button key={p.id} onClick={() => setPartnerId(p.id)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${partnerId === p.id ? "bg-accent" : "hover:bg-muted"}`}>
                    <UserAvatar src={p.avatar_url} name={p.full_name} seed={p.id} className="h-9 w-9 rounded-full text-xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{(p as any).profession ?? ""}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {convos.length === 0 && !search.trim() && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">No conversations yet. Search above to start one.</p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          {!partner ? (
            <div className="grid flex-1 place-items-center text-center text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">Select a conversation to start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border px-2 pb-3">
                <UserAvatar src={(partner as any).avatar_url} name={partner.full_name} seed={partner.id} className="h-9 w-9 rounded-full text-xs" />
                <p className="font-semibold">{partner.full_name}</p>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-2 py-4">
                {thread.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {thread.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Say hi 👋</p>}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2 border-t border-border pt-3"
              >
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" />
                <Button type="submit" size="icon" className="gradient-primary"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
