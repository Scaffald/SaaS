/**
 * HelpSearch - Help search component using Beyond UI
 */
import React, { useState } from 'react';
import { Stack, Row, Input } from '@scaffald/ui';
import { Search } from 'lucide-react';

function HelpSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // In a real app, this would trigger a search against help articles
  };

  return (
    <Stack marginBottom={24}>
      <form onSubmit={handleSearch} style={{ position: 'relative' }}>
        <Row style={{ position: 'relative' }} align="center">
          <Search
            size={20}
            style={{ position: 'absolute', left: 12, zIndex: 1 }}
            color="currentColor"
          />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ flex: 1 }}
            inputStyle={{ paddingLeft: 40, paddingRight: 16 }}
          />
        </Row>
      </form>
    </Stack>
  );
}

export default HelpSearch;
