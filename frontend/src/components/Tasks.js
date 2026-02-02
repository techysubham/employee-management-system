import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Tasks({ employees, tasks, fetchTasks, userRole, currentUser }) {
  const [formData, setFormData] = useState({
    employeeId: currentUser?.employeeId || '',
    title: '',
    description: '',
    deadline: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.title || !formData.description || !formData.deadline) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/tasks`, formData);
      setFormData({ 
        employeeId: currentUser?.employeeId || '', 
        title: '', 
        description: '', 
        deadline: '' 
      });
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    }
  };

  const markComplete = async (taskId) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { action: 'complete' });
      fetchTasks();
    } catch (error) {
      console.error('Error marking task complete:', error);
      alert('Failed to mark task complete');
    }
  };

  const approveTask = async (taskId) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { action: 'approve' });
      fetchTasks();
    } catch (error) {
      console.error('Error approving task:', error);
      alert('Failed to approve task');
    }
  };

  const rejectTask = async (taskId) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { action: 'reject' });
      fetchTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Failed to reject task');
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const pendingApprovals = tasks.filter(t => t.status === 'Waiting Approval');

  return (
    <div className="tasks-section">
      <h2>Task Management</h2>
      
      {userRole === 'employee' && (
        <div className="add-section">
          <form onSubmit={handleSubmit}>
            <input
              type="hidden"
              name="employeeId"
              value={formData.employeeId}
            />
            <input
              type="text"
              name="title"
              placeholder="Task Title"
              value={formData.title}
              onChange={handleChange}
            />
            <textarea
              name="description"
              placeholder="Task Description"
              value={formData.description}
              onChange={handleChange}
            />
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
            <button type="submit">Add Task</button>
          </form>
        </div>
      )}

      <h3>All Tasks</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Task</th>
              <th>Description</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{getEmployeeName(task.employeeId)}</td>
                <td>{task.title}</td>
                <td>{task.description}</td>
                <td>{new Date(task.deadline).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </td>
                <td>
                  {task.status === 'In Progress' && userRole === 'employee' && (
                    <button
                      className="btn btn-complete"
                      onClick={() => markComplete(task.id)}
                    >
                      Mark Complete
                    </button>
                  )}
                  {task.status === 'Completed' && (
                    <span className="btn btn-tick">✓ Approved</span>
                  )}
                  {userRole === 'hr' && (
                    <button
                      className="btn btn-delete"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userRole === 'hr' && (
        <>
          <h3>Pending Task Approvals</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Employee</th>
                  <th>Task</th>
                  <th>Completed Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      No pending approvals
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map(task => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>{getEmployeeName(task.employeeId)}</td>
                      <td>{task.title}</td>
                      <td>
                        {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-approve"
                          onClick={() => approveTask(task.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => rejectTask(task.id)}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Tasks;
