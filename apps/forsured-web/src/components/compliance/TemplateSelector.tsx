/**
 * REQ-165: Compliance Requirements Management System
 * Template selector for quick requirement creation
 */

import { useState, useEffect, useCallback } from 'react';
import { YStack, XStack, Text, Button, Card, H2, Spinner } from '@unicornlove/ui';
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
      [CoverageType.GENERAL_LIABILITY]: '🏢',
      [CoverageType.WORKERS_COMP]: '👷',
      [CoverageType.AUTO_LIABILITY]: '🚗',
      [CoverageType.UMBRELLA]: '☂️',
      [CoverageType.CUSTOM]: '✏️'
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
      <YStack alignItems="center" justifyContent="center" height={256}>
        <Spinner size="large" />
        <Text color="$color10" marginTop="$4">Loading templates...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <Card backgroundColor="$red2" borderColor="$red5" borderRadius="$4" padding="$4">
        <Text color="$red11" marginBottom="$2">Error: {error}</Text>
        <Button
          onPress={() => loadTemplates()}
          fontSize="$3"
          color="$red10"
          hoverStyle={{ color: '$red11' }}
          backgroundColor="transparent"
          borderWidth={0}
          textDecorationLine="underline"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <YStack gap="$4">
      <XStack alignItems="center" justifyContent="space-between">
        <H2 fontSize="$7" fontWeight="700" color="$color12">Select a Template</H2>
        {onCancel && (
          <Button
            onPress={onCancel}
            color="$color10"
            hoverStyle={{ color: '$color11' }}
            backgroundColor="transparent"
            borderWidth={0}
          >
            Cancel
          </Button>
        )}
      </XStack>

      {/* Type Filter */}
      <XStack gap="$2" flexWrap="wrap">
        <Button
          onPress={() => setSelectedType('all')}
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius="$4"
          fontSize="$3"
          fontWeight="500"
          backgroundColor={selectedType === 'all' ? '$blue9' : '$gray5'}
          color={selectedType === 'all' ? 'white' : '$color11'}
          hoverStyle={{ backgroundColor: selectedType === 'all' ? '$blue10' : '$gray6' }}
        >
          All Types
        </Button>
        {Object.values(CoverageType).map((type) => (
          <Button
            key={type}
            onPress={() => setSelectedType(type)}
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$4"
            fontSize="$3"
            fontWeight="500"
            backgroundColor={selectedType === type ? '$blue9' : '$gray5'}
            color={selectedType === type ? 'white' : '$color11'}
            hoverStyle={{ backgroundColor: selectedType === type ? '$blue10' : '$gray6' }}
          >
            {getTypeIcon(type)} {getTypeLabel(type)}
          </Button>
        ))}
      </XStack>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowOpacity={0.1} shadowRadius={2} padding="$8">
          <Text color="$color10" textAlign="center">No templates found for this type.</Text>
        </Card>
      ) : (
        <XStack flexWrap="wrap" gap="$4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              as="button"
              onPress={() => onSelectTemplate(template)}
              backgroundColor="$background"
              borderRadius="$4"
              shadowColor="$shadowColor"
              shadowOpacity={0.1}
              shadowRadius={2}
              padding="$6"
              hoverStyle={{ shadowOpacity: 0.2, shadowRadius: 4 }}
              focusStyle={{ borderWidth: 2, borderColor: '$blue9' }}
              borderWidth={0}
              width="100%"
              maxWidth={{ $gtMd: 'calc(50% - 8px)', $gtLg: 'calc(33.333% - 11px)' }}
            >
              <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$3">
                <Text fontSize="$9">{getTypeIcon(template.type)}</Text>
                <Text fontSize="$1" fontWeight="500" color="$blue10" backgroundColor="$blue2" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                  v{template.version}
                </Text>
              </XStack>

              <Text fontSize="$5" fontWeight="600" color="$color12" marginBottom="$2">{template.name}</Text>

              <Text fontSize="$3" color="$color10" marginBottom="$3">{formatCoverage(template)}</Text>

              {template.description && (
                <Text fontSize="$2" color="$color9" marginBottom="$3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {template.description}
                </Text>
              )}

              <YStack marginTop="$4" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                <YStack gap="$1">
                  <Text fontSize="$2" color="$color9">
                    {template.requirement_definition.required_endorsements.length} endorsements
                  </Text>
                  <Text fontSize="$2" color="$color9">
                    {template.requirement_definition.documentation_requirements.filter(d => d.is_required).length} required documents
                  </Text>
                </YStack>
              </YStack>

              <XStack marginTop="$4">
                <Text fontSize="$3" fontWeight="500" color="$blue10">Use Template →</Text>
              </XStack>
            </Card>
          ))}
        </XStack>
      )}

      {/* Custom Option */}
      <Card
        borderRadius="$4"
        shadowColor="$shadowColor"
        shadowOpacity={0.1}
        shadowRadius={2}
        padding="$6"
        borderWidth={2}
        borderStyle="dashed"
        borderColor="$purple7"
        style={{
          background: 'linear-gradient(to right, var(--purple2), var(--blue2))',
        }}
      >
        <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$4">
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$5" fontWeight="600" color="$color12" marginBottom="$2">
              Create Custom Requirement
            </Text>
            <Text fontSize="$3" color="$color10">
              Build a requirement from scratch with your own specifications
            </Text>
          </YStack>
          <Button
            onPress={() => onSelectTemplate({
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
            paddingHorizontal="$6"
            paddingVertical="$3"
            backgroundColor="$purple9"
            color="white"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$purple10' }}
            focusStyle={{ borderWidth: 2, borderColor: '$purple9' }}
          >
            Create Custom
          </Button>
        </XStack>
      </Card>
    </YStack>
  );
}
