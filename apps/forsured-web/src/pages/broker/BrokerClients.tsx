// src/pages/broker/BrokerClients.tsx
import React from 'react';
import { Briefcase, Building2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

// Mock clients for testing
const mockClients = [
  {
    id: 'client-1',
    companyName: 'ABC Electrical Services',
    contactName: 'John Smith',
    email: 'john@abcelectrical.com',
    status: 'active',
    policiesCount: 3,
    complianceStatus: 'compliant',
  },
  {
    id: 'client-2',
    companyName: 'XYZ Plumbing Co',
    contactName: 'Jane Doe',
    email: 'jane@xyzplumbing.com',
    status: 'active',
    policiesCount: 2,
    complianceStatus: 'expiring_soon',
  },
  {
    id: 'client-3',
    companyName: 'Pro Construction LLC',
    contactName: 'Bob Wilson',
    email: 'bob@proconstruction.com',
    status: 'pending',
    policiesCount: 0,
    complianceStatus: 'needs_attention',
  },
];

function BrokerClients() {
  const handleAddClient = () => {
    console.log('Navigate to add client flow');
  };

  const hasClients = mockClients.length > 0;

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'expiring_soon':
        return <AlertCircle className="text-yellow-500" size={16} />;
      default:
        return <AlertCircle className="text-red-500" size={16} />;
    }
  };

  return (
    <div className="broker-clients-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Clients</h1>
        <button
          data-testid="invite-client-button"
          onClick={handleAddClient}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus size={18} />
          <span>Add Client</span>
        </button>
      </div>
      {!hasClients ? (
        <EmptyState
          icon={<Briefcase size={48} />}
          title="No Clients Yet"
          description="Add your contractor clients to start managing their insurance and compliance."
          primaryAction={{ label: 'Add Client', onClick: handleAddClient }}
          helpLinks={[
            { label: 'How to Add Clients', href: '#' },
          ]}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table data-testid="client-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building2 className="text-gray-600" size={20} />
                      </div>
                      <span className="font-medium">{client.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.contactName}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.policiesCount} policies
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getComplianceIcon(client.complianceStatus)}
                      <span className="text-sm capitalize">
                        {client.complianceStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BrokerClients;
