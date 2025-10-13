import { useQuery } from "@tanstack/react-query";

import type { Database } from "@app/supabase/types";

import { supabase } from "./supabase/client";
import { useUser } from "./useUser";

export type OrganizationMembership = {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  user_id: string;
  role: string;
  joined_at: string;
};

export const useOrganizations = () => {
  // Using supabase directly from import
  const { user } = useUser();

  return useQuery({
    queryKey: ["organizations", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<OrganizationMembership[]> => {
      if (!user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("team_members")
        .select(`
          user_id,
          created_at,
          teams!inner(
            organizations!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Transform the data to match the expected format
      // biome-ignore lint/suspicious/noExplicitAny: Complex nested Supabase query type
      return (data ?? []).map((item: any) => ({
        organization_id: item.teams?.organizations?.id ?? "",
        organization_name: item.teams?.organizations?.name ?? "",
        organization_slug: item.teams?.organizations?.slug ?? "",
        user_id: item.user_id,
        role: "member",
        joined_at: item.created_at,
      })).sort((a, b) =>
        a.organization_name.localeCompare(b.organization_name)
      );
    },
  });
};
