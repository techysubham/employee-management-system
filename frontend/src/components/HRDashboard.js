import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function HRDashboard({ 
  currentUser, 
  onLogout, 
  employees, 
  attendance, 
  tasks, 
  leaveRequests,
  announcements,
  issues,
  fetchEmployees,
  fetchAttendance,
  fetchTasks,
  fetchLeaveRequests,
  fetchAnnouncements,
  fetchIssues
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    position: '',
    role: 'employee'
  });

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const pendingLeave = leaveRequests.filter(l => l.status === 'Pending');
  const todayAttendance = attendance.filter(a => a.date === selectedDate);
  const presentToday = todayAttendance.filter(a => a.status === 'Present').length;

  const approveLeave = async (leaveId) => {
    try {
      await axios.put(`${API_URL}/leave/${leaveId}`, { status: 'Approved' });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const rejectLeave = async (leaveId) => {
    try {
      await axios.put(`${API_URL}/leave/${leaveId}`, { status: 'Rejected' });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/announcements`, newAnnouncement);
      setNewAnnouncement({ title: '', message: '' });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error adding announcement:', error);
      alert('Failed to add announcement');
    }
  };

  const deleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`${API_URL}/announcements/${id}`);
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const deleteIssue = async (id) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await axios.delete(`${API_URL}/issues/${id}`);
        fetchIssues();
      } catch (error) {
        console.error('Error deleting issue:', error);
      }
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.email || !newAccount.username || !newAccount.password || !newAccount.position) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Create employee first
      const employeeResponse = await axios.post(`${API_URL}/employees`, {
        name: newAccount.name,
        email: newAccount.email,
        position: newAccount.position
      });

      // Create user account
      await axios.post(`${API_URL}/auth/register`, {
        username: newAccount.username,
        password: newAccount.password,
        role: newAccount.role,
        name: newAccount.name,
        employeeId: employeeResponse.data.id
      });

      setNewAccount({
        name: '',
        email: '',
        username: '',
        password: '',
        position: '',
        role: 'employee'
      });
      fetchEmployees();
      alert('Account created successfully!');
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account');
    }
  };

  return (
    <div className="dashboard hr-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, <span className="highlight">HR/Admin</span></h1>
          <p className="subtitle">HR/Manager Dashboard</p>
        </div>
        <div className="header-right">
          <span className="today-date">Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <div className="user-profile">
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">HR Manager</span>
            </div>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Employees</h3>
            <p className="stat-number">{employees.length}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Present Today</h3>
            <p className="stat-number">{presentToday}</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p className="stat-number">{tasks.length}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏖️</div>
          <div className="stat-info">
            <h3>Leave Requests</h3>
            <p className="stat-number">{pendingLeave.length} Pending</p>
          </div>
        </div>
      </div>

      {/* First Row: Tasks, Calendar, Activities */}
      <div className="dashboard-row">
        <div className="dashboard-tile tasks-tile">
          <h2>All Tasks Overview</h2>
          <div className="tile-content">
            <div className="task-stats">
              <div className="task-stat-item">
                <span className="task-stat-number">{completedTasks.length}</span>
                <span className="task-stat-label">Completed</span>
              </div>
              <div className="task-stat-item">
                <span className="task-stat-number">{inProgressTasks.length}</span>
                <span className="task-stat-label">In Progress</span>
              </div>
              <div className="task-stat-item">
                <span className="task-stat-number">{tasks.length}</span>
                <span className="task-stat-label">Total</span>
              </div>
            </div>
            <div className="task-list">
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <p className="task-employee">Employee: {getEmployeeName(task.employeeId)}</p>
                    <p className="task-date">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                  </div>
                  <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-tile calendar-tile">
          <h2>Calendar</h2>
          <div className="tile-content">
            <div className="calendar-mini">
              <div className="calendar-header">
                <h3>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              </div>
              <div className="calendar-grid">
                <div className="calendar-day-name">S</div>
                <div className="calendar-day-name">M</div>
                <div className="calendar-day-name">T</div>
                <div className="calendar-day-name">W</div>
                <div className="calendar-day-name">T</div>
                <div className="calendar-day-name">F</div>
                <div className="calendar-day-name">S</div>
                {Array.from({length: 31}, (_, i) => (
                  <div key={i} className={`calendar-day ${i + 1 === new Date().getDate() ? 'today' : ''}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-tile activities-tile">
          <h2>Create Employee Account</h2>
          <div className="tile-content">
            <form onSubmit={handleCreateAccount} className="account-form">
              <input
                type="text"
                placeholder="Full Name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newAccount.email}
                onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Username"
                value={newAccount.username}
                onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Position/Designation"
                value={newAccount.position}
                onChange={(e) => setNewAccount({...newAccount, position: e.target.value})}
                required
              />
              <select
                value={newAccount.role}
                onChange={(e) => setNewAccount({...newAccount, role: e.target.value})}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR/Manager</option>
              </select>
              <button type="submit" className="btn btn-primary">Create Account</button>
            </form>
          </div>
        </div>
      </div>

      {/* Second Row: Leave Requests, Announcements, Issues */}
      <div className="dashboard-row">
        <div className="dashboard-tile leave-tile">
          <h2>Leave Requests</h2>
          <div className="tile-content">
            {pendingLeave.length === 0 ? (
              <p className="empty-state">No pending leave requests</p>
            ) : (
              <div className="leave-list">
                {pendingLeave.map(leave => (
                  <div key={leave.id} className="leave-item">
                    <div className="leave-info">
                      <h4>{getEmployeeName(leave.employeeId)}</h4>
                      <p className="leave-dates">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p className="leave-type">{leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}</p>
                      <p className="leave-reason">{leave.reason}</p>
                    </div>
                    <div className="leave-actions">
                      <button className="btn btn-approve" onClick={() => approveLeave(leave.id)}>Approve</button>
                      <button className="btn btn-reject" onClick={() => rejectLeave(leave.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-tile announcements-tile">
          <h2>Company Announcements</h2>
          <div className="tile-content">
            <form onSubmit={handleAddAnnouncement} className="announcement-form">
              <input
                type="text"
                placeholder="Announcement title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
              />
              <textarea
                placeholder="Message"
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                rows="2"
              />
              <button type="submit" className="btn btn-primary">Post Announcement</button>
            </form>
            <div className="announcement-list">
              {announcements.length === 0 ? (
                <p className="empty-state">No announcements yet</p>
              ) : (
                announcements.slice(-5).reverse().map(announcement => (
                  <div key={announcement.id} className="announcement-item">
                    <span className="announcement-icon">📢</span>
                    <div className="announcement-details">
                      <h4>{announcement.title}</h4>
                      <p>{announcement.message}</p>
                      <span className="announcement-date">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className="btn-delete-small" 
                      onClick={() => deleteAnnouncement(announcement.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-tile issues-tile">
          <h2>Issues & Reports</h2>
          <div className="tile-content">
            <div className="issue-list">
              {issues.length === 0 ? (
                <p className="empty-state">No issues reported</p>
              ) : (
                issues.map(issue => {
                  const employee = employees.find(e => e.id === issue.employeeId);
                  return (
                    <div key={issue.id} className={`issue-item ${issue.priority}`}>
                      <div className="issue-info">
                        <h4>{issue.title}</h4>
                        <p>{issue.description}</p>
                        <span className="issue-employee">
                          Employee: {employee?.name || 'Unknown'}
                        </span>
                        <span className="issue-date">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="issue-actions">
                        <span className="issue-badge">{issue.priority}</span>
                        <button 
                          className="btn-delete-small" 
                          onClick={() => deleteIssue(issue.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;
