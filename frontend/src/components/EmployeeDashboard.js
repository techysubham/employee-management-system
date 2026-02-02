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
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', isRecurring: false });
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', type: 'sick', reason: '' });
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'medium' });
  const [checkedIn, setCheckedIn] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState({ totalHours: 0, totalOvertime: 0 });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [todayWorkHours, setTodayWorkHours] = useState(null);

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

  React.useEffect(() => {
    fetchWeeklySummary();
    checkTodayStatus();
  }, [currentUser.employeeId, workHours]);

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
      w.date === today
    );
    
    if (todayEntry) {
      setTodayWorkHours(todayEntry);
      setCheckedIn(!todayEntry.checkOut); // If no checkout, still checked in
    } else {
      setTodayWorkHours(null);
      setCheckedIn(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/workhours/checkin`, {
        employeeId: currentUser.employeeId
      });
      // Wait a bit before fetching to ensure backend has saved
      setTimeout(() => {
        fetchWorkHours();
        fetchWeeklySummary();
      }, 100);
    } catch (error) {
      console.error('Check-in error:', error);
      alert(error.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`${API_URL}/workhours/checkout`, {
        employeeId: currentUser.employeeId
      });
      // Wait a bit before fetching to ensure backend has saved
      setTimeout(() => {
        fetchWorkHours();
        fetchWeeklySummary();
      }, 100);
    } catch (error) {
      console.error('Check-out error:', error);
      alert(error.response?.data?.message || 'Failed to check out');
    }
  };

  // Filter data for current employee only
  const myTasks = tasks.filter(t => t.employeeId === currentUser.employeeId);
  const myLeaveRequests = leaveRequests.filter(l => l.employeeId === currentUser.employeeId);
  const myAttendance = attendance.filter(a => a.employeeId === currentUser.employeeId);
  const myIssues = issues.filter(i => i.employeeId === currentUser.employeeId);
  
  // Filter announcements: company-wide OR targeted to this employee
  const myAnnouncements = announcements.filter(a => 
    a.type === 'company' || 
    (a.type === 'individual' && a.targetEmployeeId === currentUser.employeeId)
  );

  const completedTasks = myTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = myTasks.filter(t => t.status === 'In Progress').length;
  const pendingLeave = myLeaveRequests.filter(l => l.status === 'Pending').length;

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) {
      alert('Please fill in title and description');
      return;
    }

    try {
      await axios.post(`${API_URL}/tasks`, {
        employeeId: currentUser.employeeId,
        ...newTask,
        deadline: newTask.deadline || new Date().toISOString().split('T')[0]
      });
      setNewTask({ title: '', description: '', deadline: '', isRecurring: false });
      setShowTaskForm(false);
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
          <p className="subtitle">{employees.find(e => e.id === currentUser.employeeId)?.position || 'Employee'}</p>
        </div>
        <div className="header-right">
          <span className="today-date">Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <div className="user-profile">
            <div className="user-avatar">{currentUser.name.charAt(0)}</div>
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{employees.find(e => e.id === currentUser.employeeId)?.position || 'Employee'}</span>
            </div>
            <button onClick={onLogout} className="logout-btn">▼</button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-cards-modern">
        <div className="stat-card-modern blue-card">
          <div className="stat-icon-modern">📅</div>
          <div className="stat-details">
            <div className="stat-title">Upcoming Meetings</div>
            <div className="stat-value">{myTasks.filter(t => t.status === 'In Progress').length}</div>
            <div className="stat-subtitle">This Week</div>
          </div>
        </div>
        <div className="stat-card-modern orange-card">
          <div className="stat-icon-modern">📋</div>
          <div className="stat-details">
            <div className="stat-title">Tasks Assigned</div>
            <div className="stat-value">{pendingTasks}</div>
            <div className="stat-subtitle">Pending</div>
          </div>
        </div>
        <div className="stat-card-modern purple-card">
          <div className="stat-icon-modern">🏖️</div>
          <div className="stat-details">
            <div className="stat-title">Leave Balance</div>
            <div className="stat-value">{employees.find(e => e.id === currentUser.employeeId)?.leaveBalance || 2}</div>
            <div className="stat-subtitle">Days Remaining</div>
          </div>
        </div>
        <div className="stat-card-modern green-card">
          <div className="stat-icon-modern">⭐</div>
          <div className="stat-details">
            <div className="stat-title">Performance</div>
            <div className="stat-value">Excellent</div>
            <div className="stat-subtitle">&nbsp;</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid-modern">
        {/* My Tasks Section */}
        <div className="dashboard-card tasks-modern-card">
          <div className="card-header-modern">
            <h2>My Tasks</h2>
            <button className="add-task-btn" onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? '✕' : '+ Add Task'}
            </button>
          </div>
          <div className="card-content">
            {showTaskForm && (
              <form onSubmit={handleAddTask} className="task-form-modern">
                <input
                  type="text"
                  placeholder="Task title (e.g., Proof Reading, Uploading)"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="task-input"
                  required
                />
                <textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="task-textarea"
                  rows="2"
                  required
                />
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className="task-input"
                />
                <label className="recurring-checkbox">
                  <input
                    type="checkbox"
                    checked={newTask.isRecurring}
                    onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
                  />
                  <span>Daily Recurring Task</span>
                </label>
                <div className="task-form-actions">
                  <button type="submit" className="btn-add-task">Add Task</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowTaskForm(false)}>Cancel</button>
                </div>
              </form>
            )}
            <div className="task-list-modern">
              {myTasks.length === 0 ? (
                <p className="empty-state-modern">No tasks assigned</p>
              ) : (
                myTasks.slice(0, 6).map(task => (
                  <div key={task.id} className={`task-item-modern ${task.status === 'Completed' ? 'task-completed' : ''}`}>
                    <div className="task-check" onClick={() => {
                      if (task.status !== 'Completed') {
                        markTaskComplete(task.id);
                      }
                    }} style={{ cursor: task.status !== 'Completed' ? 'pointer' : 'default' }}>
                      {task.status === 'Completed' ? '✅' : '⭕'}
                    </div>
                    <div className="task-content-modern">
                      <div className="task-title-modern">
                        {task.title}
                        {task.isRecurring && <span className="recurring-badge">🔄 Daily</span>}
                      </div>
                      <div className={`task-status-modern status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status === 'Completed' ? 'Completed Today' : 
                         task.status === 'In Progress' ? task.description : 
                         'Due ' + new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    {task.status !== 'Completed' && (
                      <button 
                        className="btn-mark-complete" 
                        onClick={() => markTaskComplete(task.id)}
                        title="Mark as completed"
                      >
                        ✓ Complete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            {myTasks.length > 6 && (
              <button className="view-all-btn">View All ({myTasks.length})</button>
            )}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="dashboard-card calendar-modern-card">
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
            <button className="view-full-calendar-btn">View Full Calendar</button>
          </div>
        </div>

        {/* Work Hours Section */}
        <div className="dashboard-card workhours-modern-card">
          <div className="card-header-modern">
            <h2>Work Hours</h2>
          </div>
          <div className="card-content">
            <div className="workhours-circle">
              <svg viewBox="0 0 200 200" className="circular-progress">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#e6f0ff"
                  strokeWidth="16"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="url(#workGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(weeklyHours.totalHours / 40) * 502.4} 502.4`}
                  transform="rotate(-90 100 100)"
                />
                <defs>
                  <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="hours-text">
                <div className="hours-number">{Math.floor(weeklyHours.totalHours)}h {Math.round((weeklyHours.totalHours % 1) * 60)}m</div>
                <div className="hours-label">This Week</div>
              </div>
            </div>
            <div className="workhours-details">
              <div className="workhour-row">
                <span className="workhour-icon">🕐</span>
                <span className="workhour-label">Check-In:</span>
                <span className="workhour-value">
                  {todayWorkHours && todayWorkHours.checkIn
                    ? new Date(todayWorkHours.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </span>
              </div>
              <div className="workhour-row">
                <span className="workhour-icon">🕔</span>
                <span className="workhour-label">Check-Out:</span>
                <span className="workhour-value">
                  {todayWorkHours && todayWorkHours.checkOut
                    ? new Date(todayWorkHours.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </span>
              </div>
              <div className="workhour-row">
                <span className="workhour-icon">⏱️</span>
                <span className="workhour-label">Overtime:</span>
                <span className="workhour-value">{Math.floor(weeklyHours.totalOvertime)}h {Math.round((weeklyHours.totalOvertime % 1) * 60)}m</span>
              </div>
            </div>
            {!checkedIn ? (
              <button className="checkin-btn" onClick={handleCheckIn} type="button">
                🕐 Check In
              </button>
            ) : (
              <button className="checkout-btn" onClick={handleCheckOut} type="button">
                🕔 Check Out
              </button>
            )}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="dashboard-card timeoff-modern-card">
          <div className="card-header-modern">
            <h2>Leave Requests</h2>
            <span className="leave-balance-badge">{employees.find(e => e.id === currentUser.employeeId)?.leaveBalance || 2} days left</span>
          </div>
          <div className="card-content">
            <div className="leave-request-form-section">
              <h3 className="form-section-title">Request Leave</h3>
              <form onSubmit={handleRequestLeave} className="leave-request-form">
                <div className="form-row">
                  <input
                    type="date"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                    className="leave-input"
                    placeholder="Start Date"
                    required
                  />
                  <input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
                    className="leave-input"
                    placeholder="End Date"
                    required
                  />
                </div>
                <select
                  value={newLeave.type}
                  onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                  className="leave-select"
                >
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason for leave"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                  className="leave-input"
                  required
                />
                <button type="submit" className="submit-leave-btn">Submit Request</button>
              </form>
            </div>
            
            <div className="leave-requests-list-section">
              <h3 className="form-section-title">My Leave Requests</h3>
              <div className="leave-requests-list">
                {myLeaveRequests.length === 0 ? (
                  <p className="empty-state-modern">No leave requests yet</p>
                ) : (
                  myLeaveRequests.slice(-3).reverse().map(leave => (
                    <div key={leave.id} className="leave-request-item">
                      <div className="leave-request-info">
                        <div className="leave-dates-row">
                          <span className="leave-icon">
                            {leave.type === 'sick' ? '🤒' : 
                             leave.type === 'vacation' ? '🏖️' : 
                             leave.type === 'casual' ? '📅' : '📝'}
                          </span>
                          <div className="leave-date-details">
                            <div className="leave-type-title">{leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave</div>
                            <div className="leave-dates-text">
                              {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="leave-reason-text">{leave.reason}</div>
                      </div>
                      <span className={`leave-status-badge status-${leave.status.toLowerCase()}`}>
                        {leave.status === 'Approved' && '✓ Approved'}
                        {leave.status === 'Rejected' && '✗ Rejected'}
                        {leave.status === 'Pending' && '⏳ Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Announcements */}
        <div className="dashboard-card announcements-modern-card">
          <div className="card-header-modern">
            <h2>📢 Announcements</h2>
            <span className="badge-modern">{myAnnouncements.length}</span>
          </div>
          <div className="card-content">
            <div className="announcements-list-modern">
              {myAnnouncements.slice(-3).reverse().map((announcement) => (
                <div key={announcement.id} className="announcement-item-modern">
                  <span className="announcement-icon-modern">
                    {announcement.type === 'individual' ? '👤' : '📣'}
                  </span>
                  <div className="announcement-content-modern">
                    <div className="announcement-title-modern">
                      {announcement.title}
                      {announcement.type === 'individual' && (
                        <span className="personal-badge"> Personal</span>
                      )}
                    </div>
                    <div className="announcement-message-modern">{announcement.message}</div>
                    <div className="announcement-date-modern">
                      {new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {myAnnouncements.length === 0 && (
                <p className="empty-state-modern">No announcements</p>
              )}
            </div>
            {myAnnouncements.length > 0 && (
              <button className="view-all-btn">View All ({myAnnouncements.length})</button>
            )}
          </div>
        </div>

        {/* Recent Files */}
        <div className="dashboard-card files-modern-card">
          <div className="card-header-modern">
            <h2>Recent Activity</h2>
            <span className="file-count">{myTasks.length}</span>
          </div>
          <div className="card-content">
            <div className="files-list-modern">
              {myTasks.length === 0 ? (
                <p className="empty-state-modern">No recent activity</p>
              ) : (
                myTasks.slice(0, 4).map((task, idx) => (
                  <div key={task.id} className="file-item-modern">
                    <span className="file-icon">
                      {task.status === 'Completed' ? '✅' : 
                       task.isRecurring ? '🔄' : '📋'}
                    </span>
                    <div className="file-details">
                      <div className="file-name">{task.title}</div>
                      <div className="file-meta">
                        {task.status === 'Completed' 
                          ? `Completed ${task.completedAt ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'recently'}`
                          : `Due ${new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="open-drive-btn">View All Activity</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
