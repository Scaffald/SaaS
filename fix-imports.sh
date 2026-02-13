#!/bin/bash

# Fix broken imports caused by sed replacing "import {" incorrectly
# Pattern: Remove ", useThemeContext }" that was incorrectly added

cd /Users/clay/Development/UNI-Construct

# Get list of affected files
FILES=$(grep -r ", useThemeContext }" packages/scf-core/features/profile --include="*.tsx" --include="*.ts" -l)

COUNT=0
for file in $FILES; do
  # Remove ", useThemeContext }" from all lines
  # This will remove it from broken import/type statements
  sed -i '' 's/, useThemeContext }/}/g' "$file"

  COUNT=$((COUNT + 1))
  if [ $((COUNT % 10)) -eq 0 ]; then
    echo "Fixed $COUNT files..."
  fi
done

echo "Total files fixed: $COUNT"
