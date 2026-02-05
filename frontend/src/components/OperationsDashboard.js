import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function OperationsDashboard({ 
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
  const [departmentIssues, setDepartmentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('operations-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('operations-dark-mode', JSON.stringify(newMode));
  };

  useEffect(() => {
    fetchDepartmentIssues();
  }, []);

  const fetchDepartmentIssues = async () => {
    try {
      const response = await axios.get(`${API_URL}/issues/department/operations`);
      setDepartmentIssues(response.data);
    } catch (error) {
      console.error('Error fetching department issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter employees by department
  const departmentEmployees = employees.filter(emp => emp.department === 'operations');
  
  // Filter tasks assigned to department employees
  const departmentTasks = tasks.filter(task => {
    const employee = employees.find(emp => emp.id === task.employeeId);
    return employee && employee.department === 'operations';
  });

  // Filter attendance for department employees
  const departmentAttendance = attendance.filter(att => {
    const employee = employees.find(emp => emp.id === att.employeeId);
    return employee && employee.department === 'operations' && att.date === selectedDate;
  });

  // Calculate department stats
  const todayAttendance = departmentAttendance.filter(att => att.date === selectedDate);
  const presentCount = todayAttendance.filter(att => att.status === 'Present' || att.status === 'WFH').length;
  const totalEmployees = departmentEmployees.length;
  const attendanceRate = totalEmployees > 0 ? ((presentCount / totalEmployees) * 100).toFixed(1) : 0;

  const pendingTasks = departmentTasks.filter(task => task.status === 'Assigned' || task.status === 'In Progress').length;
  const completedTasks = departmentTasks.filter(task => task.status === 'Completed').length;
  
  const openIssues = departmentIssues.filter(issue => issue.status === 'Open').length;
  const resolvedIssues = departmentIssues.filter(issue => issue.status === 'Resolved' || issue.status === 'Closed').length;

  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    try {
      await axios.put(`${API_URL}/issues/${issueId}`, { status: newStatus });
      fetchDepartmentIssues();
      fetchIssues(); // Update main issues list
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            ⚙️ Operations Department Dashboard
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.7 }}>
            Welcome back, {currentUser.name}!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleDarkMode}
            style={{
              padding: '8px 15px',
              backgroundColor: darkMode ? '#f39c12' : '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Department Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#3498db' }}>📊 Today's Attendance</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
            {presentCount}/{totalEmployees}
          </div>
          <div style={{ color: attendanceRate >= 80 ? '#2ecc71' : '#e74c3c' }}>
            {attendanceRate}% Present
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#f39c12' }}>📋 Tasks Overview</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{pendingTasks}</div>
              <div style={{ color: '#f39c12' }}>Pending</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{completedTasks}</div>
              <div style={{ color: '#2ecc71' }}>Completed</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#e74c3c' }}>🚨 Issues Status</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{openIssues}</div>
              <div style={{ color: '#e74c3c' }}>Open</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{resolvedIssues}</div>
              <div style={{ color: '#2ecc71' }}>Resolved</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2ecc71' }}>👥 Team Size</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
            {totalEmployees}
          </div>
          <div style={{ opacity: 0.7 }}>
            Operations Team Members
          </div>
        </div>
      </div>

      {/* Current Department Issues */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '20px', color: '#e74c3c' }}>🚨 Department Issues</h3>
        {loading ? (
          <p>Loading issues...</p>
        ) : departmentIssues.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No issues assigned to operations department</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {departmentIssues.map(issue => (
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

                {/* Action buttons for heads and managers */}
                {(currentUser.role === 'head' || currentUser.role === 'manager') && issue.status !== 'Closed' && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {issue.status === 'Open' && (
                      <button
                        onClick={() => handleUpdateIssueStatus(issue.id, 'In Progress')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Start Progress
                      </button>
                    )}
                    {(issue.status === 'Open' || issue.status === 'In Progress') && (
                      <button
                        onClick={() => handleUpdateIssueStatus(issue.id, 'Resolved')}
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
            ))}
          </div>
        )}
      </div>

      {/* Operations Performance Metrics */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '20px', color: '#9b59b6' }}>📈 Operations Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
              {departmentTasks.filter(task => 
                task.status === 'Completed' && 
                new Date(task.completedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <div style={{ opacity: 0.7 }}>Tasks This Week</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
              {departmentTasks.filter(task => 
                new Date(task.deadline) < new Date() && task.status !== 'Completed'
              ).length}
            </div>
            <div style={{ opacity: 0.7 }}>Overdue Tasks</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
              {Math.round(
                (departmentTasks.filter(task => task.status === 'Completed').length / 
                Math.max(departmentTasks.length, 1)) * 100
              )}%
            </div>
            <div style={{ opacity: 0.7 }}>Completion Rate</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
              {departmentIssues.filter(issue => 
                issue.status === 'Resolved' && 
                new Date(issue.resolvedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <div style={{ opacity: 0.7 }}>Issues Resolved This Week</div>
          </div>
        </div>
      </div>

      {/* Department Team Attendance */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '20px', color: '#3498db' }}>📊 Team Attendance</h3>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: darkMode ? '#2c3e50' : 'white',
              color: darkMode ? '#ecf0f1' : '#2c3e50'
            }}
          />
        </div>
        
        {departmentEmployees.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No team members found</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {departmentEmployees.map(employee => {
              const employeeAttendance = departmentAttendance.find(att => att.employeeId === employee.id);
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

      {/* Department Tasks */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '20px', color: '#f39c12' }}>📋 Department Tasks</h3>
        {departmentTasks.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No tasks assigned to team members</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {departmentTasks.slice(0, 10).map(task => (
              <div
                key={task.id}
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    Assigned to: {getEmployeeName(task.employeeId)} | 
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: 
                        task.status === 'Completed' ? '#2ecc71' :
                        task.status === 'In Progress' ? '#f39c12' :
                        task.status === 'Approved' ? '#3498db' : '#95a5a6'
                    }}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OperationsDashboard;