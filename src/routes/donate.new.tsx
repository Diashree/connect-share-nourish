import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Utensils, Shirt, BookOpen, Pill, ShoppingBasket, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/donate/new")({ component: NewDonation });

const CATEGORIES = [
  { id: "food", label: "Food", icon: Utensils },
  { id: "clothes", label: "Clothes", icon: Shirt },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "medicines", label: "Medicines", icon: Pill },
  { id: "essentials", label: "Essentials", icon: ShoppingBasket },
  { id: "electronics", label: "Electronics", icon: Smartphone },
] as const;

type Category = (typeof CATEGORIES)[number]["id"];

function NewDonation() {
  const { user, role } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [expiry, setExpiry] = useState("");
  const [size, setSize] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  if (role && role !== "donor") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Only donors can post donations.</p>
          <Link to="/dashboard" className="text-primary hover:underline mt-2 inline-block">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const setDetail = (k: string, v: any) => setDetails((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    if (!user || !category) return;
    if (category === "food" && expiry) {
      if (new Date(expiry) < new Date()) return toast.error("Food cannot already be expired.");
    }
    if (category === "medicines" && !details.otc_only) {
      return toast.error("Please confirm medicines are over-the-counter (OTC).");
    }
    setLoading(true);
    const { error } = await supabase.from("donations").insert({
      donor_id: user.id,
      title, category, quantity, description: description || null,
      pickup_address: address,
      expiry_date: expiry ? new Date(expiry).toISOString() : null,
      size: size || null,
      details,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Donation posted! NGOs will see it instantly.");
    nav({ to: "/dashboard" });
  };

  const canNext1 = category && title.trim();
  const canNext2 = quantity.trim() && (category !== "medicines" || details.otc_only);
  const canNext3 = address.trim();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
        </Link>
        <h1 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight">Post a donation</h1>

        <Stepper step={step} />

        <div className="card-warm p-6 md:p-8 mt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm mb-3 block">Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((c) => {
                    const active = category === c.id;
                    return (
                      <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                        className={`p-4 rounded-xl border text-left transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"}`}>
                        <c.icon className="h-5 w-5" />
                        <p className="mt-2 font-medium text-sm">{c.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g. 20 cooked meals" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
              </div>
              <div className="flex justify-end">
                <Button disabled={!canNext1} onClick={() => setStep(2)} className="bg-warm-gradient text-primary-foreground hover:opacity-90">Next<ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 2 && category && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" placeholder={category === "food" ? "e.g. 5 kg / 20 portions" : "e.g. 10 items"} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1.5" />
              </div>
              {category === "food" && (
                <>
                  <div>
                    <Label htmlFor="expiry">Expiry date</Label>
                    <Input id="expiry" type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Food type</Label>
                    <select value={details.food_type ?? ""} onChange={(e) => setDetail("food_type", e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Select…</option>
                      <option value="cooked">Cooked</option><option value="packaged">Packaged</option><option value="raw">Raw</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="allerg">Allergen notes</Label>
                    <Input id="allerg" value={details.allergens ?? ""} onChange={(e) => setDetail("allergens", e.target.value)} className="mt-1.5" />
                  </div>
                </>
              )}
              {category === "clothes" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Size</Label>
                      <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Select…</option>{["XS","S","M","L","XL","XXL"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <select value={details.gender ?? ""} onChange={(e) => setDetail("gender", e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Select…</option><option>Men</option><option>Women</option><option>Kids</option><option>Unisex</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {category === "books" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Subject / genre</Label><Input value={details.subject ?? ""} onChange={(e) => setDetail("subject", e.target.value)} className="mt-1.5" /></div>
                  <div><Label>Education level</Label><Input value={details.level ?? ""} onChange={(e) => setDetail("level", e.target.value)} className="mt-1.5" /></div>
                </div>
              )}
              {category === "medicines" && (
                <>
                  <div><Label>Medicine type</Label><Input value={details.medicine_type ?? ""} onChange={(e) => setDetail("medicine_type", e.target.value)} className="mt-1.5" /></div>
                  <div><Label htmlFor="exp2">Expiry date</Label><Input id="exp2" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1.5" /></div>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={!!details.otc_only} onCheckedChange={(v) => setDetail("otc_only", !!v)} className="mt-0.5" />
                    <span>I confirm these are <strong>over-the-counter</strong> medicines only.</span>
                  </label>
                </>
              )}
              {category === "electronics" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Device type</Label><Input value={details.device_type ?? ""} onChange={(e) => setDetail("device_type", e.target.value)} className="mt-1.5" /></div>
                  <div><Label>Working condition</Label><Input value={details.working ?? ""} onChange={(e) => setDetail("working", e.target.value)} className="mt-1.5" /></div>
                </div>
              )}
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button disabled={!canNext2} onClick={() => setStep(3)} className="bg-warm-gradient text-primary-foreground hover:opacity-90">Next<ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="addr">Pickup address</Label>
                <Textarea id="addr" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" placeholder="Street, area, landmark…" />
                <p className="text-xs text-muted-foreground mt-2">Map-based location selection coming soon. For now, please describe the pickup spot clearly.</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button disabled={!canNext3} onClick={() => setStep(4)} className="bg-warm-gradient text-primary-foreground hover:opacity-90">Review<ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-primary-soft p-5">
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground capitalize mt-1">{category} · {quantity}</p>
                {description && <p className="text-sm mt-3">{description}</p>}
                <p className="text-sm mt-3"><strong>Pickup:</strong> {address}</p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button disabled={loading} onClick={submit} className="bg-warm-gradient text-primary-foreground hover:opacity-90">
                  <Check className="mr-2 h-4 w-4" />{loading ? "Posting…" : "Post donation"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Category", "Details", "Location", "Review"];
  return (
    <div className="mt-6 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step, done = n < step;
        return (
          <div key={l} className="flex items-center gap-2 flex-1">
            <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-semibold ${done ? "bg-secondary text-secondary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check className="h-4 w-4" /> : n}
            </div>
            <span className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"} hidden sm:inline`}>{l}</span>
            {n < labels.length && <div className="h-px flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
