#!/bin/bash

# Script to fix Tamagui color tokens in office directory
# This script adds imports and replaces color tokens

FILES=(
  "packages/scf-core/features/office/payments/TransactionReceiptModal.tsx"
  "packages/scf-core/features/office/payments/OrganizationCreditsPanel.tsx"
  "packages/scf-core/features/office/payments/SetupIntentForm.tsx"
  "packages/scf-core/features/office/payments/OrganizationPaymentMethodsPanel.tsx"
  "packages/scf-core/features/office/payments/office-payment-analytics.tsx"
  "packages/scf-core/features/office/payments/OfficeTransactionHistory.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file"

  # Check if file needs useThemeContext import
  if ! grep -q "useThemeContext" "$file"; then
    # Add useThemeContext to imports
    if grep -q "from '@unicornlove/beyond-ui'" "$file"; then
      sed -i '' 's/from .@unicornlove\/beyond-ui./&\nimport { useThemeContext } from '\''@unicornlove\/beyond-ui'\''/' "$file"
    fi
  fi

  # Check if file needs colors import
  if ! grep -q "from '@unicornlove/beyond-ui/tokens'" "$file"; then
    # Add colors import after beyond-ui imports
    if grep -q "from '@unicornlove/beyond-ui'" "$file"; then
      sed -i '' '/from .@unicornlove\/beyond-ui./a\
import { colors } from '\''@unicornlove\/beyond-ui/tokens'\''' "$file"
    fi
  fi
done

echo "Import additions complete"
