import { useMemo, useState } from "react";

import { useAuth } from "./auth";
import { allocation, monthlyIncome, type Bucket } from "./budget";
import { useIncome, useRecurring, useTransactions } from "./queries";

export type Range = "month" | "year";

export function useBudget() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const income = useIncome(userId);
  const recurring = useRecurring(userId);
  const transactions = useTransactions(userId);

  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [range, setRange] = useState<Range>("month");
  const [bucketFilter, setBucketFilter] = useState<Bucket | "all">("all");
  const [secondaryFilter, setSecondaryFilter] = useState<string | "all">("all");

  const baseMonthly = income.data ? monthlyIncome(income.data) : 0;
  const multiplier = range === "month" ? 1 : 12;
  const targets = useMemo(() => {
    const single = allocation(baseMonthly);
    return {
      needs: single.needs * multiplier,
      wants: single.wants * multiplier,
      savings: single.savings * multiplier,
    };
  }, [baseMonthly, multiplier]);

  const recurringRows = useMemo(() => {
    const rows = recurring.data ?? [];
    if (range === "month") return rows;
    return rows;
  }, [recurring.data, range]);

  const inPeriod = useMemo(() => {
    const rows = transactions.data ?? [];
    return rows.filter((row) => {
      const date = new Date(`${row.occurred_on}T00:00:00`);
      if (date.getFullYear() !== year) return false;
      if (range === "month" && date.getMonth() !== monthIndex) return false;
      return true;
    });
  }, [transactions.data, year, monthIndex, range]);

  const filtered = useMemo(
    () =>
      inPeriod.filter(
        (row) =>
          (bucketFilter === "all" || row.primary_category === bucketFilter) &&
          (secondaryFilter === "all" || row.secondary_category === secondaryFilter),
      ),
    [inPeriod, bucketFilter, secondaryFilter],
  );

  const recurringByBucket = useMemo(() => {
    const totals: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
    for (const row of recurringRows) {
      totals[row.primary_category] += Number(row.amount) * multiplier;
    }
    return totals;
  }, [recurringRows, multiplier]);

  const actuals = useMemo(() => {
    const totals: Record<Bucket, number> = { ...recurringByBucket };
    for (const row of inPeriod) {
      totals[row.primary_category] += Number(row.amount);
    }
    return totals;
  }, [inPeriod, recurringByBucket]);

  const bySecondary = useMemo(() => {
    const totals = new Map<string, { bucket: Bucket; amount: number }>();
    const push = (bucket: Bucket, key: string | null, amount: number) => {
      const id = key ?? bucket;
      const current = totals.get(id) ?? { bucket, amount: 0 };
      current.amount += amount;
      totals.set(id, current);
    };
    for (const row of recurringRows) {
      push(row.primary_category, row.secondary_category, Number(row.amount) * multiplier);
    }
    for (const row of inPeriod) push(row.primary_category, row.secondary_category, Number(row.amount));
    return [...totals.entries()].sort((a, b) => b[1].amount - a[1].amount);
  }, [recurringRows, inPeriod, multiplier]);

  const [evolutionMode, setEvolutionMode] = useState<"month" | "year">("month");

  /** Monthly (selected year) or yearly totals, respecting the category filters. */
  const evolution = useMemo(() => {
    const match = (bucket: Bucket, sub: string | null) =>
      (bucketFilter === "all" || bucket === bucketFilter) &&
      (secondaryFilter === "all" || sub === secondaryFilter);
    const recurringMonthly = recurringRows
      .filter((row) => match(row.primary_category, row.secondary_category))
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const rows = (transactions.data ?? []).filter((row) =>
      match(row.primary_category, row.secondary_category),
    );
    if (evolutionMode === "month") {
      const totals = Array.from({ length: 12 }, () => recurringMonthly);
      for (const row of rows) {
        const date = new Date(`${row.occurred_on}T00:00:00`);
        if (date.getFullYear() === year) totals[date.getMonth()]! += Number(row.amount);
      }
      return totals.map((amount, index) => ({ key: index, amount }));
    }
    const years = new Set<number>([year, now.getFullYear()]);
    for (const row of rows) years.add(Number(row.occurred_on.slice(0, 4)));
    const sorted = [...years].sort();
    const range = Array.from(
      { length: sorted.at(-1)! - sorted[0]! + 1 },
      (_, i) => sorted[0]! + i,
    );
    return range.map((y) => ({
      key: y,
      amount:
        recurringMonthly * 12 +
        rows
          .filter((row) => Number(row.occurred_on.slice(0, 4)) === y)
          .reduce((sum, row) => sum + Number(row.amount), 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringRows, transactions.data, bucketFilter, secondaryFilter, evolutionMode, year]);

  return {
    userId,
    evolution,
    evolutionMode,
    setEvolutionMode,
    loading: income.isLoading || recurring.isLoading || transactions.isLoading,
    income: income.data,
    baseMonthly,
    periodIncome: baseMonthly * multiplier,
    targets,
    actuals,
    bySecondary,
    recurringRows,
    transactions: filtered,
    allTransactions: transactions.data ?? [],
    monthIndex,
    setMonthIndex,
    year,
    setYear,
    range,
    setRange,
    bucketFilter,
    setBucketFilter,
    secondaryFilter,
    setSecondaryFilter,
  };
}
