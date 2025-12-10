// src/pages/admin/Settings.tsx
import React from 'react';
import { Settings } from 'lucide-react';

function AdminSettings() {
  return (
    <div className="admin-settings-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        <Settings size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">System Settings</h2>
        <p className="text-gray-500">
          System settings are coming soon. This page will allow administrators to configure
          global application settings, integrations, and preferences.
        </p>
      </div>
    </div>
  );
}

export default AdminSettings;
