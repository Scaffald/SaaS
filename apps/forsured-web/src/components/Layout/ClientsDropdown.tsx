/**
 * Clients Dropdown Component - Using Tamagui
 * REQ-278: Clients Dropdown Rename & Quick Jump
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Text, Button, styled } from '@unicornlove/ui';
import { Input as TextInput } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { ChevronDown, Search, Building, Users, X } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { BrokerClient } from '../../types';
import { useLexicon } from '../../contexts/LexiconContext';

interface ClientsDropdownProps {
  className?: string;
}

const DropdownMenu = styled(YStack, {
  name: 'DropdownMenu',
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: '$2',
  width: 320,
  backgroundColor: '$backgroundHover',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$3',
  shadowColor: '$shadowColor',
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  zIndex: 50,
  overflow: 'hidden',
});

const ClientItem = styled(Button, {
  name: 'ClientItem',
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: '$3',
  paddingVertical: '$2.5',
  backgroundColor: 'transparent',
  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
  textAlign: 'left',
});

export default function ClientsDropdown({ className = '' }: ClientsDropdownProps) {
  const navigate = useNavigate();
  const { clients, loading } = useClients();
  const { getManagerLabel, getContractorLabel } = useLexicon();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.company_name.toLowerCase().includes(query) ||
        client.primary_contact?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Separate GCs and Subs
  const gcs = useMemo(
    () => filteredClients.filter((c) => c.client_type === 'general_contractor'),
    [filteredClients]
  );
  const subs = useMemo(
    () => filteredClients.filter((c) => c.client_type === 'subcontractor'),
    [filteredClients]
  );

  const handleClientClick = (client: BrokerClient) => {
    setIsOpen(false);
    setSearchQuery('');
    // Navigate to unified client profile page
    navigate(`/broker/clients/${client.id}`);
  };

  const getComplianceVariant = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <YStack position="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <Button
        onPress={() => setIsOpen(!isOpen)}
        flexDirection="row"
        alignItems="center"
        gap="$2"
        paddingHorizontal="$4"
        paddingVertical="$2"
        backgroundColor="$backgroundHover"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$3"
        hoverStyle={{ backgroundColor: '$backgroundPress' }}
        data-testid="clients-dropdown-trigger"
      >
        <Users size={18} color="currentColor" />
        <Text fontWeight="500" color="$color11">Clients</Text>
        <ChevronDown
          size={16}
          color="currentColor"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <DropdownMenu data-testid="clients-dropdown-menu">
          {/* Search Input */}
          <YStack padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
            <XStack position="relative" alignItems="center">
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, zIndex: 1 }}
                color="currentColor"
              />
              <TextInput
                ref={searchInputRef}
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                paddingLeft="$9"
                paddingRight={searchQuery ? '$8' : '$3'}
                data-testid="clients-search-input"
              />
              {searchQuery && (
                <Button
                  onPress={() => setSearchQuery('')}
                  position="absolute"
                  right={8}
                  padding="$1"
                  backgroundColor="transparent"
                >
                  <X size={14} color="currentColor" />
                </Button>
              )}
            </XStack>
          </YStack>

          {/* Client Lists */}
          <YStack maxHeight={384} overflow="scroll">
            {loading ? (
              <YStack padding="$4" alignItems="center">
                <Text color="$color10">Loading clients...</Text>
              </YStack>
            ) : filteredClients.length === 0 ? (
              <YStack padding="$4" alignItems="center">
                <Text color="$color10">
                  {searchQuery ? 'No clients found' : 'No clients available'}
                </Text>
              </YStack>
            ) : (
              <YStack>
                {/* General Contractors */}
                {gcs.length > 0 && (
                  <YStack>
                    <YStack
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      backgroundColor="$backgroundHover"
                    >
                      <Text fontSize="$1" fontWeight="600" color="$color9" textTransform="uppercase">
                        {getManagerLabel(true)} ({gcs.length})
                      </Text>
                    </YStack>
                    {gcs.map((client) => (
                      <ClientItem
                        key={client.id}
                        onPress={() => handleClientClick(client)}
                        data-testid={`client-item-${client.id}`}
                      >
                        <XStack alignItems="center" gap="$3" flex={1}>
                          <YStack
                            width={32}
                            height={32}
                            backgroundColor="$blue3"
                            borderRadius="$10"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Building size={16} color="currentColor" />
                          </YStack>
                          <YStack flex={1} minWidth={0}>
                            <Text fontSize="$2" fontWeight="500" color="$color11">
                              {client.company_name}
                            </Text>
                            {client.primary_contact && (
                              <Text fontSize="$1" color="$color10">
                                {client.primary_contact}
                              </Text>
                            )}
                          </YStack>
                        </XStack>
                        <Badge
                          variant={getComplianceVariant(client.compliance_score)}
                          size="$2"
                          data-testid={`compliance-badge-${client.id}`}
                        >
                          {client.compliance_score}%
                        </Badge>
                      </ClientItem>
                    ))}
                  </YStack>
                )}

                {/* Contractors/Subcontractors */}
                {subs.length > 0 && (
                  <YStack>
                    <YStack
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      backgroundColor="$backgroundHover"
                    >
                      <Text fontSize="$1" fontWeight="600" color="$color9" textTransform="uppercase">
                        {getContractorLabel(true)} ({subs.length})
                      </Text>
                    </YStack>
                    {subs.map((client) => (
                      <ClientItem
                        key={client.id}
                        onPress={() => handleClientClick(client)}
                        data-testid={`client-item-${client.id}`}
                      >
                        <XStack alignItems="center" gap="$3" flex={1}>
                          <YStack
                            width={32}
                            height={32}
                            backgroundColor="$yellow3"
                            borderRadius="$10"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Users size={16} color="currentColor" />
                          </YStack>
                          <YStack flex={1} minWidth={0}>
                            <Text fontSize="$2" fontWeight="500" color="$color11">
                              {client.company_name}
                            </Text>
                            {client.primary_contact && (
                              <Text fontSize="$1" color="$color10">
                                {client.primary_contact}
                              </Text>
                            )}
                          </YStack>
                        </XStack>
                        <Badge
                          variant={getComplianceVariant(client.compliance_score)}
                          size="$2"
                          data-testid={`compliance-badge-${client.id}`}
                        >
                          {client.compliance_score}%
                        </Badge>
                      </ClientItem>
                    ))}
                  </YStack>
                )}
              </YStack>
            )}
          </YStack>

          {/* View All Clients Link */}
          <YStack padding="$2" borderTopWidth={1} borderTopColor="$borderColor">
            <Button
              onPress={() => {
                setIsOpen(false);
                navigate('/broker/clients');
              }}
              width="100%"
              paddingHorizontal="$3"
              paddingVertical="$2"
              fontSize="$2"
              fontWeight="500"
              color="$blue9"
              hoverStyle={{ backgroundColor: '$blue3' }}
              borderRadius="$3"
              backgroundColor="transparent"
            >
              View All Clients
            </Button>
          </YStack>
        </DropdownMenu>
      )}
    </YStack>
  );
}
