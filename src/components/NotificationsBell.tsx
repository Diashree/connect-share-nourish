import { useEffect, useState } from "react";
import { Bell, Mail, MapPin, Phone, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Notification {
  id: string;
  title: string | null;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  ngo_id: string | null;
  related_claim_id: string | null;
}

interface NgoDetails {
  id: string;
  name: string;
  org_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  address: string | null;
  phone: string | null;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [ngo, setNgo] = useState<NgoDetails | null>(null);
  const [ngoEmail, setNgoEmail] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,message,type,is_read,created_at,ngo_id,related_claim_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as unknown as Notification[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notifs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unread = items.filter((n) => !n.is_read).length;

  const onOpenNotif = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true } as never).eq("id", n.id);
      setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.type === "request_accepted" && n.ngo_id) {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,org_name,avatar_url,bio,address,phone")
        .eq("id", n.ngo_id)
        .maybeSingle();
      if (data) {
        setNgo(data as NgoDetails);
        // email comes from auth.users; not directly accessible — show placeholder
        setNgoEmail(null);
        setOpen(false);
      }
    }
  };

  if (!user) return null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="font-medium text-sm">Notifications</p>
            {unread > 0 && <span className="text-xs text-muted-foreground">{unread} unread</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-6 text-sm text-center text-muted-foreground">You're all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onOpenNotif(n)}
                  className={`w-full text-left p-3 border-b border-border/60 hover:bg-accent/40 transition ${!n.is_read ? "bg-primary-soft/40" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      {n.title && <p className="text-sm font-medium truncate">{n.title}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={!!ngo} onOpenChange={(o) => !o && setNgo(null)}>
        <DialogContent className="max-w-md">
          {ngo && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {ngo.avatar_url && <AvatarImage src={ngo.avatar_url} />}
                    <AvatarFallback>{(ngo.org_name || ngo.name).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="font-display text-xl">{ngo.org_name || ngo.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">Partner NGO</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3 text-sm mt-2">
                {ngo.bio && <p className="text-muted-foreground leading-relaxed">{ngo.bio}</p>}
                {ngo.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <p>{ngo.address}</p>
                      <a className="text-xs text-primary underline" target="_blank" rel="noreferrer"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ngo.address)}`}>
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
                {ngo.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${ngo.phone}`} className="underline">{ngo.phone}</a></p>}
                {ngoEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${ngoEmail}`} className="underline">{ngoEmail}</a></p>}
                <Button variant="outline" className="w-full mt-2" onClick={() => setNgo(null)}>
                  <X className="h-4 w-4 mr-1.5" /> Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
