import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';

interface CreateBrokerAckFormModalProps {
  onClose: () => void;
  onCreated: (formId: string) => void;
}

export default function CreateBrokerAckFormModal({
  onClose,
  onCreated,
}: CreateBrokerAckFormModalProps) {
  const { createForm } = useBrokerAcknowledgements();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    subcontractor_company_name: '',
    subcontractor_org_id: '',
    broker_agency_name: '',
    broker_contact_name: '',
    broker_email: '',
    broker_phone: '',
    broker_org_id: '',
    gc_project_name: '',
    requires_pollution_liability: false,
    requires_professional_liability: false,
    involves_residential_work: false,
  });

  const selectedProject = projects.find((p) => p.id === formData.project_id);

  useEffect(() => {
    if (selectedProject) {
      setFormData((prev) => ({
        ...prev,
        gc_project_name: selectedProject.name,
      }));
    }
  }, [selectedProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.project_id) {
        throw new Error('Please select a project');
      }
      if (!formData.subcontractor_company_name) {
        throw new Error('Please enter subcontractor company name');
      }
      if (!formData.broker_agency_name) {
        throw new Error('Please enter broker agency name');
      }
      if (!formData.broker_contact_name) {
        throw new Error('Please enter broker contact name');
      }
      if (!formData.broker_email) {
        throw new Error('Please enter broker email');
      }

      const newForm = await createForm({
        ...formData,
        gc_project_name: selectedProject?.name || '',
        manager_org_id: selectedProject?.gc_org_id || '',
        status: 'draft',
        compliance_status: 'pending',
        compliance_score: 0,
        missing_endorsements: [],
        date_issued: new Date().toISOString(),
        date_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (newForm?.id) {
        onCreated(newForm.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            Create Broker Acknowledgement Form
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-error-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="font-medium text-error-900">Error</p>
                <p className="text-sm text-error-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Project <span className="text-error-600">*</span>
            </label>
            <select
              value={formData.project_id}
              onChange={(e) =>
                setFormData({ ...formData, project_id: e.target.value })
              }
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Subcontractor Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Company Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subcontractor_company_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subcontractor_company_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Broker Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Agency Name <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.broker_agency_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broker_agency_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Contact Name <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.broker_contact_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        broker_contact_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.broker_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, broker_phone: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email <span className="text-error-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.broker_email}
                  onChange={(e) =>
                    setFormData({ ...formData, broker_email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Coverage Requirements
            </h3>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requires_pollution_liability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requires_pollution_liability: e.target.checked,
                    })
                  }
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary">
                  Requires Pollution Liability
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requires_professional_liability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requires_professional_liability: e.target.checked,
                    })
                  }
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary">
                  Requires Professional Liability
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.involves_residential_work}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      involves_residential_work: e.target.checked,
                    })
                  }
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-text-primary">
                  Involves Residential Construction
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
