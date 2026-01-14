import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Building,
  AlertTriangle,
  CheckCircle,
  Users,
  ChevronDown,
  Loader2,
  UserPlus,
  X,
  Mail,
  Copy,
  Clock,
} from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Card } from '@unicornlove/beyond-ui';
import Button from '../Common/Button';
import SubcontractorDetailModal from './SubcontractorDetailModal';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrganizationId } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  createRelationshipInvitation,
  getUserInvitations,
  type RelationshipInvitation,
} from '../../lib/relationshipInvitations';
import { generateRelationshipCode } from '../../lib/connectionCodes';

type ComplianceStatus = 'compliant' | 'warning' | 'critical' | 'all';

// Database schema: name (contact person), company (company name)
interface Subcontractor {
  id: string;
  organization_id: string;
  name: string; // Contact person name (from DB)
  company: string; // Company name (from DB)
  // Legacy fields for compatibility - mapped from DB fields
  company_name: string; // Mapped from 'company'
  contact_name: string; // Mapped from 'name'
  contact_info: {
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  trade_type?: string;
  license_number?: string;
  status?: string;
  compliance_score?: number;
  risk_level?: string;
  last_activity_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export default function SubcontractorsPage() {
  const { forsured } = useDatabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for data fetching
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'issues'>(
    'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<
    string | null
  >(null);

  // Add subcontractor modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Invitation state
  const [managerCode, setManagerCode] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState<RelationshipInvitation[]>([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Fetch organization ID on mount
  useEffect(() => {
    async function fetchOrg() {
      if (user?.id) {
        const orgId = await getUserOrganizationId(user.id);
        setOrganizationId(orgId);
      }
    }
    fetchOrg();
  }, [user?.id]);

  // Generate/fetch manager's MGR- code
  useEffect(() => {
    async function initManagerCode() {
      if (!user?.id) return;

      try {
        // Generate MGR- code
        const code = generateRelationshipCode('MGR');
        setManagerCode(code);

        // Fetch pending invitations
        const invitations = await getUserInvitations(user.id, 'pending');
        const contractorInvites = invitations.filter(
          inv => inv.invitee_type === 'subcontractor' && inv.inviter_type === 'manager'
        );
        setPendingInvitations(contractorInvites);
      } catch (error) {
        console.error('[SubcontractorsPage] Error initializing manager code:', error);
      }
    }
    initManagerCode();
  }, [user?.id]);

  // Fetch subcontractors - reusable function
  const fetchSubcontractors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await forsured('subcontractors')
        .select('*')
        .order('company', { ascending: true }); // Use 'company' column from DB

      if (queryError) {
        throw queryError;
      }

      // Map database fields to component interface
      const mappedData = (data || []).map((sub: any) => ({
        ...sub,
        company_name: sub.company || '', // Map 'company' to 'company_name' for compatibility
        contact_name: sub.name || '', // Map 'name' to 'contact_name' for compatibility
      }));

      setSubcontractors(mappedData);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || 'Failed to load subcontractors');
    } finally {
      setLoading(false);
    }
  }, [forsured]);

  // Fetch subcontractors on mount
  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  // Handle invitation submit
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !organizationId) {
      toast.error('Unable to send invitation. Please ensure you are logged in.');
      return;
    }

    if (!inviteFormData.email || !inviteFormData.name) {
      toast.error('Contractor email and name are required');
      return;
    }

    setSendingInvite(true);

    try {
      const invitation = await createRelationshipInvitation({
        inviterOrgId: organizationId,
        inviterUserId: user.id,
        inviterType: 'manager',
        inviteeEmail: inviteFormData.email.trim(),
        inviteeName: inviteFormData.name.trim(),
        inviteeCompany: inviteFormData.company.trim(),
        inviteePhone: inviteFormData.phone.trim(),
        inviteeType: 'subcontractor',
        connectionMethod: 'both',
      });

      toast.success('Contractor invitation sent!', {
        description: `${inviteFormData.name} can connect using code ${invitation.relationship_code}`,
      });

      // Reset form
      setInviteFormData({
        email: '',
        name: '',
        company: '',
        phone: '',
      });

      // Refresh pending invitations
      if (user?.id) {
        const invitations = await getUserInvitations(user.id, 'pending');
        const contractorInvites = invitations.filter(
          inv => inv.invitee_type === 'subcontractor' && inv.inviter_type === 'manager'
        );
        setPendingInvitations(contractorInvites);
      }
    } catch (error) {
      console.error('[SubcontractorsPage] Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  // Copy manager code to clipboard
  const copyManagerCode = () => {
    if (!managerCode) return;

    navigator.clipboard.writeText(managerCode);
    toast.success('Manager code copied to clipboard');
  };

  // Handle form submission
  const handleAddSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationId) {
      toast.error('No organization found. Please try again.');
      return;
    }

    if (!formData.company.trim() || !formData.name.trim()) {
      toast.error('Company name and contact name are required.');
      return;
    }

    setSubmitting(true);
    try {
      // Only insert columns that exist in the database table
      // compliance_score, status, risk_level are derived from other tables
      const { error: insertError } = await forsured('subcontractors').insert({
        company: formData.company.trim(),
        name: formData.name.trim(),
        organization_id: organizationId,
        contact_info: {
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
        },
      });

      if (insertError) {
        throw insertError;
      }

      toast.success('Subcontractor added successfully!');
      setShowAddModal(false);
      setFormData({ company: '', name: '', email: '', phone: '' });
      fetchSubcontractors(); // Refresh the list
    } catch (err) {
      const error = err as Error;
      console.error('[SubcontractorsPage] Error adding subcontractor:', error);
      toast.error(error.message || 'Failed to add subcontractor');
    } finally {
      setSubmitting(false);
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ company: '', name: '', email: '', phone: '' });
  };

  // Derive compliance status from compliance_score
  const subcontractorsWithStatus = useMemo(() => {
    return subcontractors.map((sub) => {
      let complianceStatus: 'compliant' | 'warning' | 'critical';
      const score = sub.compliance_score ?? 0;
      if (sub.risk_level === 'critical' || score < 60) {
        complianceStatus = 'critical';
      } else if (sub.risk_level === 'medium' || score < 80) {
        complianceStatus = 'warning';
      } else {
        complianceStatus = 'compliant';
      }

      return {
        ...sub,
        complianceStatus,
      };
    });
  }, [subcontractors]);

  const filteredAndSortedSubs = useMemo(() => {
    const filtered = subcontractorsWithStatus.filter((sub) => {
      const matchesSearch =
        searchQuery === '' ||
        sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.contact_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || sub.complianceStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.company_name.localeCompare(b.company_name);
      } else if (sortBy === 'compliance') {
        comparison = (b.compliance_score ?? 0) - (a.compliance_score ?? 0);
      } else if (sortBy === 'issues') {
        // Sort by risk level (critical > medium > low) then by compliance score
        const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = (riskOrder[a.risk_level] ?? 4) - (riskOrder[b.risk_level] ?? 4);
        if (comparison === 0) {
          comparison = (a.compliance_score ?? 0) - (b.compliance_score ?? 0);
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [subcontractorsWithStatus, searchQuery, selectedStatus, sortBy, sortOrder]);

  const statusCounts = useMemo(() => {
    return {
      compliant: subcontractorsWithStatus.filter((s) => s.complianceStatus === 'compliant')
        .length,
      warning: subcontractorsWithStatus.filter((s) => s.complianceStatus === 'warning')
        .length,
      critical: subcontractorsWithStatus.filter((s) => s.complianceStatus === 'critical')
        .length,
    };
  }, [subcontractorsWithStatus]);

  const getStatusColorProps = (status: 'compliant' | 'warning' | 'critical'): React.CSSProperties => {
    switch (status) {
      case 'compliant':
        return { borderColor: 'var(--color-green8)', backgroundColor: 'var(--color-green2)' };
      case 'warning':
        return { borderColor: 'var(--color-orange8)', backgroundColor: 'var(--color-orange2)' };
      case 'critical':
        return { borderColor: 'var(--color-red8)', backgroundColor: 'var(--color-red2)' };
    }
  };

  const getStatusIcon = (status: 'compliant' | 'warning' | 'critical') => {
    switch (status) {
      case 'compliant':
        return <CheckCircle color="var(--color-green10)" size={20} />;
      case 'warning':
        return <AlertTriangle color="var(--color-orange10)" size={20} />;
      case 'critical':
        return <AlertTriangle color="var(--color-red10)" size={20} />;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Stack style={{ alignItems: 'center', gap: 16 }}>
          <Loader2 size={32} color="var(--color-blue10)" className="animate-spin" />
          <Text style={{ color: 'var(--color-11)' }}>Loading subcontractors...</Text>
        </Stack>
      </Stack>
    );
  }

  // Show error state
  if (error) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Stack style={{ alignItems: 'center' }}>
          <AlertTriangle color="var(--color-red10)" size={48} style={{ marginBottom: 16 }} />
          <H3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>
            Failed to load subcontractors
          </H3>
          <Text style={{ color: 'var(--color-11)' }}>{error.message}</Text>
        </Stack>
      </Stack>
    );
  }

  // Reusable modal component
  const addSubcontractorModal = showAddModal && (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onPress={handleCloseModal}
    >
      <Card
        style={{
          backgroundColor: 'var(--background)',
          padding: 24,
          borderRadius: 8,
          width: 500,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onPress={(e: React.MouseEvent) => e.stopPropagation()}
        data-testid="add-subcontractor-modal"
      >
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--color-12)' }}>
            Add Subcontractor
          </Text>
          <Row
            onPress={handleCloseModal}
            style={{
              padding: 8,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            <X size={20} color="var(--color-11)" />
          </Row>
        </Row>

        <form onSubmit={handleAddSubcontractor}>
          <Stack style={{ gap: 16 }}>
            <Stack style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                Company Name *
              </Text>
              <input
                placeholder="Enter company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--color-12)',
                }}
              />
            </Stack>

            <Stack style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                Contact Name *
              </Text>
              <input
                placeholder="Enter contact person's name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--color-12)',
                }}
              />
            </Stack>

            <Stack style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                Email
              </Text>
              <input
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--color-12)',
                }}
              />
            </Stack>

            <Stack style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                Phone
              </Text>
              <input
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--color-12)',
                }}
              />
            </Stack>

            <Row style={{ justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button
                variant="outlined"
                onPress={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }}
                disabled={submitting || !formData.company.trim() || !formData.name.trim()}
              >
                {submitting ? (
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <Loader2 size={16} className="animate-spin" />
                    <Text style={{ color: 'white' }}>Adding...</Text>
                  </Row>
                ) : (
                  'Add Subcontractor'
                )}
              </Button>
            </Row>
          </Stack>
        </form>
      </Card>
    </div>
  );

  // Show empty state when no subcontractors exist
  if (subcontractors.length === 0) {
    return (
      <>
        <Stack style={{ gap: 24 }}>
          <Stack>
            <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-12)' }}>
              Subcontractors
            </H1>
            <Text style={{ color: 'var(--color-11)', fontSize: 18, marginTop: 4 }}>
              Manage your project subcontractors
            </Text>
          </Stack>
          <Stack style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}>
            <Stack style={{ alignItems: 'center', gap: 16 }}>
              <UserPlus size={48} color="var(--color-10)" />
              <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                No Subcontractors Yet
              </Text>
              <Text style={{ color: 'var(--color-11)', textAlign: 'center', maxWidth: 400 }}>
                Invite subcontractors to your projects to track their compliance and insurance requirements.
              </Text>
              <Button
                color="primary"
                iconStart={Plus}
                onPress={() => setShowAddModal(true)}
              >
                Add Subcontractor
              </Button>
            </Stack>
          </Stack>
        </Stack>
        {addSubcontractorModal}
      </>
    );
  }

  return (
    <Stack style={{ gap: 24 }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-12)' }}>
            Subcontractors
          </H1>
          <Text style={{ color: 'var(--color-11)', fontSize: 18, marginTop: 4 }}>
            Manage {subcontractors.length} subcontractors across your projects
          </Text>
        </Stack>
        <Button
          color="primary"
          iconStart={Plus}
          onPress={() => setShowAddModal(true)}
        >
          Add Subcontractor
        </Button>
      </Row>

      {/* Contractor Invitation Section */}
      <Card style={{ backgroundColor: 'var(--background)', borderRadius: 8, borderWidth: 1, borderColor: 'var(--color-border)', padding: 20 }}>
        <Stack style={{ gap: 16 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack style={{ gap: 4 }}>
              <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                Invite Contractors
              </H3>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                Invite contractors to connect with your projects
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outlined"
              onPress={() => setShowInviteSection(!showInviteSection)}
            >
              {showInviteSection ? 'Hide' : 'Show Invitations'}
            </Button>
          </Row>

          {showInviteSection && (
            <Stack style={{ gap: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              {/* Manager Code Display */}
              <Stack style={{ gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Your Manager Code
                </Text>
                <Row style={{ gap: 8, alignItems: 'center' }}>
                  <Card
                    style={{
                      backgroundColor: 'var(--color-blue2)',
                      borderColor: 'var(--color-blue6)',
                      borderWidth: 1,
                      borderRadius: 6,
                      padding: 12,
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--color-blue11)',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                      }}
                    >
                      {managerCode || 'Loading...'}
                    </Text>
                  </Card>
                  <Button
                    size="sm"
                    iconStart={Copy}
                    onPress={copyManagerCode}
                    disabled={!managerCode}
                  >
                    Copy
                  </Button>
                </Row>
                <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                  Share this code with contractors so they can connect with you
                </Text>
              </Stack>

              {/* Invitation Form */}
              <Stack style={{ gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                  Send Invitation Email
                </Text>
                <form onSubmit={handleSendInvitation}>
                  <Stack style={{ gap: 12 }}>
                    <Stack style={{ gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                        Contractor Email *
                      </Text>
                      <input
                        placeholder="contractor@example.com"
                        value={inviteFormData.email}
                        onChange={(e) =>
                          setInviteFormData({ ...inviteFormData, email: e.target.value })
                        }
                        disabled={sendingInvite}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 14,
                          color: 'var(--color-12)',
                        }}
                      />
                    </Stack>

                    <Stack style={{ gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                        Contractor Name *
                      </Text>
                      <input
                        placeholder="John Doe"
                        value={inviteFormData.name}
                        onChange={(e) =>
                          setInviteFormData({ ...inviteFormData, name: e.target.value })
                        }
                        disabled={sendingInvite}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 14,
                          color: 'var(--color-12)',
                        }}
                      />
                    </Stack>

                    <Row style={{ gap: 12, flexWrap: 'wrap' }}>
                      <Stack style={{ gap: 8, flex: 1, minWidth: 200 }}>
                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                          Company (Optional)
                        </Text>
                        <input
                          placeholder="Acme Construction"
                          value={inviteFormData.company}
                          onChange={(e) =>
                            setInviteFormData({ ...inviteFormData, company: e.target.value })
                          }
                          disabled={sendingInvite}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            fontSize: 14,
                            color: 'var(--color-12)',
                          }}
                        />
                      </Stack>

                      <Stack style={{ gap: 8, flex: 1, minWidth: 200 }}>
                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)' }}>
                          Phone (Optional)
                        </Text>
                        <input
                          placeholder="(555) 123-4567"
                          value={inviteFormData.phone}
                          onChange={(e) =>
                            setInviteFormData({ ...inviteFormData, phone: e.target.value })
                          }
                          disabled={sendingInvite}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            fontSize: 14,
                            color: 'var(--color-12)',
                          }}
                        />
                      </Stack>
                    </Row>

                    <Button
                      size="sm"
                      color="primary"
                      iconStart={sendingInvite ? undefined : Mail}
                      disabled={sendingInvite || !inviteFormData.email || !inviteFormData.name}
                      onPress={handleSendInvitation}
                    >
                      {sendingInvite ? (
                        <Row style={{ alignItems: 'center', gap: 8 }}>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending...</span>
                        </Row>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </Stack>
                </form>
              </Stack>

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <Stack style={{ gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-12)' }}>
                    Pending Invitations ({pendingInvitations.length})
                  </Text>
                  <Stack style={{ gap: 8 }}>
                    {pendingInvitations.map(inv => (
                      <Card
                        key={inv.id}
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--color-border)',
                          borderWidth: 1,
                          borderRadius: 6,
                          padding: 12,
                        }}
                      >
                        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack style={{ gap: 4, flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)' }}>
                              {inv.metadata?.name || inv.invitee_email}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                              {inv.invitee_email}
                            </Text>
                            {inv.metadata?.company && (
                              <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                                {inv.metadata.company}
                              </Text>
                            )}
                          </Stack>
                          <Row style={{ gap: 8, alignItems: 'center' }}>
                            <Clock size={14} color="var(--color-orange10)" />
                            <Text style={{ fontSize: 12, color: 'var(--color-orange10)' }}>
                              Pending
                            </Text>
                          </Row>
                        </Row>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </Card>

      <Row style={{ alignItems: 'center', gap: 16, fontSize: 14 }}>
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-green10)' }} />
          <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>
            {statusCounts.compliant}
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>Compliant</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-orange10)' }} />
          <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>
            {statusCounts.warning}
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>Issues</Text>
        </Row>
        <div style={{ height: 16, width: 1, backgroundColor: 'var(--color-border)' }} />
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: 'var(--color-red10)' }} />
          <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>
            {statusCounts.critical}
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>Critical</Text>
        </Row>
      </Row>

      <Card style={{ backgroundColor: 'var(--background)', borderRadius: 8, borderWidth: 1, borderColor: 'var(--color-border)', padding: 16, gap: 16 }}>
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
              <Search
                color="var(--color-10)"
                size={20}
              />
            </div>
            <input
              type="text"
              placeholder="Search subcontractors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '10px',
                paddingBottom: '10px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-12)',
              }}
            />
          </div>
          <Row
            onPress={() => setShowFilters(!showFilters)}
            style={{
              alignItems: 'center',
              gap: 8,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: showFilters ? 'var(--color-blue2)' : 'var(--background)',
              borderColor: showFilters ? 'var(--color-blue10)' : 'var(--color-border)',
              color: showFilters ? 'var(--color-blue10)' : 'var(--color-11)',
              cursor: 'pointer',
            }}
          >
            <Filter size={18} />
            <Text style={{ fontSize: 14, fontWeight: 500, color: showFilters ? 'var(--color-blue10)' : 'var(--color-11)' }}>
              Filters
            </Text>
          </Row>
        </Row>

        {showFilters && (
          <Stack style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, gap: 16 }}>
            <Row style={{ flexWrap: 'wrap', gap: 16 }}>
              <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    marginBottom: 8,
                  }}
                >
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ComplianceStatus)
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--color-12)',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="compliant">Compliant</option>
                  <option value="warning">Has Issues</option>
                  <option value="critical">Critical Issues</option>
                </select>
              </Stack>

              <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--color-11)',
                    marginBottom: 8,
                  }}
                >
                  Sort By
                </label>
                <Row style={{ gap: 8 }}>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as 'name' | 'compliance' | 'issues'
                      )
                    }
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--color-12)',
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="compliance">Compliance Score</option>
                    <option value="issues">Issues</option>
                  </select>
                  <div
                    onPress={() =>
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    style={{
                      padding: 8,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--color-border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronDown
                      size={16}
                      color="var(--color-11)"
                      style={{
                        transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                </Row>
              </Stack>
            </Row>
          </Stack>
        )}

        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
          Showing{' '}
          <span style={{ fontWeight: 600, color: 'var(--color-12)' }}>
            {filteredAndSortedSubs.length}
          </span>{' '}
          of {subcontractors.length} subcontractors
        </Text>
      </Card>

      <Row style={{ flexWrap: 'wrap', gap: 16 }}>
        {filteredAndSortedSubs.map((sub) => (
          <Card
            key={sub.id}
            onPress={() => setSelectedSubcontractor(sub.id)}
            style={{
              borderWidth: 2,
              borderStyle: 'solid',
              ...getStatusColorProps(sub.complianceStatus),
              cursor: 'pointer',
              borderRadius: 8,
              flex: 1,
              minWidth: 'calc(33.333% - 11px)',
            }}
          >
            <Stack style={{ padding: 20 }}>
              <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <Stack style={{ flex: 1 }}>
                  <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)', marginBottom: 4 }}>
                    {sub.company_name}
                  </H3>
                  <Text style={{ fontSize: 14, color: 'var(--color-10)' }}>{sub.trade_type}</Text>
                </Stack>
                {getStatusIcon(sub.complianceStatus)}
              </Row>

              <Stack style={{ marginBottom: 16 }}>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                    Compliance Score
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-12)' }}>
                    {sub.compliance_score != null ? `${Math.round(sub.compliance_score)}%` : 'No data yet'}
                  </Text>
                </Row>
                {sub.compliance_score != null && (
                  <div style={{ width: '100%', height: 8, backgroundColor: 'var(--color-gray8)', borderRadius: 9999 }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 9999,
                        backgroundColor:
                          sub.compliance_score >= 90
                            ? 'var(--color-green10)'
                            : sub.compliance_score >= 70
                              ? 'var(--color-orange10)'
                              : 'var(--color-red10)',
                        width: `${sub.compliance_score}%`,
                      }}
                    />
                  </div>
                )}
              </Stack>

              <Row style={{ flexWrap: 'wrap', gap: 12 }}>
                <Card style={{ padding: 8, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 4, flex: 1, minWidth: 'calc(50% - 6px)', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-12)', textTransform: 'capitalize' }}>
                    {sub.risk_level}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>Risk Level</Text>
                </Card>
                <Card style={{ padding: 8, backgroundColor: 'var(--color-backgroundHover)', borderRadius: 4, flex: 1, minWidth: 'calc(50% - 6px)', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: sub.status === 'active' ? 'var(--color-green10)' : 'var(--color-11)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {sub.status}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>Status</Text>
                </Card>
              </Row>

              {sub.contact_name && (
                <Stack style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <Users size={14} color="var(--color-10)" />
                    <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                      {sub.contact_name}
                    </Text>
                  </Row>
                </Stack>
              )}
            </Stack>
          </Card>
        ))}
      </Row>

      {filteredAndSortedSubs.length === 0 && (
        <Card style={{ alignItems: 'center', paddingTop: 64, paddingBottom: 64, backgroundColor: 'var(--background)', borderRadius: 8, borderWidth: 1, borderColor: 'var(--color-border)' }}>
          <Building color="var(--color-10)" size={64} style={{ marginBottom: 16 }} />
          <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>
            No subcontractors found
          </H3>
          <Text style={{ color: 'var(--color-11)' }}>
            Try adjusting your filters or search criteria
          </Text>
        </Card>
      )}

      <SubcontractorDetailModal
        subcontractorId={selectedSubcontractor}
        isOpen={!!selectedSubcontractor}
        onClose={() => setSelectedSubcontractor(null)}
      />

      {addSubcontractorModal}
    </Stack>
  );
}
