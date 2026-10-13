import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/page-shell";
import { adminPatch, fetchAdminList } from "@/lib/admin-api";
import { isApiClientError } from "@/lib/api-client";

type PlanRow = {
  id: string;
  planCode: string;
  displayName: string;
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  maxBranches: number;
  maxMemberships: number;
  tokenBonusOnPurchase: number;
  prioritySupport: boolean;
  analyticsAccess: boolean;
  apiAccess: boolean;
  isActive: boolean;
};

function asPlan(row: unknown): PlanRow | null {
  if (!row || typeof row !== "object") {
    return null;
  }
  const item = row as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.planCode !== "string") {
    return null;
  }
  return {
    id: item.id,
    planCode: item.planCode,
    displayName: typeof item.displayName === "string" ? item.displayName : "",
    monthlyPriceTry: Number(item.monthlyPriceTry),
    yearlyPriceTry: Number(item.yearlyPriceTry),
    maxBranches: Number(item.maxBranches),
    maxMemberships: Number(item.maxMemberships),
    tokenBonusOnPurchase: Number(item.tokenBonusOnPurchase),
    prioritySupport: Boolean(item.prioritySupport),
    analyticsAccess: Boolean(item.analyticsAccess),
    apiAccess: Boolean(item.apiAccess),
    isActive: Boolean(item.isActive),
  };
}

export function SubscriptionsManagePage() {
  const [items, setItems] = useState<PlanRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const rows = await fetchAdminList("/admin/subscriptions/plans");
    setItems(rows.map(asPlan).filter((row): row is PlanRow => row !== null));
  }

  useEffect(() => {
    void load().catch((err) => {
      setError(isApiClientError(err) ? err.message : "Planlar yüklenemedi.");
    });
  }, []);

  async function save(plan: PlanRow) {
    setSavingId(plan.id);
    setError(null);
    try {
      await adminPatch(`/admin/subscriptions/plans/${plan.id}`, {
        displayName: plan.displayName,
        monthlyPriceTry: plan.monthlyPriceTry,
        yearlyPriceTry: plan.yearlyPriceTry,
        maxBranches: plan.maxBranches,
        maxMemberships: plan.maxMemberships,
        tokenBonusOnPurchase: plan.tokenBonusOnPurchase,
        prioritySupport: plan.prioritySupport,
        analyticsAccess: plan.analyticsAccess,
        apiAccess: plan.apiAccess,
        isActive: plan.isActive,
      });
      await load();
    } catch (err) {
      setError(isApiClientError(err) ? err.message : "Kayıt başarısız.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageShell title="Abonelik planları" screenId="w.admin.subscriptions.plans">
      {error ? <p className="mb-4 text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="space-y-6">
        {items.map((plan) => (
          <div
            key={plan.id}
            className="elev rounded-lg border border-border bg-card p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              {plan.planCode} · {plan.displayName}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor={`${plan.id}-name`}>Görünen ad</Label>
                <Input
                  id={`${plan.id}-name`}
                  value={plan.displayName}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === plan.id ? { ...p, displayName: e.target.value } : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor={`${plan.id}-monthly`}>Aylık (TRY)</Label>
                <Input
                  id={`${plan.id}-monthly`}
                  inputMode="numeric"
                  value={String(plan.monthlyPriceTry)}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === plan.id
                          ? { ...p, monthlyPriceTry: Number(e.target.value) || 0 }
                          : p,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor={`${plan.id}-branches`}>Max şube</Label>
                <Input
                  id={`${plan.id}-branches`}
                  inputMode="numeric"
                  value={String(plan.maxBranches)}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p) =>
                        p.id === plan.id
                          ? { ...p, maxBranches: Number(e.target.value) || 1 }
                          : p,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <Button
              type="button"
              className="mt-4"
              disabled={savingId === plan.id}
              onClick={() => void save(plan)}
            >
              Kaydet
            </Button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
