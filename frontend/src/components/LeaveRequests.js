import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

function LeaveRequests({ employees, leaveRequests, fetchLeaveRequests, userRole, currentUser }) {
  const [formData, setFormData] = useState({
    employeeId: currentUser?.employeeId || '',
    startDate: '',
    endDate: '',
    type: 'sick',
    reason: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    try {
      await axios.post(`${API_URL}/leave`, formData);
      setFormData({ 
        employeeId: currentUser?.employeeId || '', 
        startDate: '', 
        endDate: '', 
        type: 'sick', 
        reason: '' 
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error requesting leave:', error);
      alert('Failed to submit leave request');
    }
  };

  const approveLeave = async (leaveId) => {
    try {
      await axios.put(`${API_URL}/leave/${leaveId}`, { status: 'Approved' });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave');
    }
  };

  const rejectLeave = async (leaveId) => {
    try {
      await axios.put(`${API_URL}/leave/${leaveId}`, { status: 'Rejected' });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave');
    }
  };

  const deleteLeave = async (leaveId) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await axios.delete(`${API_URL}/leave/${leaveId}`);
        fetchLeaveRequests();
      } catch (error) {
        console.error('Error deleting leave:', error);
        alert('Failed to delete leave request');
      }
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  return (
    <div className="leave-section">
      <h2>Leave Management</h2>
      
      {userRole === 'employee' && (
        <div className="add-section">
          <form onSubmit={handleSubmit}>
            <input
              type="hidden"
              name="employeeId"
              value={formData.employeeId}
            />
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="vacation">Vacation</option>
              <option value="other">Other</option>
            </select>
            <textarea
              name="reason"
              placeholder="Reason for Leave"
              value={formData.reason}
              onChange={handleChange}
            />
            <button type="submit">Submit Leave Request</button>
          </form>
        </div>
      )}

      <h3>Leave Requests</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Status</th>
              {userRole === 'hr' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaveRequests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No leave requests
                </td>
              </tr>
            ) : (
              leaveRequests.map(leave => (
                <tr key={leave.id}>
                  <td>{leave.id}</td>
                  <td>{getEmployeeName(leave.employeeId)}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                      {leave.status}
                    </span>
                  </td>
                  {userRole === 'hr' && (
                    <td>
                      {leave.status === 'Pending' && (
                        <>
                          <button
                            className="btn btn-approve"
                            onClick={() => approveLeave(leave.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-reject"
                            onClick={() => rejectLeave(leave.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-delete"
                        onClick={() => deleteLeave(leave.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveRequests;
