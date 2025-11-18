import { useQuery } from "@tanstack/react-query";

import { supabase } from "../supabase/client";

function usePostQuery() {
  // Using supabase directly from import

  const queryFn = async () => {
    // Type instantiation is excessively deep - posts table may not exist in database types yet
    // biome-ignore lint/suspicious/noExplicitAny: Type instantiation is excessively deep, requires any cast
    const result = await (supabase as any)
      .schema("core")
      .from("posts")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(4);
    
    return result.data || [];
  };

  return useQuery({
    queryKey: ["posts"],
    queryFn,
  });
}

export default usePostQuery;
