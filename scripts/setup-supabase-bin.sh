#!/bin/sh
# Setup supabase binary wrapper to fix pnpm workspace binary creation issue
# This script creates a wrapper that calls pnpx supabase, since the project
# uses pnpx supabase everywhere and the local binary isn't needed.

set -e

SUPABASE_BIN_DIR="node_modules/supabase/bin"
SUPABASE_BIN="$SUPABASE_BIN_DIR/supabase"

# Create the bin directory if it doesn't exist
mkdir -p "$SUPABASE_BIN_DIR"

# Create the wrapper script if it doesn't exist or is different
if [ ! -f "$SUPABASE_BIN" ] || ! grep -q "pnpx supabase" "$SUPABASE_BIN" 2>/dev/null; then
  cat > "$SUPABASE_BIN" << 'EOF'
#!/bin/sh
# Wrapper script that calls pnpx supabase
exec pnpx supabase "$@"
EOF
  chmod +x "$SUPABASE_BIN"
  echo "✅ Created supabase binary wrapper"
else
  echo "✅ Supabase binary wrapper already exists"
fi

