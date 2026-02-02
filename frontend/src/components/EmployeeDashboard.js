import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function EmployeeDashboard({ 
  currentUser, 
  onLogout, 
  employees, 
  attendance, 
  tasks, 
  leaveRequests,
  announcements,
  issues,
  workHours,
  fetchEmployees,
  fetchAttendance,
  fetchTasks,
  fetchLeaveRequests,
  fetchAnnouncements,
  fetchIssues,
  fetchWorkHours
}) {
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '' });
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', type: 'sick', reason: '' });
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'medium' });
  const [checkedIn, setCheckedIn] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState({ totalHours: 0, totalOvertime: 0 });

  React.useEffect(() => {
    fetchWeeklySummary();
    checkTodayStatus();
  }, [currentUser.employeeId]);

  const fetchWeeklySummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/workhours/weekly/${currentUser.employeeId}`);
      setWeeklyHours(response.data);
    } catch (error) {
      console.error('Error fetching weekly hours:', error);
    }
  };

  const checkTodayStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = workHours.find(w => 
      w.employeeId === currentUser.employeeId && 
      w.date === today && 
      !w.checkOut
    );
    setCheckedIn(!!todayEntry);
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/workhours/checkin`, {
        employeeId: currentUser.employeeId
      });
      setCheckedIn(true);
      fetchWorkHours();
      fetchWeeklySummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`${API_URL}/workhours/checkout`, {
        employeeId: currentUser.employeeId
      });
      setCheckedIn(false);
      fetchWorkHours();
      fetchWeeklySummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check out');
    }
  };

  // Filter data for current employee only
  const myTasks = tasks.filter(t => t.employeeId === currentUser.employeeId);
  const myLeaveRequests = leaveRequests.filter(l => l.employeeId === currentUser.employeeId);
  const myAttendance = attendance.filter(a => a.employeeId === currentUser.employeeId);
  const myIssues = issues.filter(i => i.employeeId === currentUser.employeeId);

  const completedTasks = myTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = myTasks.filter(t => t.status === 'In Progress').length;
  const pendingLeave = myLeaveRequests.filter(l => l.status === 'Pending').length;

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description || !newTask.deadline) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/tasks`, {
        employeeId: currentUser.employeeId,
        ...newTask
      });
      setNewTask({ title: '', description: '', deadline: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/leave`, {
        employeeId: currentUser.employeeId,
        ...newLeave
      });
      setNewLeave({ startDate: '', endDate: '', type: 'sick', reason: '' });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error requesting leave:', error);
      alert('Failed to submit leave request');
    }
  };

  const markTaskComplete = async (taskId) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { action: 'complete' });
      fetchTasks();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const handleAddIssue = async (e) => {
    e.preventDefault();
    if (!newIssue.title || !newIssue.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/issues`, {
        employeeId: currentUser.employeeId,
        ...newIssue
      });
      setNewIssue({ title: '', description: '', priority: 'medium' });
      fetchIssues();
    } catch (error) {
      console.error('Error adding issue:', error);
      alert('Failed to add issue');
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

  return (
    <div className="dashboard employee-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, <span className="highlight">{currentUser.name}</span></h1>
          <p className="subtitle">Employee Dashboard</p>
        </div>
        <div className="header-right">
          <span className="today-date">Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <div className="user-profile">
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{employees.find(e => e.id === currentUser.employeeId)?.position || 'Employee'}</span>
            </div>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Tasks Assigned</h3>
            <p className="stat-number">{myTasks.length}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-number">{completedTasks}</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p className="stat-number">{pendingTasks}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🏖️</div>
          <div className="stat-info">
            <h3>Leave Balance</h3>
            <p className="stat-number">{employees.find(e => e.id === currentUser.employeeId)?.leaveBalance || 2} Days</p>
          </div>
        </div>
      </div>

      {/* First Row: Work Hours, My Tasks, Calendar */}
      <div className="dashboard-row">
        <div className="dashboard-tile work-tile">
          <h2>⏰ Work Hours</h2>
          <div className="tile-content">
            <div className="work-compact">
              <div className="hours-circle-mini">
                <svg viewBox="0 0 120 120" className="progress-ring">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#e0e7ff"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#workGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(weeklyHours.totalHours / 40) * 326.7} 326.7`}
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="hours-center">
                  <div className="hours-big">{Math.floor(weeklyHours.totalHours)}h {Math.round((weeklyHours.totalHours % 1) * 60)}m</div>
                  <div className="hours-small">This Week</div>
                </div>
              </div>
              <div className="work-mini-details">
                <div className="mini-detail-row">
                  <span className="mini-icon">🕐</span>
                  <span className="mini-label">Check-In:</span>
                  <span className="mini-value">{checkedIn ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                </div>
                <div className="mini-detail-row">
                  <span className="mini-icon">🕔</span>
                  <span className="mini-label">Check-Out:</span>
                  <span className="mini-value">--:--</span>
                </div>
                <div className="mini-detail-row">
                  <span className="mini-icon">⏱️</span>
                  <span className="mini-label">Overtime:</span>
                  <span className="mini-value">{Math.floor(weeklyHours.totalOvertime)}h {Math.round((weeklyHours.totalOvertime % 1) * 60)}m</span>
                </div>
              </div>
            </div>
            {!checkedIn ? (
              <button className="btn-check-compact" onClick={handleCheckIn}>
                Check In
              </button>
            ) : (
              <button className="btn-check-compact btn-check-out" onClick={handleCheckOut}>
                Check Out
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-tile tasks-tile">
          <h2>My Tasks</h2>
          <div className="tile-content">
            <form onSubmit={handleAddTask} className="task-form">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
              <input
                type="text"
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
              />
              <button type="submit" className="btn btn-primary">Add Task</button>
            </form>
            <div className="task-list">
              {myTasks.length === 0 ? (
                <p className="empty-state">No tasks assigned</p>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-info">
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                    </div>
                    {task.status === 'In Progress' && (
                      <button className="btn btn-complete" onClick={() => markTaskComplete(task.id)}>
                        Complete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Leave Requests, Calendar, My Activities */}
      <div className="dashboard-row">
        <div className="dashboard-tile leave-tile">
          <h2>Leave Requests</h2>
          <div className="tile-content">
            <div className="leave-balance-info">
              <span className="balance-label">Available Leaves:</span>
              <span className="balance-value">{employees.find(e => e.id === currentUser.employeeId)?.leaveBalance || 2} days</span>
            </div>
            <form onSubmit={handleRequestLeave} className="leave-form">
              <input
                type="date"
                placeholder="Start Date"
                value={newLeave.startDate}
                onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
              />
              <input
                type="date"
                placeholder="End Date"
                value={newLeave.endDate}
                onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
              />
              <select
                value={newLeave.type}
                onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
              >
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="vacation">Vacation</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Reason"
                value={newLeave.reason}
                onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
              />
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </form>
            <div className="leave-list">
              {myLeaveRequests.map(leave => (
                <div key={leave.id} className="leave-item">
                  <div className="leave-info">
                    <p className="leave-dates">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    <p className="leave-type">{leave.type}</p>
                  </div>
                  <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-tile calendar-tile">
          <h2>📅 Calendar</h2>
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
          <h2>📊 Activities</h2>
          <div className="tile-content">
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-icon">✅</span>
                <div className="activity-details">
                  <p className="activity-text">{completedTasks} tasks completed</p>
                  <span className="activity-time">This week</span>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-icon">📝</span>
                <div className="activity-details">
                  <p className="activity-text">{pendingTasks} in progress</p>
                  <span className="activity-time">Now</span>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-icon">🏖️</span>
                <div className="activity-details">
                  <p className="activity-text">{pendingLeave} leave pending</p>
                  <span className="activity-time">Awaiting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Announcements, Issues */}
      <div className="dashboard-row">
        <div className="dashboard-tile announcements-tile">
          <h2>Company Announcements</h2>
          <div className="tile-content">
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-tile issues-tile">
          <h2>⚠️ Issues</h2>
          <div className="tile-content">
            <form onSubmit={handleAddIssue} className="issue-form">
              <input
                type="text"
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
              />
              <textarea
                placeholder="Description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                rows="2"
              />
              <select
                value={newIssue.priority}
                onChange={(e) => setNewIssue({...newIssue, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button type="submit" className="btn btn-primary">Add Issue</button>
            </form>
            <div className="issue-list">
              {myIssues.length === 0 ? (
                <p className="empty-state">No issues</p>
              ) : (
                myIssues.map(issue => (
                  <div key={issue.id} className={`issue-item ${issue.priority}`}>
                    <div className="issue-info">
                      <h4>{issue.title}</h4>
                      <p>{issue.description}</p>
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
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-tile" style={{opacity: 0, pointerEvents: 'none'}}>
          {/* Empty placeholder for 3-column grid */}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
