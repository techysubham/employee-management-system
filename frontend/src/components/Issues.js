import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Issues({ currentUser, employees, issues, fetchIssues, userDepartment }) {
  const [newIssue, setNewIssue] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium',
    assignedTo: 'hr' // Default to HR
  });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Department options based on your organization
  const departments = [
    { value: 'hr', label: 'HR Department', color: '#e74c3c' },
    { value: 'operations', label: 'Operations Department', color: '#3498db' },
    { value: 'listing', label: 'Listing Department', color: '#2ecc71' },
    { value: 'resource-manager', label: 'Resource Manager Department', color: '#f39c12' },
    { value: 'product-research', label: 'Product Research', color: '#9b59b6' }
  ];

  const priorityColors = {
    low: '#2ecc71',
    medium: '#f39c12', 
    high: '#e74c3c'
  };

  const statusColors = {
    'Open': '#3498db',
    'In Progress': '#f39c12',
    'Resolved': '#2ecc71',
    'Closed': '#7f8c8d'
  };

  // Filter issues based on user's department and permissions
  const getFilteredIssues = () => {
    let filteredIssues = issues || [];

    // If user is not HR, only show issues assigned to their department or issues they created
    if (currentUser.department !== 'hr' && currentUser.role !== 'hr') {
      filteredIssues = filteredIssues.filter(issue => 
        issue.assignedTo === currentUser.department || 
        issue.employeeId === currentUser.id ||
        (currentUser.role === 'head' && issue.assignedTo === currentUser.department)
      );
    }

    // Apply additional filters
    if (filter !== 'all') {
      if (filter === 'my-issues') {
        filteredIssues = filteredIssues.filter(issue => issue.employeeId === currentUser.id);
      } else {
        filteredIssues = filteredIssues.filter(issue => issue.status === filter);
      }
    }

    // Sort issues
    return filteredIssues.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    try {
      const issueData = {
        ...newIssue,
        employeeId: currentUser.id,
      };

      const response = await axios.post(`${API_URL}/issues`, issueData);
      const createdIssue = response.data;
      
      // Reset form
      setNewIssue({ title: '', description: '', priority: 'medium', assignedTo: 'hr' });
      setShowForm(false);
      
      // Refresh issues
      await fetchIssues();
      
      // Show detailed success message with email notification status
      let successMessage = 'Issue submitted successfully!';
      
      if (createdIssue.emailNotificationSent) {
        successMessage += `\n📧 Email notification sent to: ${createdIssue.emailSentTo?.join(', ') || 'department heads'}`;
      } else {
        successMessage += '\n⚠️ Email notification failed to send, but issue was recorded.';
        if (createdIssue.emailError) {
          console.log('Email error:', createdIssue.emailError);
        }
      }
      
      alert(successMessage);
    } catch (error) {
      console.error('Error submitting issue:', error);
      alert('Failed to submit issue. Please try again.');
    }
  };

  const handleUpdateIssueStatus = async (issueId, newStatus, resolution = '') => {
    try {
      const updateData = { status: newStatus };
      if (resolution) {
        updateData.resolution = resolution;
        updateData.resolvedBy = currentUser.id;
      }

      await axios.put(`${API_URL}/issues/${issueId}`, updateData);
      await fetchIssues();
      setShowDetails(false);
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue status.');
    }
  };

  const handleReassignIssue = async (issueId, newDepartment) => {
    try {
      await axios.put(`${API_URL}/issues/${issueId}`, { 
        assignedTo: newDepartment,
        department: newDepartment
      });
      await fetchIssues();
      setShowDetails(false);
    } catch (error) {
      console.error('Error reassigning issue:', error);
      alert('Failed to reassign issue.');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getDepartmentLabel = (deptValue) => {
    const dept = departments.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  };

  const getDepartmentColor = (deptValue) => {
    const dept = departments.find(d => d.value === deptValue);
    return dept ? dept.color : '#7f8c8d';
  };

  const canManageIssue = (issue) => {
    return currentUser.department === 'hr' || 
           currentUser.role === 'hr' ||
           (currentUser.role === 'head' && issue.assignedTo === currentUser.department) ||
           issue.employeeId === currentUser.id;
  };

  const filteredIssues = getFilteredIssues();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Issues Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancel' : 'Report New Issue'}
        </button>
      </div>

      {/* New Issue Form */}
      {showForm && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Report New Issue</h3>
          <form onSubmit={handleSubmitIssue}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Title *
              </label>
              <input
                type="text"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter issue title"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description *
              </label>
              <textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Describe the issue in detail"
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Priority
                </label>
                <select
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Assign to Department *
                </label>
                <select
                  value={newIssue.assignedTo}
                  onChange={(e) => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Submit Issue
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Sorting */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Issues</option>
            <option value="my-issues">My Issues</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="createdAt">Date Created</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontWeight: 'bold' }}>
            Total: {filteredIssues.length} issue(s)
          </span>
        </div>
      </div>

      {/* Issues List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredIssues.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '18px', margin: 0 }}>No issues found</p>
            <p style={{ margin: '10px 0 0 0' }}>Try adjusting your filters or create a new issue</p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <div
              key={issue.id}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onClick={() => {
                setSelectedIssue(issue);
                setShowDetails(true);
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                    #{issue.id} - {issue.title}
                  </h4>
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    Created by: {getEmployeeName(issue.employeeId)} | 
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: priorityColors[issue.priority]
                    }}
                  >
                    {issue.priority.toUpperCase()}
                  </span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: statusColors[issue.status]
                    }}
                  >
                    {issue.status}
                  </span>
                </div>
              </div>

              <p style={{ 
                margin: '0 0 15px 0', 
                color: '#555',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {issue.description.length > 150 ? 
                  `${issue.description.substring(0, 150)}...` : 
                  issue.description
                }
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>Assigned to:</span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getDepartmentColor(issue.assignedTo || issue.department)
                    }}
                  >
                    {getDepartmentLabel(issue.assignedTo || issue.department)}
                  </span>
                  
                  {/* Email notification status */}
                  {issue.emailNotificationSent !== undefined && (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: issue.emailNotificationSent ? '#27ae60' : '#e74c3c'
                      }}
                      title={issue.emailNotificationSent 
                        ? `Email sent to: ${issue.emailSentTo?.join(', ') || 'department heads'}` 
                        : `Email failed: ${issue.emailError || 'Unknown error'}`
                      }
                    >
                      {issue.emailNotificationSent ? '📧 ✓' : '📧 ✗'}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Click to view details
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Issue Details Modal */}
      {showDetails && selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Issue Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>#{selectedIssue.id} - {selectedIssue.title}</h4>
              <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: priorityColors[selectedIssue.priority]
                }}>
                  {selectedIssue.priority.toUpperCase()}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: statusColors[selectedIssue.status]
                }}>
                  {selectedIssue.status}
                </span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getDepartmentColor(selectedIssue.assignedTo || selectedIssue.department)
                }}>
                  {getDepartmentLabel(selectedIssue.assignedTo || selectedIssue.department)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Description:</strong>
              <p style={{ margin: '5px 0', lineHeight: '1.5' }}>{selectedIssue.description}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Created by:</strong> {getEmployeeName(selectedIssue.employeeId)}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Created on:</strong> {new Date(selectedIssue.createdAt).toLocaleString()}
            </div>

            {selectedIssue.resolvedAt && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Resolved on:</strong> {new Date(selectedIssue.resolvedAt).toLocaleString()}
              </div>
            )}

            {selectedIssue.resolution && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Resolution:</strong>
                <p style={{ margin: '5px 0', lineHeight: '1.5' }}>{selectedIssue.resolution}</p>
              </div>
            )}

            {/* Actions for authorized users */}
            {canManageIssue(selectedIssue) && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
                <h5>Actions</h5>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedIssue.status === 'Open' && (
                    <button
                      onClick={() => handleUpdateIssueStatus(selectedIssue.id, 'In Progress')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f39c12',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Start Progress
                    </button>
                  )}

                  {['Open', 'In Progress'].includes(selectedIssue.status) && (
                    <button
                      onClick={() => {
                        const resolution = prompt('Enter resolution details:');
                        if (resolution) {
                          handleUpdateIssueStatus(selectedIssue.id, 'Resolved', resolution);
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}

                  {selectedIssue.status === 'Resolved' && (
                    <button
                      onClick={() => handleUpdateIssueStatus(selectedIssue.id, 'Closed')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#7f8c8d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Close Issue
                    </button>
                  )}

                  {/* Reassign option for HR */}
                  {(currentUser.department === 'hr' || currentUser.role === 'hr') && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleReassignIssue(selectedIssue.id, e.target.value);
                        }
                      }}
                      defaultValue=""
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Reassign to...</option>
                      {departments.map(dept => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Issues;