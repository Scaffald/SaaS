#!/bin/bash
# Check if Supabase is running
# Returns 0 if running, 1 if not

set +e  # Don't exit on error - we want to return status

# Check if curl is available
if ! command -v curl &> /dev/null; then
  echo "Error: curl is required to check Supabase status" >&2
  exit 1
fi

# Check if Supabase API is responding
if curl -s --max-time 2 http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
  exit 0  # Supabase is running
else
  exit 1  # Supabase is not running
fi

