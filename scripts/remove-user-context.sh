#!/bin/bash

# Script to remove userContext and replace with constants

echo "Replacing getCurrentUserId() and getClientUserId() with USER_ID constant..."

# Find all TypeScript/TSX files
find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  # Skip the userContext file itself
  if [[ "$file" == "lib/userContext.ts" ]]; then
    continue
  fi

  # Replace imports
  sed -i "s|import { getCurrentUserId } from '@/lib/userContext';|import { USER_ID } from '@/lib/constants';|g" "$file"
  sed -i "s|import { getClientUserId } from '@/lib/userContext';|import { USER_ID } from '@/lib/constants';|g" "$file"
  sed -i "s|import { getClientUserId, setClientUserId } from '@/lib/userContext';|import { USER_ID } from '@/lib/constants';|g" "$file"
  sed -i "s|import { getCurrentUserId, getClientUserId } from '@/lib/userContext';|import { USER_ID } from '@/lib/constants';|g" "$file"

  # Replace function calls
  sed -i "s|const userId = getCurrentUserId();|const userId = USER_ID;|g" "$file"
  sed -i "s|const userId = getClientUserId();|const userId = USER_ID;|g" "$file"
  sed -i "s|getCurrentUserId()|USER_ID|g" "$file"
  sed -i "s|getClientUserId()|USER_ID|g" "$file"
done

echo "Done! All userContext references have been replaced."
