/**
 * HelpSearch - Help search component using Tamagui
 */
import React, { useState } from 'react';
import { YStack, XStack } from '@unicornlove/ui';
import { Input as TextInput } from '@unicornlove/ui';
import { Search } from 'lucide-react';

function HelpSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // In a real app, this would trigger a search against help articles
  };

  return (
    <YStack marginBottom="$6">
      <YStack as="form" onSubmit={handleSearch} position="relative">
        <XStack position="relative" alignItems="center">
          <Search
            size={20}
            style={{ position: 'absolute', left: 12, zIndex: 1 }}
            color="currentColor"
          />
          <TextInput
            type="text"
            placeholder="Search help articles..."
            paddingLeft="$10"
            paddingRight="$4"
            paddingVertical="$2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </XStack>
      </YStack>
    </YStack>
  );
}

export default HelpSearch;
