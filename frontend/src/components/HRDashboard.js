import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.1.12:5000/api';

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
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
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

  const [photo, setPhoto] = useState(localStorage.getItem(`hr-photo-${currentUser.id}`) || null);

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Holiday management state
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [customHolidays, setCustomHolidays] = useState(() => {
    const saved = localStorage.getItem('custom-holidays-2027');
    return saved ? JSON.parse(saved) : [];
  });
  const [newHoliday, setNewHoliday] = useState({
    date: '',
    name: ''
  });

  // Monthly summary state
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('hr-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('hr-dark-mode', JSON.stringify(newMode));
  };

  // Editable stats state
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('hr-dashboard-stats');
    return saved ? JSON.parse(saved) : {
      newHires: 3,
      performance: 'Excellent'
    };
  });

  const [editingStats, setEditingStats] = useState({
    newHires: false,
    performance: false
  });

  const updateStat = (key, value) => {
    const newStats = { ...stats, [key]: value };
    setStats(newStats);
    localStorage.setItem('hr-dashboard-stats', JSON.stringify(newStats));
    setEditingStats({ ...editingStats, [key]: false });
  };

  // Holiday data for 2026 and custom holidays
  const holidays2026 = [
    { date: '2026-02-15', name: 'Shiv Ratri' },
    { date: '2026-03-04', name: 'Holi' },
    { date: '2026-03-26', name: 'Rama Navami' },
    { date: '2026-06-15', name: 'Raja Sankranti' },
    { date: '2026-07-16', name: 'Rath Yatra' },
    { date: '2026-08-28', name: 'Raksha Bandhan' },
    { date: '2026-09-04', name: 'Janmashtami' },
    { date: '2026-09-14', name: 'Ganesh Chaturthi' },
    { date: '2026-10-19', name: 'Maha Ashtami' },
    { date: '2026-10-20', name: 'Dussehra' },
    { date: '2026-11-08', name: 'Diwali' }
  ];

  // Combine default and custom holidays
  const allHolidays = [...holidays2026, ...customHolidays];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem(`hr-photo-${currentUser.id}`, reader.result);
        setPhoto(reader.result);
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to get calendar days for selected month
  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
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

  const navigateMonth = (direction) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const isHoliday = (day) => {
    if (!day) return false;
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allHolidays.some(h => h.date === dateStr);
  };

  const isSunday = (day) => {
    if (!day) return false;
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const date = new Date(year, month, day);
    return date.getDay() === 0; // Sunday is 0
  };

  const getHolidayName = (day) => {
    if (!day) return null;
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holiday = allHolidays.find(h => h.date === dateStr);
    return holiday ? holiday.name : null;
  };

  const getCurrentDate = () => new Date().getDate();
  const getCurrentMonth = () => calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const getDisplayMonth = () => calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    const calYear = calendarDate.getFullYear();
    const calMonth = calendarDate.getMonth();
    return day === today.getDate() && 
           calYear === today.getFullYear() && 
           calMonth === today.getMonth();
  };

  // Holiday management functions
  const addHoliday = () => {
    if (newHoliday.date && newHoliday.name.trim()) {
      const updatedHolidays = [...customHolidays, newHoliday];
      setCustomHolidays(updatedHolidays);
      localStorage.setItem('custom-holidays-2027', JSON.stringify(updatedHolidays));
      setNewHoliday({ date: '', name: '' });
      setShowHolidayForm(false);
    }
  };

  const removeHoliday = (holidayToRemove) => {
    const updatedHolidays = customHolidays.filter(h => 
      h.date !== holidayToRemove.date || h.name !== holidayToRemove.name
    );
    setCustomHolidays(updatedHolidays);
    localStorage.setItem('custom-holidays-2027', JSON.stringify(updatedHolidays));
  };

  // Monthly summary functions
  const getMonthlyAttendanceSummary = () => {
    const monthStart = summaryMonth + '-01';
    const monthEnd = summaryMonth + '-31';
    
    return employees.map(employee => {
      const employeeAttendance = attendance.filter(a => 
        a.employeeId === employee.id && 
        a.date >= monthStart && 
        a.date <= monthEnd
      );
      
      const totalDays = employeeAttendance.length;
      const presentDays = employeeAttendance.filter(a => a.status === 'Present').length;
      const wfhDays = employeeAttendance.filter(a => a.status === 'WFH').length;
      const absentDays = employeeAttendance.filter(a => a.status === 'Absent').length;
      const attendanceRate = totalDays > 0 ? Math.round(((presentDays + wfhDays) / totalDays) * 100) : 0;
      
      return {
        employee,
        totalDays,
        presentDays,
        wfhDays,
        absentDays,
        attendanceRate
      };
    });
  };

  const getMonthlyLeaveSummary = () => {
    const monthStart = summaryMonth + '-01';
    const monthEnd = summaryMonth + '-31';
    
    return employees.map(employee => {
      const employeeLeaves = leaveRequests.filter(leave => {
        const startDate = leave.startDate;
        const endDate = leave.endDate;
        return leave.employeeId === employee.id && 
               ((startDate >= monthStart && startDate <= monthEnd) ||
                (endDate >= monthStart && endDate <= monthEnd) ||
                (startDate <= monthStart && endDate >= monthEnd));
      });
      
      const approvedLeaves = employeeLeaves.filter(l => l.status === 'Approved');
      const pendingLeaves = employeeLeaves.filter(l => l.status === 'Pending');
      const rejectedLeaves = employeeLeaves.filter(l => l.status === 'Rejected');
      
      const totalLeaveDays = approvedLeaves.reduce((sum, leave) => {
        const start = new Date(Math.max(new Date(leave.startDate), new Date(monthStart)));
        const end = new Date(Math.min(new Date(leave.endDate), new Date(monthEnd)));
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);
      
      return {
        employee,
        totalRequests: employeeLeaves.length,
        approvedRequests: approvedLeaves.length,
        pendingRequests: pendingLeaves.length,
        rejectedRequests: rejectedLeaves.length,
        totalLeaveDays
      };
    });
  };

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
      alert('Leave request approved successfully!');
    } catch (error) {
      console.error('Error approving leave:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to approve leave request. Please try again.');
      }
    }
  };

  const markAttendance = async (employeeId, status) => {
    try {
      await axios.post(`${API_URL}/attendance`, {
        employeeId,
        date: selectedDate,
        status
      });
      fetchAttendance();
      alert(`Attendance marked as ${status}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const viewAttendanceHistory = async (employee) => {
    try {
      const response = await axios.get(`${API_URL}/attendance/employee/${employee.id}`);
      // Get last 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const filtered = response.data.filter(record => new Date(record.date) >= sixMonthsAgo);
      setAttendanceHistory(filtered);
      setSelectedEmployeeForHistory(employee);
      setShowAttendanceHistory(true);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const closeAttendanceHistory = () => {
    setShowAttendanceHistory(false);
    setSelectedEmployeeForHistory(null);
    setAttendanceHistory([]);
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

  const closeIssue = async (id) => {
    try {
      await axios.put(`${API_URL}/issues/${id}`, { status: 'Closed' });
      fetchIssues();
    } catch (error) {
      console.error('Error closing issue:', error);
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
    <div className={`dashboard hr-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <header className="dashboard-header">
        <div className="header-left">
          <div className="user-avatar-header">
            {photo ? (
              <img src={photo} alt="HR" className="user-photo-header" />
            ) : (
              <div className="user-initial-header">{currentUser.name.charAt(0)}</div>
            )}
            <label className="photo-upload-label-header">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display: 'none'}} />
              <span className="camera-icon">📷</span>
            </label>
          </div>
          <div>
            <h1>Welcome, <span className="highlight">HR/Admin</span></h1>
            <p className="subtitle">HR/Manager Dashboard ▼</p>
          </div>
        </div>
        <div className="header-right">
          <button className="dark-mode-toggle" onClick={toggleDarkMode} title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
            {darkMode ? '☀️' : '🌙'}
          </button>
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
            {editingStats.newHires ? (
              <input 
                type="number" 
                value={stats.newHires} 
                onChange={(e) => setStats({ ...stats, newHires: parseInt(e.target.value) || 0 })}
                onBlur={() => updateStat('newHires', stats.newHires)}
                onKeyPress={(e) => e.key === 'Enter' && updateStat('newHires', stats.newHires)}
                className="stat-input"
                autoFocus
              />
            ) : (
              <div className="stat-value" onClick={() => setEditingStats({ ...editingStats, newHires: true })} style={{cursor: 'pointer'}}>{stats.newHires}</div>
            )}
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
            {editingStats.performance ? (
              <select 
                value={stats.performance} 
                onChange={(e) => updateStat('performance', e.target.value)}
                className="stat-input-select"
                autoFocus
              >
                <option value="Excellent">Excellent</option>
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Needs Improvement">Needs Improvement</option>
              </select>
            ) : (
              <div className="stat-value-text" onClick={() => setEditingStats({ ...editingStats, performance: true })} style={{cursor: 'pointer'}}>{stats.performance}</div>
            )}
            <div className="stat-subtitle">&nbsp;</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid-hr">
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
            <h2>Attendance Tracking</h2>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker-modern"
            />
          </div>
          <div className="card-content">
            <div className="attendance-stats-row">
              <div className="attendance-stat-box present-box">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <div className="stat-number">{todayAttendance.filter(a => a.status === 'Present').length}</div>
                  <div className="stat-label">Present</div>
                </div>
              </div>
              <div className="attendance-stat-box absent-box">
                <div className="stat-icon">✗</div>
                <div className="stat-info">
                  <div className="stat-number">{todayAttendance.filter(a => a.status === 'Absent').length}</div>
                  <div className="stat-label">Absent</div>
                </div>
              </div>
              <div className="attendance-stat-box wfh-box">
                <div className="stat-icon">🏠</div>
                <div className="stat-info">
                  <div className="stat-number">{todayAttendance.filter(a => a.status === 'WFH').length}</div>
                  <div className="stat-label">WFH</div>
                </div>
              </div>
            </div>
            
            <div className="attendance-list">
              <h3 className="section-title">Mark Attendance</h3>
              {employees.map(employee => {
                const attendanceRecord = todayAttendance.find(a => a.employeeId === employee.id);
                return (
                  <div key={employee.id} className="attendance-row">
                    <div className="employee-info-attendance">
                      <div className="emp-avatar-small">{employee.name.charAt(0)}</div>
                      <div>
                        <div className="emp-name-small">{employee.name}</div>
                        <div className="emp-position-small">{employee.position}</div>
                      </div>
                    </div>
                    <div className="attendance-actions">
                      <button 
                        className={`attendance-btn present-btn ${attendanceRecord?.status === 'Present' ? 'active' : ''}`}
                        onClick={() => markAttendance(employee.id, 'Present')}
                        title="Mark Present"
                      >
                        ✓
                      </button>
                      <button 
                        className={`attendance-btn absent-btn ${attendanceRecord?.status === 'Absent' ? 'active' : ''}`}
                        onClick={() => markAttendance(employee.id, 'Absent')}
                        title="Mark Absent"
                      >
                        ✗
                      </button>
                      <button 
                        className={`attendance-btn wfh-btn ${attendanceRecord?.status === 'WFH' ? 'active' : ''}`}
                        onClick={() => markAttendance(employee.id, 'WFH')}
                        title="Mark Work From Home"
                      >
                        🏠
                      </button>
                      <button 
                        className="attendance-history-btn"
                        onClick={() => viewAttendanceHistory(employee)}
                        title="View Attendance History"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activities-hr-card">
          <div className="card-header-modern">
            <h2>Recent Activity</h2>
            <span className="badge-count">{todayCompletedTasks.length + pendingLeave.length}</span>
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
                <p className="empty-state-modern">No recent activity</p>
              )}
            </div>
            <button className="view-all-activities-btn">View All Activity</button>
          </div>
        </div>

        {/* Issues */}
        <div className="dashboard-card issues-hr-card">
          <div className="card-header-modern">
            <h2>Issues</h2>
            <span className="badge-count badge-alert">{issues.filter(i => i.status === 'Open').length}</span>
          </div>
          <div className="card-content">
            <div className="activities-list-hr">
              {issues.length === 0 ? (
                <p className="empty-state-modern">No issues reported</p>
              ) : (
                issues.slice().reverse().slice(0, 1).map((issue) => {
                  const employee = employees.find(e => e.id === issue.employeeId);
                  const priorityColors = {
                    low: 'green-bg',
                    medium: 'orange-bg',
                    high: 'red-bg'
                  };
                  const priorityIcons = {
                    low: '🟢',
                    medium: '🟡',
                    high: '🔴'
                  };
                  
                  return (
                    <div key={issue.id} className={`issue-item-card ${issue.status === 'Closed' ? 'issue-closed' : ''}`}>
                      <div className="issue-item-header">
                        <span className={`issue-priority-icon-large ${priorityColors[issue.priority]}`}>
                          {issue.status === 'Closed' ? '✅' : priorityIcons[issue.priority]}
                        </span>
                        <div className="issue-item-info">
                          <div className="issue-item-title">
                            <strong>{employee?.name || 'Unknown'}</strong>: {issue.title}
                            {issue.status === 'Closed' && <span className="closed-label"> (Resolved)</span>}
                          </div>
                          <div className="issue-item-description">{issue.description}</div>
                        </div>
                      </div>
                      <div className="issue-item-footer">
                        <span className={`issue-priority-badge-large ${issue.priority}`}>
                          {issue.priority.toUpperCase()}
                        </span>
                        {issue.status === 'Open' && (
                          <button 
                            className="close-issue-btn-modern" 
                            onClick={() => closeIssue(issue.id)}
                            title="Mark as resolved"
                          >
                            ✓ Close
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button className="view-all-activities-btn">View All Issues</button>
          </div>
        </div>

        {/* Calendar */}
        <div className="dashboard-card calendar-hr-card">
          <div className="card-header-modern">
            <h2>Calendar</h2>
            <div className="calendar-navigation">
              <button className="nav-month-btn" onClick={() => navigateMonth(-1)}>‹</button>
              <span className="calendar-icon-small">📅 {getCurrentMonth()}</span>
              <button className="nav-month-btn" onClick={() => navigateMonth(1)}>›</button>
            </div>
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
                {getCalendarDays().map((day, idx) => {
                  const isHolidayDay = isHoliday(day);
                  const isSundayDay = isSunday(day);
                  const holidayName = getHolidayName(day);
                  return (
                    <div 
                      key={idx} 
                      className={`calendar-date ${isToday(day) ? 'today-date' : ''} ${!day ? 'empty-date' : ''} ${isHolidayDay ? 'holiday-date' : ''}`}
                      title={holidayName || ''}
                    >
                      {day || ''}
                      {day && isHolidayDay && <span className="holiday-indicator">🎉</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="calendar-footer">
              <button className="view-full-calendar-btn">View Full Calendar+ ›</button>
              <button 
                className="manage-holidays-btn" 
                onClick={() => setShowHolidayForm(!showHolidayForm)}
              >
                {showHolidayForm ? 'Cancel' : '+ Add Holiday'}
              </button>
            </div>
            
            {/* Holiday Management Form */}
            {showHolidayForm && (
              <div className="holiday-form">
                <h4>Add Holiday for 2027</h4>
                <div className="holiday-form-inputs">
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                    min="2027-01-01"
                    max="2027-12-31"
                    placeholder="Select date"
                  />
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                    placeholder="Holiday name"
                    maxLength="50"
                  />
                  <button className="add-holiday-btn" onClick={addHoliday}>
                    Add Holiday
                  </button>
                </div>
                
                {/* Custom Holidays List */}
                {customHolidays.length > 0 && (
                  <div className="custom-holidays-list">
                    <h5>Added Holidays for 2027:</h5>
                    {customHolidays.map((holiday, idx) => (
                      <div key={idx} className="custom-holiday-item">
                        <span>{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {holiday.name}</span>
                        <button 
                          className="remove-holiday-btn" 
                          onClick={() => removeHoliday(holiday)}
                          title="Remove holiday"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Announcements Management */}
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
      </div>

      {/* Attendance History Modal */}
      {showAttendanceHistory && (
        <div className="modal-overlay" onClick={closeAttendanceHistory}>
          <div className="modal-content attendance-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Attendance History - {selectedEmployeeForHistory?.name}</h2>
              <button className="modal-close-btn" onClick={closeAttendanceHistory}>✕</button>
            </div>
            <div className="modal-body">
              <div className="history-summary">
                <div className="history-stat">
                  <div className="history-stat-label">Total Days</div>
                  <div className="history-stat-value">{attendanceHistory.length}</div>
                </div>
                <div className="history-stat">
                  <div className="history-stat-label">Present</div>
                  <div className="history-stat-value present-color">
                    {attendanceHistory.filter(r => r.status === 'Present').length}
                  </div>
                </div>
                <div className="history-stat">
                  <div className="history-stat-label">Absent</div>
                  <div className="history-stat-value absent-color">
                    {attendanceHistory.filter(r => r.status === 'Absent').length}
                  </div>
                </div>
                <div className="history-stat">
                  <div className="history-stat-label">WFH</div>
                  <div className="history-stat-value wfh-color">
                    {attendanceHistory.filter(r => r.status === 'WFH').length}
                  </div>
                </div>
              </div>
              <div className="history-list">
                {attendanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => (
                  <div key={record.id} className="history-item">
                    <div className="history-date">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className={`history-status status-${record.status.toLowerCase()}`}>
                      {record.status === 'Present' && '✓ Present'}
                      {record.status === 'Absent' && '✗ Absent'}
                      {record.status === 'WFH' && '🏠 Work From Home'}
                    </div>
                  </div>
                ))}
                {attendanceHistory.length === 0 && (
                  <p className="empty-state-modern">No attendance records found for the last 6 months</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Summary Section */}
      <div className="dashboard-card monthly-summary-card">
        <div className="card-header-modern">
          <h2>Monthly Reports</h2>
          <div className="summary-controls">
            <input 
              type="month" 
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              className="month-selector"
            />
            <button 
              className="toggle-summary-btn"
              onClick={() => setShowMonthlySummary(!showMonthlySummary)}
            >
              {showMonthlySummary ? 'Hide' : 'Show'} Summary
            </button>
          </div>
        </div>
        
        {showMonthlySummary && (
          <div className="card-content">
            <div className="summary-tabs">
              <div className="summary-section">
                <h3>Attendance Summary - {new Date(summaryMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <div className="summary-table">
                  <div className="summary-header">
                    <span>Employee</span>
                    <span>Total Days</span>
                    <span>Present</span>
                    <span>WFH</span>
                    <span>Absent</span>
                    <span>Rate</span>
                  </div>
                  {getMonthlyAttendanceSummary().map((summary, idx) => (
                    <div key={idx} className="summary-row">
                      <span className="employee-name">{summary.employee.name}</span>
                      <span>{summary.totalDays}</span>
                      <span className="present-count">{summary.presentDays}</span>
                      <span className="wfh-count">{summary.wfhDays}</span>
                      <span className="absent-count">{summary.absentDays}</span>
                      <span className={`attendance-rate ${summary.attendanceRate >= 80 ? 'good' : summary.attendanceRate >= 60 ? 'average' : 'poor'}`}>
                        {summary.attendanceRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="summary-section">
                <h3>Leave Summary - {new Date(summaryMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <div className="summary-table">
                  <div className="summary-header">
                    <span>Employee</span>
                    <span>Total Requests</span>
                    <span>Approved</span>
                    <span>Pending</span>
                    <span>Rejected</span>
                    <span>Leave Days</span>
                  </div>
                  {getMonthlyLeaveSummary().map((summary, idx) => (
                    <div key={idx} className="summary-row">
                      <span className="employee-name">{summary.employee.name}</span>
                      <span>{summary.totalRequests}</span>
                      <span className="approved-count">{summary.approvedRequests}</span>
                      <span className="pending-count">{summary.pendingRequests}</span>
                      <span className="rejected-count">{summary.rejectedRequests}</span>
                      <span className="leave-days">{summary.totalLeaveDays}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HRDashboard;
