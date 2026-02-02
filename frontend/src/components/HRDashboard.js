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
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: '', 
    message: '', 
    type: 'company', 
    targetEmployeeId: null 
  });
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    position: '',
    role: 'employee'
  });

  // Helper function to get calendar days for current month
  const getCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getCurrentDate = () => new Date().getDate();
  const getCurrentMonth = () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const recurringTasks = tasks.filter(t => t.isRecurring);
  const todayCompletedTasks = tasks.filter(t => {
    if (t.status === 'Completed' && t.completedAt) {
      const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return completedDate === today;
    }
    return false;
  });
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

    if (newAnnouncement.type === 'individual' && !newAnnouncement.targetEmployeeId) {
      alert('Please select an employee for individual announcement');
      return;
    }

    try {
      await axios.post(`${API_URL}/announcements`, {
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        type: newAnnouncement.type,
        targetEmployeeId: newAnnouncement.type === 'individual' ? parseInt(newAnnouncement.targetEmployeeId) : null
      });
      setNewAnnouncement({ 
        title: '', 
        message: '', 
        type: 'company', 
        targetEmployeeId: null 
      });
      fetchAnnouncements();
      alert('Announcement added successfully!');
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
          <p className="subtitle">HR/Manager Dashboard ▼</p>
        </div>
        <div className="header-right">
          <span className="today-date">Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <div className="user-profile">
            <div className="user-avatar">{currentUser.name.charAt(0)}</div>
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">HR Administrator</span>
            </div>
            <button onClick={onLogout} className="logout-btn">▼</button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-cards-modern">
        <div className="stat-card-modern blue-card">
          <div className="stat-icon-modern">👥</div>
          <div className="stat-details">
            <div className="stat-title">Total Employees</div>
            <div className="stat-value">{employees.length}</div>
            <div className="stat-subtitle">&nbsp;</div>
          </div>
        </div>
        <div className="stat-card-modern orange-card">
          <div className="stat-icon-modern">🤝</div>
          <div className="stat-details">
            <div className="stat-title">New Hires</div>
            <div className="stat-value">{employees.filter(e => {
              const created = new Date(e.createdAt || Date.now());
              const now = new Date();
              return created.getMonth() === now.getMonth();
            }).length}</div>
            <div className="stat-subtitle">This Month</div>
          </div>
        </div>
        <div className="stat-card-modern purple-card">
          <div className="stat-icon-modern">📋</div>
          <div className="stat-details">
            <div className="stat-title">Pending Requests</div>
            <div className="stat-value">{pendingLeave.length}</div>
            <div className="stat-subtitle">Pending</div>
          </div>
        </div>
        <div className="stat-card-modern green-card">
          <div className="stat-icon-modern">🏖️</div>
          <div className="stat-details">
            <div className="stat-title">Time Off Requests</div>
            <div className="stat-value">{pendingLeave.length}</div>
            <div className="stat-subtitle">Pending</div>
          </div>
        </div>
        <div className="stat-card-modern gold-card">
          <div className="stat-icon-modern">⭐</div>
          <div className="stat-details">
            <div className="stat-title">Performance</div>
            <div className="stat-value-text">Excellent</div>
            <div className="stat-subtitle">&nbsp;</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid-hr">
        {/* Leave Requests Management */}
        <div className="dashboard-card employee-stats-card">
          <div className="card-header-modern">
            <h2>Leave Requests</h2>
            <span className="stats-count">📋 {pendingLeave.length} Pending</span>
          </div>
          <div className="card-content">
            <div className="employee-stats-list">
              {leaveRequests.length === 0 ? (
                <p className="empty-state-modern">No leave requests</p>
              ) : (
                leaveRequests.slice(-5).reverse().map((leave) => {
                  const employee = employees.find(e => e.id === leave.employeeId);
                  const startDate = new Date(leave.startDate);
                  const endDate = new Date(leave.endDate);
                  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <div key={leave.id} className="employee-stat-item leave-request-hr-item">
                      <div className="emp-avatar">{employee?.name?.charAt(0) || 'U'}</div>
                      <div className="emp-info">
                        <div className="emp-name">{employee?.name || 'Unknown Employee'}</div>
                        <div className="emp-leave-info">
                          {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} · {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="leave-reason-small">{leave.reason}</div>
                      </div>
                      <div className="emp-days">
                        <span className={`days-badge ${leave.status === 'Pending' ? 'orange' : leave.status === 'Approved' ? 'green' : 'red'}`}>
                          {days} Day{days > 1 ? 's' : ''}
                        </span>
                      </div>
                      {leave.status === 'Pending' ? (
                        <div className="leave-action-btns">
                          <button className="approve-btn-small" onClick={() => approveLeave(leave.id)} title="Approve">✓</button>
                          <button className="reject-btn-small" onClick={() => rejectLeave(leave.id)} title="Reject">✗</button>
                        </div>
                      ) : (
                        <span className={`leave-status-text ${leave.status.toLowerCase()}`}>
                          {leave.status === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {leaveRequests.length > 5 && (
              <button className="view-all-btn">View All Requests ({leaveRequests.length})</button>
            )}
          </div>
        </div>

        {/* Approvals Hub */}
        <div className="dashboard-card approvals-card">
          <div className="card-header-modern">
            <h2>Daily Task Tracking</h2>
            <button className="view-all-requests-link">View All Tasks ›</button>
          </div>
          <div className="card-content">
            <div className="task-tracking-stats">
              <div className="tracking-stat">
                <span className="tracking-number">{todayCompletedTasks.length}</span>
                <span className="tracking-label">Completed Today</span>
              </div>
              <div className="tracking-stat">
                <span className="tracking-number">{inProgressTasks.length}</span>
                <span className="tracking-label">In Progress</span>
              </div>
              <div className="tracking-stat">
                <span className="tracking-number">{recurringTasks.length}</span>
                <span className="tracking-label">Daily Tasks</span>
              </div>
            </div>
            
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-icon">🔄</span>
                <span className="approval-title">Daily Recurring Tasks</span>
                <span className="approval-count">{recurringTasks.length}</span>
              </div>
              <div className="approval-items">
                {recurringTasks.length === 0 ? (
                  <p className="empty-state-modern">No recurring tasks set up</p>
                ) : (
                  recurringTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="approval-item">
                      <div className="approver-avatar">{getEmployeeName(task.employeeId).charAt(0)}</div>
                      <div className="approval-details">
                        <div className="approval-person">
                          {getEmployeeName(task.employeeId)} - {task.title}
                        </div>
                        <div className="approval-time">{task.description}</div>
                      </div>
                      <span className={`task-status-badge ${task.status === 'Completed' ? 'completed' : 'pending'}`}>
                        {task.status === 'Completed' ? '✓ Done Today' : '○ Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-icon">📋</span>
                <span className="approval-title">Recent Task Activity</span>
              </div>
              <div className="approval-items">
                {todayCompletedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="approval-item">
                    <div className="approver-avatar">{getEmployeeName(task.employeeId).charAt(0)}</div>
                    <div className="approval-details">
                      <div className="approval-person">
                        {getEmployeeName(task.employeeId)} completed: {task.title}
                      </div>
                      <div className="approval-time">
                        {new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="task-status-badge completed">✓</span>
                  </div>
                ))}
                {todayCompletedTasks.length === 0 && (
                  <p className="empty-state-modern">No tasks completed today yet</p>
                )}
              </div>
            </div>
            
            <button className="manage-employees-btn">View All Tasks ›</button>
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="dashboard-card attendance-card">
          <div className="card-header-modern">
            <h2>Attendance Overview</h2>
            <span className="stats-count">📅 ★★724</span>
          </div>
          <div className="card-content">
            <div className="attendance-summary">
              <div className="attendance-label">Daily Check-ins</div>
              <div className="attendance-percentage">{Math.round((presentToday / employees.length) * 100) || 76}%</div>
            </div>
            <div className="attendance-bar">
              <div className="attendance-bar-fill" style={{width: `${Math.round((presentToday / employees.length) * 100) || 76}%`}}></div>
            </div>
            <div className="attendance-legend">
              <div className="legend-item">
                <span className="legend-dot ontime"></span>
                <span>On Time</span>
                <span className="legend-value">{presentToday || Math.floor(employees.length * 0.76)}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot late"></span>
                <span>Late</span>
                <span className="legend-value">{employees.length - presentToday || Math.ceil(employees.length * 0.16)}</span>
              </div>
            </div>
            <div className="weather-icons">
              <span>❄️</span>
              <span>🌤️</span>
              <span>☁️</span>
              <span>🌥️</span>
            </div>
            <button className="view-full-calendar-btn">View Full Calendar ›</button>
          </div>
        </div>

        {/* Calendar */}
        <div className="dashboard-card calendar-hr-card">
          <div className="card-header-modern">
            <h2>Calendar</h2>
            <span className="calendar-icon-small">📅 {getCurrentMonth()}</span>
          </div>
          <div className="card-content">
            <div className="calendar-modern">
              <div className="calendar-weekdays">
                <div className="weekday">S</div>
                <div className="weekday">M</div>
                <div className="weekday">T</div>
                <div className="weekday">W</div>
                <div className="weekday">T</div>
                <div className="weekday">F</div>
                <div className="weekday">S</div>
              </div>
              <div className="calendar-days">
                {getCalendarDays().map((day, idx) => (
                  <div key={idx} className={`calendar-date ${day === getCurrentDate() ? 'today-date' : ''} ${!day ? 'empty-date' : ''}`}>
                    {day || ''}
                  </div>
                ))}
              </div>
            </div>
            <button className="view-full-calendar-btn">View Full Calendar+ ›</button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card activities-hr-card">
          <div className="card-header-modern">
            <h2>Recent Activities</h2>
            <button className="more-btn">⋯</button>
          </div>
          <div className="card-content">
            <div className="activities-list-hr">
              {/* Show recent task completions */}
              {todayCompletedTasks.slice(0, 2).map((task) => (
                <div key={`task-${task.id}`} className="activity-item-hr">
                  <span className="activity-icon-hr green-bg">✓</span>
                  <div className="activity-content-hr">
                    <div className="activity-text-hr">{getEmployeeName(task.employeeId)} completed: {task.title}</div>
                    <div className="activity-time-hr">
                      {new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="activity-date-hr">Today</div>
                </div>
              ))}
              
              {/* Show recent leave requests */}
              {pendingLeave.slice(0, 1).map((leave) => (
                <div key={`leave-${leave.id}`} className="activity-item-hr">
                  <span className="activity-icon-hr orange-bg">🏖️</span>
                  <div className="activity-content-hr">
                    <div className="activity-text-hr">{getEmployeeName(leave.employeeId)} requested leave: {leave.type}</div>
                    <div className="activity-time-hr">
                      {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="activity-date-hr">Pending</div>
                </div>
              ))}
              
              {/* Show recent announcements */}
              {announcements.slice(-1).map((announcement) => (
                <div key={`announcement-${announcement.id}`} className="activity-item-hr">
                  <span className="activity-icon-hr blue-bg">📢</span>
                  <div className="activity-content-hr">
                    <div className="activity-text-hr">New announcement: {announcement.title}</div>
                    <div className="activity-time-hr">{announcement.message.substring(0, 50)}...</div>
                  </div>
                  <div className="activity-date-hr">
                    {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
              
              {todayCompletedTasks.length === 0 && pendingLeave.length === 0 && announcements.length === 0 && (
                <p className="empty-state-modern">No recent activities</p>
              )}
            </div>
            <button className="view-all-activities-btn">View All Activities</button>
          </div>
        </div>

        {/* Announcements Management */}
        <div className="dashboard-card announcements-hr-card">
          <div className="card-header-modern">
            <h2>📢 Announcements</h2>
            <span className="badge-modern">{announcements.length} Total</span>
          </div>
          <div className="card-content">
            {/* Add Announcement Form */}
            <form onSubmit={handleAddAnnouncement} className="announcement-form-modern">
              <div className="form-row-modern">
                <div className="form-group-modern" style={{flex: 1}}>
                  <label>Announcement Type</label>
                  <select 
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value, targetEmployeeId: null})}
                    className="form-select-modern"
                  >
                    <option value="company">📢 Company-Wide Announcement</option>
                    <option value="individual">👤 Individual Employee Announcement</option>
                  </select>
                </div>
                {newAnnouncement.type === 'individual' && (
                  <div className="form-group-modern" style={{flex: 1}}>
                    <label>Select Employee</label>
                    <select 
                      value={newAnnouncement.targetEmployeeId || ''}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, targetEmployeeId: e.target.value})}
                      className="form-select-modern"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group-modern">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Enter announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="form-input-modern"
                />
              </div>
              <div className="form-group-modern">
                <label>Message</label>
                <textarea
                  placeholder="Enter announcement message"
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  className="form-textarea-modern"
                  rows="3"
                />
              </div>
              <button type="submit" className="btn-add-announcement">
                {newAnnouncement.type === 'company' ? '📢 Post Company Announcement' : '👤 Send Individual Announcement'}
              </button>
            </form>

            {/* Announcements List */}
            <div className="announcements-list-hr" style={{marginTop: '20px'}}>
              <h3 style={{fontSize: '14px', color: '#666', marginBottom: '15px'}}>Recent Announcements</h3>
              {announcements.length === 0 ? (
                <p className="empty-state-modern">No announcements yet</p>
              ) : (
                announcements.slice().reverse().map((announcement) => (
                  <div key={announcement.id} className="announcement-item-hr">
                    <span className="announcement-icon-hr">
                      {announcement.type === 'individual' ? '👤' : '📣'}
                    </span>
                    <div className="announcement-content-hr">
                      <div className="announcement-title-hr">
                        {announcement.title}
                        {announcement.type === 'individual' && (
                          <span className="individual-badge-hr"> → {getEmployeeName(announcement.targetEmployeeId)}</span>
                        )}
                      </div>
                      <div className="announcement-desc-hr">{announcement.message}</div>
                    </div>
                    <div className="announcement-actions-hr">
                      <div className="announcement-date-hr">
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <button 
                        onClick={() => deleteAnnouncement(announcement.id)} 
                        className="delete-btn-small"
                        title="Delete announcement"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;
