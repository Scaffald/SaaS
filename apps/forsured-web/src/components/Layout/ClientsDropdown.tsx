/**
 * Clients Dropdown Component - Using Beyond UI
 * REQ-278: Clients Dropdown Rename & Quick Jump
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * Migrated from Tamagui to Beyond UI
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Row, Text, Button, Input, Chip } from '@unicornlove/beyond-ui';
import { ChevronDown, Search, Building, Users, X } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { BrokerClient } from '../../types';
import { useLexicon } from '../../contexts/LexiconContext';

interface ClientsDropdownProps {
  className?: string;
}

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

  const clientItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <Stack style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <Button
        onPress={() => setIsOpen(!isOpen)}
        variant="secondary"
        data-testid="clients-dropdown-trigger"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Users size={18} />
        <span style={{ fontWeight: 500 }}>Clients</span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Stack
          data-testid="clients-dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            width: 320,
            backgroundColor: 'var(--color-background-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            boxShadow: '0 8px 20px var(--color-shadow)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {/* Search Input */}
          <Stack
            style={{
              padding: 12,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <Row style={{ position: 'relative', alignItems: 'center' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  zIndex: 1,
                  color: 'var(--color-text-muted)',
                }}
              />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 36,
                  paddingRight: searchQuery ? 32 : 12,
                  width: '100%',
                }}
                data-testid="clients-search-input"
              />
              {searchQuery && (
                <button
                  onPress={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    padding: 4,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </Row>
          </Stack>

          {/* Client Lists */}
          <Stack style={{ maxHeight: 384, overflow: 'auto' }}>
            {loading ? (
              <Stack
                style={{ padding: 16, alignItems: 'center' }}
              >
                <Text muted>Loading clients...</Text>
              </Stack>
            ) : filteredClients.length === 0 ? (
              <Stack
                style={{ padding: 16, alignItems: 'center' }}
              >
                <Text muted>
                  {searchQuery ? 'No clients found' : 'No clients available'}
                </Text>
              </Stack>
            ) : (
              <Stack>
                {/* General Contractors */}
                {gcs.length > 0 && (
                  <Stack>
                    <Stack
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        backgroundColor: 'var(--color-background-hover)',
                      }}
                    >
                      <Text
                        size="xs"
                        weight="semibold"
                        style={{
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {getManagerLabel(true)} ({gcs.length})
                      </Text>
                    </Stack>
                    {gcs.map((client) => (
                      <button
                        key={client.id}
                        onPress={() => handleClientClick(client)}
                        style={clientItemStyle}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            'var(--color-background-hover)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            'transparent';
                        }}
                        data-testid={`client-item-${client.id}`}
                      >
                        <Row alignItems="center" gap={12} flex={1}>
                          <Row
                            alignItems="center"
                            justifyContent="center"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: 'var(--color-blue-3)',
                              borderRadius: '50%',
                            }}
                          >
                            <Building size={16} />
                          </Row>
                          <Stack flex={1} style={{ minWidth: 0 }}>
                            <Text size="sm" weight="medium">
                              {client.company_name}
                            </Text>
                            {client.primary_contact && (
                              <Text size="xs" muted>
                                {client.primary_contact}
                              </Text>
                            )}
                          </Stack>
                        </Row>
                        <Chip
                          variant={getComplianceVariant(client.compliance_score)}
                          size="sm"
                          data-testid={`compliance-badge-${client.id}`}
                        >
                          {client.compliance_score}%
                        </Chip>
                      </button>
                    ))}
                  </Stack>
                )}

                {/* Contractors/Subcontractors */}
                {subs.length > 0 && (
                  <Stack>
                    <Stack
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        backgroundColor: 'var(--color-background-hover)',
                      }}
                    >
                      <Text
                        size="xs"
                        weight="semibold"
                        style={{
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {getContractorLabel(true)} ({subs.length})
                      </Text>
                    </Stack>
                    {subs.map((client) => (
                      <button
                        key={client.id}
                        onPress={() => handleClientClick(client)}
                        style={clientItemStyle}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            'var(--color-background-hover)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            'transparent';
                        }}
                        data-testid={`client-item-${client.id}`}
                      >
                        <Row alignItems="center" gap={12} flex={1}>
                          <Row
                            alignItems="center"
                            justifyContent="center"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: 'var(--color-yellow-3)',
                              borderRadius: '50%',
                            }}
                          >
                            <Users size={16} />
                          </Row>
                          <Stack flex={1} style={{ minWidth: 0 }}>
                            <Text size="sm" weight="medium">
                              {client.company_name}
                            </Text>
                            {client.primary_contact && (
                              <Text size="xs" muted>
                                {client.primary_contact}
                              </Text>
                            )}
                          </Stack>
                        </Row>
                        <Chip
                          variant={getComplianceVariant(client.compliance_score)}
                          size="sm"
                          data-testid={`compliance-badge-${client.id}`}
                        >
                          {client.compliance_score}%
                        </Chip>
                      </button>
                    ))}
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>

          {/* View All Clients Link */}
          <Stack
            style={{
              padding: 8,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <Button
              onPress={() => {
                setIsOpen(false);
                navigate('/broker/clients');
              }}
              variant="ghost"
              style={{
                width: '100%',
                justifyContent: 'center',
                color: 'var(--color-blue-9)',
              }}
            >
              View All Clients
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
