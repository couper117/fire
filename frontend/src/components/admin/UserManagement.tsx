import { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { api } from '../../api';
import { Button, DataTable, Modal, LoadingSpinner } from '../shared';
import { UserForm } from './UserForm';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Inspector' | 'User';
  isActive: boolean;
  createdAt: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api('/users/api/users');
      setUsers(data.users || []);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedUser) {
        // Update user
        await api(`/users/api/users/${selectedUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        toast.success('User updated successfully');
      } else {
        // Create user
        await api('/users/api/users', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Delete user ${user.email}?`)) return;

    try {
      await api(`/users/api/users/${user.id}`, {
        method: 'DELETE',
      });
      toast.success('User deleted');
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to delete user');
    }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Email', 'First Name', 'Last Name', 'Role', 'Active', 'Created'],
      ...users.map((u) => [
        u.email,
        u.firstName,
        u.lastName,
        u.role,
        u.isActive ? 'Yes' : 'No',
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
    toast.success('Users exported to CSV');
  };

  const filteredUsers =
    filterRole === 'all'
      ? users
      : users.filter((u) => u.role === filterRole);

  const columns = [
    {
      key: 'email' as const,
      label: 'Email',
      sortable: true,
    },
    {
      key: 'firstName' as const,
      label: 'First Name',
      render: (value: any, row: User) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'role' as const,
      label: 'Role',
      render: (value: string) => (
        <span className={`badge badge-${value.toLowerCase()}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'isActive' as const,
      label: 'Status',
      render: (value: boolean) => (
        <span className={value ? 'status-active' : 'status-inactive'}>
          {value ? '● Active' : '● Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt' as const,
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner label="Loading users..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 text-sm mt-1">{filteredUsers.length} users total</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={16} />}
            onClick={handleExportUsers}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'Admin', 'Inspector', 'User'].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRole === role
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={filteredUsers}
          onRowClick={handleEditUser}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={selectedUser ? 'Edit User' : 'Create New User'}
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <UserForm
          user={selectedUser}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
