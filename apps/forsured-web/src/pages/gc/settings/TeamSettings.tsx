// src/pages/gc/settings/TeamSettings.tsx
import React, { useState } from 'react';
// import { Button } from '@unicornlove/ui'; // Assuming Button component exists
import { PlusCircle, UserX, Edit } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive';
}

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'manager', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'member', status: 'active' },
  { id: '3', name: 'Bob Johnson', email: 'bob.j@example.com', role: 'member', status: 'inactive' },
];

function GCTeamSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);

  const handleInviteMember = () => {
    console.log('Inviting new team member');
    // In a real app, open a modal for inviting a new member
  };

  const handleEditMember = (memberId: string) => {
    console.log('Editing team member:', memberId);
    // In a real app, open a modal for editing a member
  };

  const handleToggleMemberStatus = (memberId: string, currentStatus: TeamMember['status']) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    console.log(`Toggling status for member ${memberId} to ${newStatus}`);
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, status: newStatus } : member
      )
    );
    // In a real app, make an API call to update member status
  };

  return (
    <div className="gc-team-settings">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Team Management</h2>
        {/* <Button variant="primary" onClick={handleInviteMember}>
          <PlusCircle size={16} className="mr-2" /> Invite Member
        </Button> */}
        <button onClick={handleInviteMember}>Invite Member</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Email</th>
              <th className="py-2 px-4 border-b text-left">Role</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map(member => (
              <tr key={member.id}>
                <td className="py-2 px-4 border-b">{member.name}</td>
                <td className="py-2 px-4 border-b">{member.email}</td>
                <td className="py-2 px-4 border-b">{member.role}</td>
                <td className="py-2 px-4 border-b">{member.status}</td>
                <td className="py-2 px-4 border-b">
                  <button onClick={() => handleEditMember(member.id)} className="text-blue-500 hover:underline mr-2">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleMemberStatus(member.id, member.status)}
                    className="text-red-500 hover:underline"
                  >
                    <UserX size={16} /> {member.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GCTeamSettings;
