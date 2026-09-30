import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Bucket, IncomeSettings } from "./budget";

export type Profile = {
  id: string;
  display_name: string | null;
  language: "fr" | "en";
  theme: "light" | "dark";
  font_family: "modern" | "classic" | "rounded";
  accent: string;
  currency: string;
  onboarded: boolean;
};

export type RecurringExpense = {
  id: string;
  label: string;
  amount: number;
  debit_day: number;
  bank_account: string | null;
  primary_category: Bucket;
  secondary_category: string | null;
};

export type Transaction = {
  id: string;
  amount: number;
  description: string;
  primary_category: Bucket;
  secondary_category: string | null;
  comment: string | null;
  occurred_on: string;
  source: string;
};

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Profile;
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId! })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return created as Profile;
    },
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

export function useIncome(userId: string | undefined) {
  return useQuery({
    queryKey: ["income", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_settings")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as (IncomeSettings & { user_id: string }) | null) ?? null;
    },
  });
}

export function useSaveIncome(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (income: IncomeSettings) => {
      const { error } = await supabase.from("income_settings").upsert({
        user_id: userId!,
        ...income,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income", userId] }),
  });
}

export function useRecurring(userId: string | undefined) {
  return useQuery({
    queryKey: ["recurring", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .order("debit_day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RecurringExpense[];
    },
  });
}

export function useSaveRecurring(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<RecurringExpense, "id">) => {
      const { error } = await supabase
        .from("recurring_expenses")
        .insert({ ...row, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring", userId] }),
  });
}

export function useDeleteRecurring(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring", userId] }),
  });
}

export function useTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useAddTransaction(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<Transaction, "id" | "source">) => {
      const { error } = await supabase
        .from("transactions")
        .insert({ ...row, user_id: userId!, source: "daily" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", userId] }),
  });
}

export function useDeleteTransaction(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", userId] }),
  });
}
