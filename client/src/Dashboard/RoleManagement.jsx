import React, { useState, useEffect } from 'react';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');

  // Fetch roles from the backend
  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/roles');
      const data = await response.json();
      setRoles(data);
    } catch (err) {
      setError('Failed to fetch roles');
    }
  };

  // Add a new role
  const addRole = async () => {
    if (!newRole.name || !newRole.description) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (response.ok) {
        setNewRole({ name: '', description: '' });
        fetchRoles(); // Refresh the list
      } else {
        setError('Failed to add role');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Delete a role
  const deleteRole = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/roles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoles(); // Refresh the list
      } else {
        setError('Failed to delete role');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Role Management</h1>

      {/* Add Role Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Role</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Role Name"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newRole.description}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
          />
          <button
            onClick={addRole}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Role
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Role List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Roles</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b">
                <td className="p-3">{role.name}</td>
                <td className="p-3">{role.description}</td>
                <td className="p-3">
                  <button
                    onClick={() => deleteRole(role.id)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;