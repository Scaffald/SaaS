import { useQuery } from "@tanstack/react-query";

import { supabase } from "../supabase/client";

function usePostQuery() {
  // Using supabase directly from import

  const queryFn = async () => {
    const result = await supabase
      .schema("core")
      // @ts-expect-error - posts table may not exist in database types yet
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
