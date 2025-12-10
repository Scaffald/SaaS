import React from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import ComplianceScore from '../Common/ComplianceScore';

interface Participant {
  id: string;
  name: string;
  organizationName: string;
  role: string;
  status: 'invited' | 'accepted' | 'active' | 'completed' | 'removed';
  complianceStatus: 'compliant' | 'warning' | 'critical';
  complianceScore?: number;
  joinedDate?: string;
}

interface ProjectParticipantsListProps {
  participants: Participant[];
  onParticipantClick?: (participant: Participant) => void;
}

export default function ProjectParticipantsList({
  participants,
  onParticipantClick,
}: ProjectParticipantsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="text-success-600" size={16} />;
      case 'invited':
      case 'accepted':
        return <Clock className="text-primary-600" size={16} />;
      case 'removed':
        return <XCircle className="text-error-600" size={16} />;
      default:
        return <AlertTriangle className="text-warning-600" size={16} />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      case 'critical':
        return 'text-error-600';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Users className="text-text-secondary" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">
            Project Participants
          </h3>
          <span className="text-sm text-text-secondary">
            ({participants.length})
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`p-6 hover:bg-surface-hover transition-colors ${
              onParticipantClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onParticipantClick?.(participant)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary-600">
                    {participant.organizationName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-semibold text-text-primary truncate">
                      {participant.organizationName}
                    </h4>
                    {getStatusIcon(participant.status)}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-text-secondary">
                    <span>{participant.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                      {participant.role}
                    </span>
                    <StatusBadge status={participant.status} size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6 ml-4">
                {participant.complianceScore !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-text-secondary mb-1">
                      Compliance
                    </p>
                    <ComplianceScore
                      score={participant.complianceScore}
                      size="sm"
                      showTrend={false}
                    />
                  </div>
                )}

                <div className="text-center">
                  <p className="text-xs text-text-secondary mb-1">Status</p>
                  <span
                    className={`text-sm font-medium ${getComplianceColor(participant.complianceStatus)}`}
                  >
                    {participant.complianceStatus}
                  </span>
                </div>

                {participant.joinedDate && (
                  <div className="text-center">
                    <p className="text-xs text-text-secondary mb-1">Joined</p>
                    <span className="text-sm text-text-primary">
                      {new Date(participant.joinedDate).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="p-12 text-center">
          <Users className="mx-auto text-text-tertiary mb-4" size={48} />
          <p className="text-text-primary font-medium mb-2">
            No participants yet
          </p>
          <p className="text-text-secondary text-sm">
            Invite contractors to join this project
          </p>
        </div>
      )}
    </div>
  );
}
