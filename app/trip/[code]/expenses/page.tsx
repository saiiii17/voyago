import Link from "next/link";
import { requireTripPageAccess } from "@/lib/auth-page";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORY_ICON: Record<string, string> = {
  food: "🍜",
  transport: "🚗",
  lodging: "🏨",
  activities: "🎟️",
  shopping: "🛍️",
  other: "💸",
};

export default async function ExpensesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const access = await requireTripPageAccess(code);
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, trip_members(display_name)")
    .eq("trip_id", access.trip.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={expenses?.length ? `${expenses.length} logged so far` : undefined}
        action={
          <Link href={`/trip/${code}/expenses/new`}>
            <Button>+ Add expense</Button>
          </Link>
        }
      />

      {!expenses || expenses.length === 0 ? (
        <Card className="text-center">
          <p className="mb-1 text-3xl">🧾</p>
          <p className="text-sm text-stone-500">No expenses yet. Add your first one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <Link key={e.id} href={`/trip/${code}/expenses/${e.id}`}>
              <Card className="flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-lg">
                    {CATEGORY_ICON[e.category] ?? "💸"}
                  </span>
                  <div>
                    <p className="font-medium text-stone-900">{e.title}</p>
                    <p className="text-xs text-stone-500">
                      Paid by {(e.trip_members as unknown as { display_name: string } | null)?.display_name ?? "?"} ·{" "}
                      {formatDate(e.created_at)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-stone-900">{formatCurrency(e.total_amount, e.currency)}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
