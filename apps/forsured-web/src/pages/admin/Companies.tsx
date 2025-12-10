// src/pages/admin/Companies.tsx
import React from 'react';
import { Building } from 'lucide-react';

function AdminCompanies() {
  return (
    <div className="admin-companies-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Company Management</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        <Building size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Company Management</h2>
        <p className="text-gray-500">
          Company management features are coming soon. This page will allow administrators to
          view, edit, and manage all registered companies in the system.
        </p>
      </div>
    </div>
  );
}

export default AdminCompanies;
