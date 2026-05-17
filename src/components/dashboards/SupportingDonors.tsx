import { MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DONORS = [
  { name: "Rajesh Sharma", city: "Delhi", total: "₹45,000", last: "3 days ago" },
  { name: "Priya Mehta", city: "Mumbai", total: "₹28,500", last: "1 week ago" },
  { name: "Anil Gupta", city: "Pune", total: "₹72,000", last: "Yesterday" },
  { name: "Sunita Reddy", city: "Hyderabad", total: "₹15,200", last: "2 weeks ago" },
  { name: "Farhan Sheikh", city: "Bangalore", total: "₹33,800", last: "5 days ago" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function SupportingDonors() {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold mb-4">Donors supporting you</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DONORS.map((d) => (
          <div key={d.name} className="card-warm p-5 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-info/20 text-foreground font-semibold">
                {initials(d.name)}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold leading-tight">{d.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{d.city}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Total donated:</span> <span className="font-semibold text-primary">{d.total}</span></p>
              <p><span className="text-muted-foreground">Last donation:</span> {d.last}</p>
            </div>
            <Button
              onClick={() => toast.success(`Thank-you note sent to ${d.name} 💚`)}
              variant="outline"
              className="mt-4 border-primary/40 text-primary hover:bg-primary-soft"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />Thank
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
