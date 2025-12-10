// src/pages/admin/Dashboard.tsx
import React from 'react';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold">142</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Active Brokers</h2>
          <p className="text-3xl font-bold">23</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Projects</h2>
          <p className="text-3xl font-bold">89</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Tasks Created</h2>
          <p className="text-3xl font-bold">1,234</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ul className="bg-white p-6 rounded-lg shadow">
          <li className="py-2 border-b last:border-b-0">New GC signup: Acme Construction</li>
          <li className="py-2 border-b last:border-b-0">Broker invitation sent to jane@insurance.com</li>
          <li className="py-2">New project created: Downtown Tower</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;
