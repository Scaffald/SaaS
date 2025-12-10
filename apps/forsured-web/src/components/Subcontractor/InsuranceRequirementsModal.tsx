import React from 'react';
import { Shield, FileText, Users, AlertCircle } from 'lucide-react';
import Modal from '../Common/Modal';
import { Project, Task } from '../../types';
import { useProjects } from '../../hooks/useProjects';

interface InsuranceRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function InsuranceRequirementsModal({
  isOpen,
  onClose,
  task,
}: InsuranceRequirementsModalProps) {
  const { projects } = useProjects();

  const project = task?.project_id
    ? projects.find((p) => p.id === task.project_id)
    : null;

  if (!task || !project) {
    return null;
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Not Required';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const coverageRequirements = [
    {
      label: 'General Liability',
      limit: project.general_liability_required,
      description: 'Per occurrence and aggregate limits',
    },
    {
      label: "Workers' Compensation",
      limit: project.workers_comp_required,
      description: 'Statutory limits plus Employers Liability',
    },
    {
      label: 'Auto Liability',
      limit: project.auto_liability_required,
      description: 'Combined single limit or split limits',
    },
    {
      label: 'Umbrella/Excess Liability',
      limit: project.umbrella_required,
      description: 'Excess over GL, Auto, and Employers Liability',
    },
    {
      label: 'Professional Liability',
      limit: project.professional_liability_required,
      description: 'Errors and omissions coverage',
    },
    {
      label: 'Pollution Liability',
      limit: project.pollution_liability_required,
      description: 'Environmental and pollution coverage',
    },
    {
      label: 'Builders Risk',
      limit: project.builders_risk_required,
      description: 'Property coverage during construction',
    },
  ].filter((req) => req.limit);

  const requiredEndorsements = [
    {
      form: 'CG 2010 (11/85)',
      name: 'Additional Insured - Ongoing Operations',
      description: 'Covers ongoing operations while work is being performed',
    },
    {
      form: 'CG 2037 (04/13)',
      name: 'Additional Insured - Completed Operations',
      description: 'Covers completed operations after work is finished',
    },
    ...(project.waiver_of_subrogation_required
      ? [
          {
            form: 'CG 24 04',
            name: 'Waiver of Subrogation',
            description:
              "Waives insurer's right to subrogate against additional insured",
          },
        ]
      : []),
    ...(project.primary_non_contributory_required
      ? [
          {
            form: 'CG 20 01',
            name: 'Primary and Non-Contributory',
            description:
              'Policy responds first and does not share coverage with other policies',
          },
        ]
      : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insurance Requirements"
      size="lg"
    >
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <h3 className="font-semibold text-text-primary mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-text-secondary">
            {task.gc_company_name || 'General Contractor'}
          </p>
          {project.location && (
            <p className="text-xs text-text-secondary mt-1">
              {project.location}
            </p>
          )}
        </div>

        {/* Coverage Requirements */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="text-primary-600" size={20} />
            <h3 className="text-lg font-semibold text-text-primary">
              Required Coverage Limits
            </h3>
          </div>
          <div className="space-y-3">
            {coverageRequirements.map((req, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <div className="font-medium text-text-primary">
                    {req.label}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {req.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary-600">
                    {formatCurrency(req.limit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Required Endorsements */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="text-primary-600" size={20} />
            <h3 className="text-lg font-semibold text-text-primary">
              Required Endorsements
            </h3>
          </div>
          <div className="space-y-3">
            {requiredEndorsements.map((endorsement, index) => (
              <div
                key={index}
                className="p-3 bg-neutral-50 rounded-lg border border-border"
              >
                <div className="font-medium text-text-primary mb-1">
                  {endorsement.form} - {endorsement.name}
                </div>
                <div className="text-sm text-text-secondary">
                  {endorsement.description}
                </div>
              </div>
            ))}
            {requiredEndorsements.length === 0 && (
              <div className="text-sm text-text-secondary p-3 bg-neutral-50 rounded-lg border border-border">
                No specific endorsements required beyond standard Additional
                Insured coverage.
              </div>
            )}
          </div>
        </div>

        {/* Additional Insureds */}
        {project.additional_insureds &&
          project.additional_insureds.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="text-primary-600" size={20} />
                <h3 className="text-lg font-semibold text-text-primary">
                  Additional Insureds
                </h3>
              </div>
              <div className="space-y-2">
                {project.additional_insureds.map((insured, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-50 rounded-lg border border-border"
                  >
                    <div className="text-text-primary">{insured}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Certificate Holder */}
        {project.certificate_holder && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="text-primary-600" size={20} />
              <h3 className="text-lg font-semibold text-text-primary">
                Certificate Holder
              </h3>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-border">
              <div className="text-text-primary">
                {project.certificate_holder}
              </div>
            </div>
          </div>
        )}

        {/* Special Provisions */}
        {project.special_provisions && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="text-warning-600" size={20} />
              <h3 className="text-lg font-semibold text-text-primary">
                Special Provisions
              </h3>
            </div>
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {project.special_provisions}
              </p>
            </div>
          </div>
        )}

        {/* Additional Requirements */}
        <div className="pt-4 border-t border-border">
          <div className="space-y-2 text-sm text-text-secondary">
            {project.waiver_of_subrogation_required && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span>Waiver of Subrogation required</span>
              </div>
            )}
            {project.primary_non_contributory_required && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span>Primary and Non-Contributory endorsement required</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
