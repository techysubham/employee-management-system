import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

function TemplateDashboard({ 
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: '', 
    message: '', 
    type: 'department', 
    targetEmployeeId: null 
  });

  const [photo, setPhoto] = useState(localStorage.getItem(`template-photo-${currentUser.id}`) || null);

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('template-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('template-dark-mode', JSON.stringify(newMode));
  };

  // Editable stats state
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('template-dashboard-stats');
    return saved ? JSON.parse(saved) : {
      templatesCreated: 12,
      productivity: 'High'
    };
  });

  const [editingStats, setEditingStats] = useState({
    templatesCreated: false,
    productivity: false
  });

  const updateStat = (key, value) => {
    const newStats = { ...stats, [key]: value };
    setStats(newStats);
    localStorage.setItem('template-dashboard-stats', JSON.stringify(newStats));
    setEditingStats({ ...editingStats, [key]: false });
  };

  // Filter data by department
  const departmentEmployees = employees.filter(emp => emp.department === 'template');
  const departmentTasks = tasks.filter(task => {
    const employee = employees.find(emp => emp.id === task.employeeId);
    return employee && employee.department === 'template';
  });
  const departmentIssues = issues.filter(issue => issue.assignedTo === 'template' || issue.department === 'template');
  const departmentLeaveRequests = leaveRequests.filter(req => {
    const employee = employees.find(emp => emp.id === req.employeeId);
    return employee && employee.department === 'template';
  });

  // Calculate department stats
  const todayAttendance = attendance.filter(att => {
    const employee = employees.find(emp => emp.id === att.employeeId);
    return employee && employee.department === 'template' && att.date === selectedDate;
  });
  const presentCount = todayAttendance.filter(att => att.status === 'Present' || att.status === 'WFH').length;
  const totalEmployees = departmentEmployees.length;
  const attendanceRate = totalEmployees > 0 ? ((presentCount / totalEmployees) * 100).toFixed(1) : 0;

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/announcements`, {
        ...newAnnouncement,
        createdBy: currentUser.id
      });
      
      setNewAnnouncement({ title: '', message: '', type: 'department', targetEmployeeId: null });
      await fetchAnnouncements();
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement.');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target.result;
        setPhoto(photoData);
        localStorage.setItem(`template-photo-${currentUser.id}`, photoData);
      };
      reader.readAsDataURL(file);
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

  // Calendar functions
  const getCurrentMonth = () => {
    return calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      if (days.length >= 42) break;
    }
    
    return days;
  };

  const isHoliday = (date) => {
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
      { date: '2026-11-07', name: 'Diwali' },
      { date: '2026-11-19', name: 'Guru Nanak Jayanti' },
      { date: '2026-12-25', name: 'Christmas Day' }
    ];
    
    const dateStr = date.toISOString().split('T')[0];
    return holidays2026.some(holiday => holiday.date === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const containerStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
    color: darkMode ? '#ecf0f1' : '#2c3e50',
    minHeight: '100vh'
  };

  const cardStyle = {
    backgroundColor: darkMode ? '#34495e' : 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  };

  return (
    <div style={containerStyle}>
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🎨 Template Department Dashboard</h1>
          <p>Welcome back, {currentUser.name}!</p>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <div className="profile-photo-container">
              {photo ? (
                <img src={photo} alt="Profile" className="profile-photo" />
              ) : (
                <div className="profile-placeholder">📷</div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="photo-upload-input"
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="photo-upload-btn">
                📷
              </label>
            </div>
            <div className="profile-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">Template Department</span>
            </div>
          </div>
          <button onClick={toggleDarkMode} className="dark-mode-toggle">
            {darkMode ? '🌞' : '🌙'}
          </button>
          <button onClick={onLogout} className="logout-btn-modern">
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#3498db' }}>👥 Team Attendance</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
            {presentCount}/{totalEmployees}
          </div>
          <div style={{ color: attendanceRate >= 80 ? '#2ecc71' : '#e74c3c' }}>
            {attendanceRate}% Present Today
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#f39c12' }}>📋 Department Tasks</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {departmentTasks.filter(task => task.status === 'Assigned' || task.status === 'In Progress').length}
              </div>
              <div style={{ color: '#f39c12' }}>Active</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {departmentTasks.filter(task => task.status === 'Completed').length}
              </div>
              <div style={{ color: '#2ecc71' }}>Completed</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#e74c3c' }}>🚨 Department Issues</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {departmentIssues.filter(issue => issue.status === 'Open').length}
              </div>
              <div style={{ color: '#e74c3c' }}>Open</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {departmentIssues.filter(issue => issue.status === 'Resolved' || issue.status === 'Closed').length}
              </div>
              <div style={{ color: '#2ecc71' }}>Resolved</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#9b59b6' }}>📄 Templates Created</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
            {editingStats.templatesCreated ? (
              <input
                type="number"
                value={stats.templatesCreated}
                onChange={(e) => updateStat('templatesCreated', parseInt(e.target.value))}
                onBlur={() => setEditingStats({ ...editingStats, templatesCreated: false })}
                autoFocus
                style={{ fontSize: '32px', fontWeight: 'bold', border: 'none', background: 'transparent', width: '80px' }}
              />
            ) : (
              <span onClick={() => setEditingStats({ ...editingStats, templatesCreated: true })}>
                {stats.templatesCreated}
              </span>
            )}
          </div>
          <div style={{ opacity: 0.7 }}>This Month</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid-hr">
        {/* Recent Activity */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#3498db' }}>📊 Recent Activity</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[...departmentTasks, ...departmentIssues]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                    borderRadius: '6px',
                    border: `1px solid ${darkMode ? '#576574' : '#dee2e6'}`
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    {item.employeeId ? `By: ${getEmployeeName(item.employeeId)}` : ''} | 
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            {[...departmentTasks, ...departmentIssues].length === 0 && (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No recent activity</p>
            )}
          </div>
        </div>

        {/* Department Issues */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#e74c3c' }}>🚨 Template Issues</h3>
          {departmentIssues.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No issues assigned to template department</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {departmentIssues.slice(0, 3).map((issue) => {
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
                
                return (
                  <div
                    key={issue.id}
                    style={{
                      border: `1px solid ${darkMode ? '#576574' : '#dee2e6'}`,
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0' }}>
                          #{issue.id} - {issue.title}
                        </h4>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>
                          By: {getEmployeeName(issue.employeeId)} | 
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                    
                    <p style={{ margin: '10px 0', lineHeight: '1.4' }}>
                      {issue.description}
                    </p>

                    {(currentUser.role === 'head' || currentUser.role === 'manager') && issue.status !== 'Closed' && (
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {issue.status === 'Open' && (
                          <button
                            onClick={() => closeIssue(issue.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#27ae60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#2ecc71' }}>👥 Template Team</h3>
          {departmentEmployees.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No team members found</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {departmentEmployees.map(employee => {
                const employeeAttendance = todayAttendance.find(att => att.employeeId === employee.id);
                return (
                  <div
                    key={employee.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? '#576574' : '#dee2e6'}`
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{employee.name}</div>
                      <div style={{ fontSize: '14px', opacity: 0.7 }}>{employee.position}</div>
                    </div>
                    <div>
                      {employeeAttendance ? (
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundColor: 
                              employeeAttendance.status === 'Present' ? '#2ecc71' :
                              employeeAttendance.status === 'WFH' ? '#3498db' :
                              employeeAttendance.status === 'Absent' ? '#e74c3c' : '#f39c12'
                          }}
                        >
                          {employeeAttendance.status}
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundColor: '#95a5a6'
                          }}
                        >
                          Not Marked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#f39c12' }}>📅 Calendar</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontWeight: 'bold' }}>{getCurrentMonth()}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigateMonth(-1)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ‹
              </button>
              <button
                onClick={() => navigateMonth(1)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ›
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', fontSize: '14px' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px' }}>
                {day}
              </div>
            ))}
            
            {getCalendarDays().map((day, idx) => (
              <div
                key={idx}
                style={{
                  textAlign: 'center',
                  padding: '5px',
                  borderRadius: '4px',
                  backgroundColor: isToday(day) ? '#3498db' : isHoliday(day) ? '#e74c3c' : 'transparent',
                  color: isToday(day) || isHoliday(day) ? 'white' : darkMode ? '#ecf0f1' : '#2c3e50',
                  opacity: day.getMonth() !== calendarDate.getMonth() ? 0.3 : 1
                }}
              >
                {day.getDate()}
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#9b59b6' }}>📢 Department Announcements</h3>
          <form onSubmit={handleCreateAnnouncement} style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Announcement title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                backgroundColor: darkMode ? '#2c3e50' : 'white',
                color: darkMode ? '#ecf0f1' : '#2c3e50'
              }}
            />
            <textarea
              placeholder="Announcement message"
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
              required
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                resize: 'vertical',
                backgroundColor: darkMode ? '#2c3e50' : 'white',
                color: darkMode ? '#ecf0f1' : '#2c3e50'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Announcement
            </button>
          </form>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            {announcements.slice(0, 3).map(announcement => (
              <div
                key={announcement.id}
                style={{
                  padding: '10px',
                  backgroundColor: darkMode ? '#2c3e50' : '#f8f9fa',
                  borderRadius: '6px',
                  border: `1px solid ${darkMode ? '#576574' : '#dee2e6'}`
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{announcement.title}</div>
                <div style={{ fontSize: '14px', margin: '5px 0' }}>{announcement.message}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No announcements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateDashboard;