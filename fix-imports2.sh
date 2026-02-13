#!/bin/bash

# Fix double closing braces in imports
cd /Users/clay/Development/UNI-Construct

# Fix pattern: } } from -> } from
find packages/scf-core/features/profile -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' 's/ } } from/ } from/g' "$file"
done

# Fix pattern: } ) { -> ) {
find packages/scf-core/features/profile -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' 's/^} ) {$/) {/g' "$file"
done

echo "Fixed double braces"
