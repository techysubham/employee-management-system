import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

function HRDashboard({ 
  currentUser, 
  onLogout, 
  employees, 
  fetchEmployees
}) {
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    position: '',
    department: 'operations',
    role: 'employee'
  });

  // Custom departments and roles for dropdown
  const [customDepartments, setCustomDepartments] = useState(() => {
    const saved = localStorage.getItem('custom-departments');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customRoles, setCustomRoles] = useState(() => {
    const saved = localStorage.getItem('custom-roles');
    return saved ? JSON.parse(saved) : [];
  });

  const predefinedDepartments = ['operations', 'listing', 'product research', 'resource manager', 'hr'];
  const predefinedRoles = ['employee', 'manager', 'head', 'hr'];

  const allDepartments = [...predefinedDepartments, ...customDepartments];
  const allRoles = [...predefinedRoles, ...customRoles];

  const handleCreateAccount = async () => {
    try {
      // Add custom department/role to permanent list if it's new
      if (!allDepartments.includes(newAccount.department)) {
        const updatedDepartments = [...customDepartments, newAccount.department];
        setCustomDepartments(updatedDepartments);
        localStorage.setItem('custom-departments', JSON.stringify(updatedDepartments));
      }
      
      if (!allRoles.includes(newAccount.role)) {
        const updatedRoles = [...customRoles, newAccount.role];
        setCustomRoles(updatedRoles);
        localStorage.setItem('custom-roles', JSON.stringify(updatedRoles));
      }

      await axios.post(`${API_URL}/employees`, newAccount);
      fetchEmployees();
      
      setNewAccount({
        name: '',
        email: '',
        username: '',
        password: '',
        position: '',
        department: 'operations',
        role: 'employee'
      });
      
      alert('Employee created successfully!');
    } catch (error) {
      alert('Error creating employee: ' + error.response?.data?.error || error.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/employees/${employeeId}`);
      fetchEmployees();
      alert('Employee deleted successfully!');
    } catch (error) {
      alert('Error deleting employee: ' + error.response?.data?.error || error.message);
    }
  };

  const updateEmployeeDepartment = async (employeeId, newDepartment) => {
    try {
      await axios.put(`${API_URL}/employees/${employeeId}`, {
        department: newDepartment
      });
      fetchEmployees();
    } catch (error) {
      alert('Error updating department: ' + error.response?.data?.error || error.message);
    }
  };

  const updateEmployeeRole = async (employeeId, newRole) => {
    try {
      await axios.put(`${API_URL}/employees/${employeeId}`, {
        role: newRole
      });
      fetchEmployees();
    } catch (error) {
      alert('Error updating role: ' + error.response?.data?.error || error.message);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#2c3e50', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>HR Dashboard</h1>
        <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px' }}>
          Logout
        </button>
      </div>

      {/* Employee Management Section */}
      <div style={{ backgroundColor: '#34495e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Employee Management</h3>
        
        {/* Employee List */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 100px', gap: '10px', padding: '12px', backgroundColor: '#2c3e50', borderRadius: '6px', fontWeight: 'bold', marginBottom: '10px' }}>
            <div>Employee</div>
            <div>Department</div>
            <div>Role</div>
            <div>Actions</div>
          </div>
          
          {employees.map(employee => (
            <div key={employee.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px 100px', gap: '10px', alignItems: 'center', padding: '12px', backgroundColor: 'white', color: 'black', borderRadius: '6px', border: '1px solid #dee2e6', marginBottom: '5px' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{employee.name}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{employee.position}</div>
              </div>
              
              <select 
                value={employee.department}
                onChange={(e) => updateEmployeeDepartment(employee.id, e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: 'bold',
                  backgroundColor: employee.department === 'operations' ? '#3498db' : 
                                employee.department === 'listing' ? '#9b59b6' : 
                                employee.department === 'product research' ? '#e91e63' : 
                                employee.department === 'resource manager' ? '#ff9800' : 
                                employee.department === 'hr' ? '#e74c3c' : '#95a5a6',
                  color: 'white'
                }}
              >
                {allDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="custom">Add Custom Department...</option>
              </select>

              <select 
                value={employee.role}
                onChange={(e) => updateEmployeeRole(employee.id, e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: 'bold',
                  backgroundColor: employee.role === 'employee' ? '#27ae60' : 
                                employee.role === 'manager' ? '#f39c12' : 
                                employee.role === 'head' ? '#8e44ad' : 
                                employee.role === 'hr' ? '#e74c3c' : '#95a5a6',
                  color: 'white'
                }}
              >
                {allRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
                <option value="custom">Add Custom Role...</option>
              </select>

              <button
                onClick={() => handleDeleteEmployee(employee.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>

        {/* New Employee Form */}
        <div style={{ backgroundColor: '#2c3e50', padding: '20px', borderRadius: '8px' }}>
          <h4>Add New Employee</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name *</label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
              <input
                type="email"
                value={newAccount.email}
                onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Position *</label>
              <input
                type="text"
                value={newAccount.position}
                onChange={(e) => setNewAccount({ ...newAccount, position: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter position"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department *</label>
              <select
                value={newAccount.department}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    const customDept = prompt('Enter custom department name:');
                    if (customDept && customDept.trim()) {
                      setNewAccount({ ...newAccount, department: customDept.trim().toLowerCase() });
                    }
                  } else {
                    setNewAccount({ ...newAccount, department: e.target.value });
                  }
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                {allDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="custom">Add Custom Department...</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role *</label>
              <select
                value={newAccount.role}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    const customRole = prompt('Enter custom role name:');
                    if (customRole && customRole.trim()) {
                      setNewAccount({ ...newAccount, role: customRole.trim().toLowerCase() });
                    }
                  } else {
                    setNewAccount({ ...newAccount, role: e.target.value });
                  }
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                {allRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
                <option value="custom">Add Custom Role...</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username *</label>
              <input
                type="text"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password *</label>
              <input
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            onClick={handleCreateAccount}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Employee Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;