/**
 * REQ-165: Compliance Requirements Management System
 * Template selector for quick requirement creation
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Stack, Row, Text, Button, Card } from '@unicornlove/beyond-ui';
import { ComplianceRequirement, CoverageType } from '../../lib/compliance/types';
import { listRequirements } from '../../lib/compliance/requirementService';

interface TemplateSelectorProps {
  organizationId: string;
  userId: string;
  onSelectTemplate: (template: ComplianceRequirement) => void;
  onCancel?: () => void;
}

export default function TemplateSelector({
  organizationId,
  userId,
  onSelectTemplate,
  onCancel
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CoverageType | 'all'>('all');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await listRequirements({
        filters: {
          is_template: true,
          organization_id: organizationId
        }
      });

      setTemplates(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function getTypeIcon(type: CoverageType): string {
    const icons = {
      [CoverageType.GENERAL_LIABILITY]: '',
      [CoverageType.WORKERS_COMP]: '',
      [CoverageType.AUTO_LIABILITY]: '',
      [CoverageType.UMBRELLA]: '',
      [CoverageType.CUSTOM]: ''
    };
    return icons[type];
  }

  function getTypeLabel(type: CoverageType): string {
    const labels = {
      [CoverageType.GENERAL_LIABILITY]: 'General Liability',
      [CoverageType.WORKERS_COMP]: 'Workers Comp',
      [CoverageType.AUTO_LIABILITY]: 'Auto Liability',
      [CoverageType.UMBRELLA]: 'Umbrella',
      [CoverageType.CUSTOM]: 'Custom'
    };
    return labels[type];
  }

  function formatCoverage(template: ComplianceRequirement): string {
    const { coverage_limits } = template.requirement_definition;
    if (!coverage_limits.per_occurrence && !coverage_limits.aggregate) {
      return 'Statutory Limits';
    }

    const parts = [];
    if (coverage_limits.per_occurrence) {
      parts.push(`$${(coverage_limits.per_occurrence / 1000000).toFixed(1)}M per occurrence`);
    }
    if (coverage_limits.aggregate) {
      parts.push(`$${(coverage_limits.aggregate / 1000000).toFixed(1)}M aggregate`);
    }
    return parts.join(' / ');
  }

  const filteredTemplates = selectedType === 'all'
    ? templates
    : templates.filter(t => t.type === selectedType);

  if (loading) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--color-blue-10)' }} />
        <Text style={{ color: 'var(--color-10)', marginTop: 'var(--space-4)' }}>Loading templates...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Card style={{ backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-5)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
        <Text style={{ color: 'var(--color-red-11)', marginBottom: 8 }}>Error: {error}</Text>
        <button
          onClick={() => loadTemplates()}
          style={{
            fontSize: 'var(--font-size-3)',
            color: 'var(--color-red-10)',
            backgroundColor: 'transparent',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--font-size-7)', fontWeight: 700, color: 'var(--color-12)', margin: 0 }}>Select a Template</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              color: 'var(--color-10)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </Row>

      {/* Type Filter */}
      <Row style={{ gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedType('all')}
          style={{
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 'var(--radius-4)',
            fontSize: 'var(--font-size-3)',
            fontWeight: 500,
            backgroundColor: selectedType === 'all' ? 'var(--color-blue-9)' : 'var(--color-gray-5)',
            color: selectedType === 'all' ? 'white' : 'var(--color-11)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          All Types
        </button>
        {Object.values(CoverageType).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              paddingLeft: 'var(--space-4)',
              paddingRight: 'var(--space-4)',
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 'var(--radius-4)',
              fontSize: 'var(--font-size-3)',
              fontWeight: 500,
              backgroundColor: selectedType === type ? 'var(--color-blue-9)' : 'var(--color-gray-5)',
              color: selectedType === type ? 'white' : 'var(--color-11)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {getTypeIcon(type)} {getTypeLabel(type)}
          </button>
        ))}
      </Row>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', boxShadow: '0 1px 2px var(--color-shadow)', padding: 'var(--space-8)' }}>
          <Text style={{ color: 'var(--color-10)', textAlign: 'center' }}>No templates found for this type.</Text>
        </Card>
      ) : (
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              onPress={() => onSelectTemplate(template)}
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-4)',
                boxShadow: '0 1px 2px var(--color-shadow)',
                padding: 'var(--space-6)',
                borderWidth: 0,
                width: '100%',
                maxWidth: 'calc(33.333% - 11px)',
                cursor: 'pointer',
              }}
            >
              <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <Text style={{ fontSize: 'var(--font-size-9)' }}>{getTypeIcon(template.type)}</Text>
                <Text style={{ fontSize: 'var(--font-size-1)', fontWeight: 500, color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)', paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 'var(--radius-2)' }}>
                  v{template.version}
                </Text>
              </Row>

              <Text style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>{template.name}</Text>

              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)', marginBottom: 'var(--space-3)' }}>{formatCoverage(template)}</Text>

              {template.description && (
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)', marginBottom: 'var(--space-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {template.description}
                </Text>
              )}

              <Stack style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTopWidth: 1, borderTopStyle: 'solid', borderColor: 'var(--color-border)' }}>
                <Stack style={{ gap: 4 }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                    {template.requirement_definition.required_endorsements.length} endorsements
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                    {template.requirement_definition.documentation_requirements.filter(d => d.is_required).length} required documents
                  </Text>
                </Stack>
              </Stack>

              <Row style={{ marginTop: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-blue-10)' }}>Use Template</Text>
              </Row>
            </Card>
          ))}
        </Row>
      )}

      {/* Custom Option */}
      <Card
        style={{
          borderRadius: 'var(--radius-4)',
          boxShadow: '0 1px 2px var(--color-shadow)',
          padding: 'var(--space-6)',
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: 'var(--color-purple-7)',
          background: 'linear-gradient(to right, var(--color-purple-2), var(--color-blue-2))',
        }}
      >
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <Stack style={{ flex: 1, minWidth: 200 }}>
            <Text style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>
              Create Custom Requirement
            </Text>
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
              Build a requirement from scratch with your own specifications
            </Text>
          </Stack>
          <button
            onClick={() => onSelectTemplate({
              id: '',
              name: '',
              type: CoverageType.CUSTOM,
              status: 'draft' as const,
              is_template: false,
              created_by: userId,
              organization_id: organizationId,
              requirement_definition: {
                coverage_limits: {},
                required_endorsements: [],
                policy_conditions: [],
                documentation_requirements: []
              },
              version: 1,
              parent_requirement_id: null,
              effective_date: new Date().toISOString(),
              superseded_date: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              archived_at: null
            })}
            style={{
              paddingLeft: 'var(--space-6)',
              paddingRight: 'var(--space-6)',
              paddingTop: 'var(--space-3)',
              paddingBottom: 'var(--space-3)',
              backgroundColor: 'var(--color-purple-9)',
              color: 'white',
              borderRadius: 'var(--radius-4)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Custom
          </button>
        </Row>
      </Card>
    </Stack>
  );
}
