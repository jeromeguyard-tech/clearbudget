import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { secondaryLabel, type Bucket } from "./budget";
import { useI18n } from "./i18n";

export type Category = {
  id: string;
  bucket: Bucket;
  name: string;
  position: number;
};

export function useCategories() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["categories", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,bucket,name,position")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useCategoriesByBucket() {
  const { data } = useCategories();
  return useMemo(() => {
    const out: Record<Bucket, Category[]> = { needs: [], wants: [], savings: [] };
    for (const c of data ?? []) out[c.bucket]?.push(c);
    return out;
  }, [data]);
}

/** Resolves a stored secondary_category (category id or legacy key) to a label. */
export function useCategoryLabel() {
  const { data } = useCategories();
  const { lang } = useI18n();
  const map = useMemo(() => new Map((data ?? []).map((c) => [c.id, c.name])), [data]);
  return useCallback(
    (value: string | null) => (value ? (map.get(value) ?? secondaryLabel(value, lang)) : null),
    [map, lang],
  );
}

export function useCategoryMutations() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories", userId] });
  const add = useMutation({
    mutationFn: async (row: { bucket: Bucket; name: string; position: number }) => {
      const { error } = await supabase.from("categories").insert({ ...row, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; bucket?: Bucket }) => {
      const { error } = await supabase.from("categories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { add, update, remove };
}
