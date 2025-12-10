import React from 'react';
import { FileText, DollarSign, Calendar, Award, Building } from 'lucide-react';
import Button from '../Common/Button';
import { PublicRFP } from '../../types';

interface RFPCardProps {
  rfp: PublicRFP;
  userRole?: 'manager' | 'subcontractor';
  hasResponded?: boolean;
  onRespond?: () => void;
  onView?: () => void;
}

export default function RFPCard({
  rfp,
  userRole,
  hasResponded = false,
  onRespond,
  onView,
}: RFPCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDeadline = () => {
    if (!rfp.deadline) return null;
    const deadline = new Date(rfp.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilDeadline();

  const getStatusBadgeColor = () => {
    switch (rfp.status) {
      case 'published':
        return 'bg-success-100 text-success-700 border-success-300';
      case 'closed':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      case 'awarded':
        return 'bg-primary-100 text-primary-700 border-primary-300';
      default:
        return 'bg-warning-100 text-warning-700 border-warning-300';
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="text-warning-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary">
                {rfp.title}
              </h3>
              {rfp.trade_required && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-700 border border-secondary-300 mt-1">
                  {rfp.trade_required}
                </span>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeColor()}`}
          >
            {rfp.status}
          </span>
        </div>

        {rfp.description && (
          <p className="text-sm text-text-secondary line-clamp-3 mb-4">
            {rfp.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign size={14} className="text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Budget Range</p>
              <p className="text-sm font-medium text-text-primary">
                {formatCurrency(rfp.budget_range_min)} -{' '}
                {formatCurrency(rfp.budget_range_max)}
              </p>
            </div>
          </div>

          {rfp.deadline && (
            <div className="flex items-center space-x-2">
              <Calendar size={14} className="text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Deadline</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(rfp.deadline)}
                </p>
                {daysLeft !== null && daysLeft > 0 && (
                  <p
                    className={`text-xs ${daysLeft <= 7 ? 'text-error-600' : 'text-text-secondary'}`}
                  >
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </p>
                )}
              </div>
            </div>
          )}

          {rfp.published_at && (
            <div className="flex items-center space-x-2">
              <Building size={14} className="text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Published</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(rfp.published_at)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Award size={14} className="text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Responses</p>
              <p className="text-sm font-medium text-text-primary">
                {rfp.response_count}
              </p>
            </div>
          </div>
        </div>

        {rfp.requirements && Object.keys(rfp.requirements).length > 0 && (
          <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
            <p className="text-xs font-medium text-text-primary mb-2">
              Requirements
            </p>
            <div className="space-y-1">
              {rfp.requirements.insurance && (
                <p className="text-xs text-text-secondary">
                  Insurance:{' '}
                  {Array.isArray(rfp.requirements.insurance)
                    ? rfp.requirements.insurance.join(', ')
                    : rfp.requirements.insurance}
                </p>
              )}
              {rfp.requirements.certifications && (
                <p className="text-xs text-text-secondary">
                  Certifications:{' '}
                  {Array.isArray(rfp.requirements.certifications)
                    ? rfp.requirements.certifications.join(', ')
                    : rfp.requirements.certifications}
                </p>
              )}
              {rfp.requirements.minimum_coverage && (
                <p className="text-xs text-text-secondary">
                  Min Coverage:{' '}
                  {formatCurrency(rfp.requirements.minimum_coverage)}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4 border-t border-border">
          {userRole === 'subcontractor' && rfp.status === 'published' && (
            <>
              <Button
                variant="primary"
                fullWidth
                onClick={onRespond}
                disabled={hasResponded}
              >
                {hasResponded ? 'Response Submitted' : 'Submit Proposal'}
              </Button>
              <Button variant="ghost" onClick={onView}>
                View Details
              </Button>
            </>
          )}

          {userRole === 'manager' && (
            <Button variant="ghost" fullWidth onClick={onView}>
              View Responses ({rfp.response_count})
            </Button>
          )}

          {!userRole && (
            <Button variant="ghost" fullWidth onClick={onView}>
              View Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
