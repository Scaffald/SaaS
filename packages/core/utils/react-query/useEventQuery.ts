import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { supabase } from "../supabase/client";
import { useUser } from "../useUser";

const getEvents = async (
  supabase: SupabaseClient,
  userId: string | undefined,
) => {
  if (!userId) return { data: [] };

  return supabase
    .from("events")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(4);
};

function useEventsQuery() {
  // Using supabase directly from import
  const { user } = useUser();

  const queryFn = async () => {
    return getEvents(supabase, user?.id).then((result) => result.data);
  };

  return useQuery({
    queryKey: ["events"],
    queryFn,
  });
}

export default useEventsQuery;
