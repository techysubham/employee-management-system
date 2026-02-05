import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import HRDashboard from './components/HRDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ListingDashboard from './components/ListingDashboard';
import OperationsDashboard from './components/OperationsDashboard';
import ProductResearchDashboard from './components/ProductResearchDashboard';
import ResourceManagerDashboard from './components/ResourceManagerDashboard';
import Issues from './components/Issues';
import API_URL from './config';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [issues, setIssues] = useState([]);
  const [workHours, setWorkHours] = useState([]);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
      fetchAttendance();
      fetchTasks();
      fetchLeaveRequests();
      fetchAnnouncements();
      fetchIssues();
      fetchWorkHours();
    }
  }, [currentUser]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendance = async (date) => {
    try {
      const url = date ? `${API_URL}/attendance?date=${date}` : `${API_URL}/attendance`;
      const response = await axios.get(url);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/leave`);
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${API_URL}/issues`);
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const fetchWorkHours = async () => {
    try {
      const response = await axios.get(`${API_URL}/workhours`);
      setWorkHours(response.data);
    } catch (error) {
      console.error('Error fetching work hours:', error);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Function to determine which dashboard to show
  const getDashboardComponent = () => {
    // HR role always gets HR Dashboard
    if (currentUser.role === 'hr') {
      return (
        <HRDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          employees={employees}
          attendance={attendance}
          tasks={tasks}
          leaveRequests={leaveRequests}
          announcements={announcements}
          issues={issues}
          workHours={workHours}
          fetchEmployees={fetchEmployees}
          fetchAttendance={fetchAttendance}
          fetchTasks={fetchTasks}
          fetchLeaveRequests={fetchLeaveRequests}
          fetchAnnouncements={fetchAnnouncements}
          fetchIssues={fetchIssues}
          fetchWorkHours={fetchWorkHours}
        />
      );
    }

    // Department heads get their respective department dashboards
    if (currentUser.role === 'head' || currentUser.role === 'manager') {
      switch (currentUser.department) {
        case 'listing':
          return (
            <ListingDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              leaveRequests={leaveRequests}
              announcements={announcements}
              issues={issues}
              fetchEmployees={fetchEmployees}
              fetchAttendance={fetchAttendance}
              fetchTasks={fetchTasks}
              fetchLeaveRequests={fetchLeaveRequests}
              fetchAnnouncements={fetchAnnouncements}
              fetchIssues={fetchIssues}
            />
          );
        case 'operations':
          return (
            <OperationsDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              leaveRequests={leaveRequests}
              announcements={announcements}
              issues={issues}
              fetchEmployees={fetchEmployees}
              fetchAttendance={fetchAttendance}
              fetchTasks={fetchTasks}
              fetchLeaveRequests={fetchLeaveRequests}
              fetchAnnouncements={fetchAnnouncements}
              fetchIssues={fetchIssues}
            />
          );
        case 'product-research':
          return (
            <ProductResearchDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              leaveRequests={leaveRequests}
              announcements={announcements}
              issues={issues}
              fetchEmployees={fetchEmployees}
              fetchAttendance={fetchAttendance}
              fetchTasks={fetchTasks}
              fetchLeaveRequests={fetchLeaveRequests}
              fetchAnnouncements={fetchAnnouncements}
              fetchIssues={fetchIssues}
            />
          );
        case 'resource-manager':
          return (
            <ResourceManagerDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              leaveRequests={leaveRequests}
              announcements={announcements}
              issues={issues}
              workHours={workHours}
              fetchEmployees={fetchEmployees}
              fetchAttendance={fetchAttendance}
              fetchTasks={fetchTasks}
              fetchLeaveRequests={fetchLeaveRequests}
              fetchAnnouncements={fetchAnnouncements}
              fetchIssues={fetchIssues}
              fetchWorkHours={fetchWorkHours}
            />
          );
        case 'hr':
          // HR department heads also get HR Dashboard
          return (
            <HRDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              leaveRequests={leaveRequests}
              announcements={announcements}
              issues={issues}
              workHours={workHours}
              fetchEmployees={fetchEmployees}
              fetchAttendance={fetchAttendance}
              fetchTasks={fetchTasks}
              fetchLeaveRequests={fetchLeaveRequests}
              fetchAnnouncements={fetchAnnouncements}
              fetchIssues={fetchIssues}
              fetchWorkHours={fetchWorkHours}
            />
          );
        default:
          // Default to employee dashboard for unknown departments
          return (
            <EmployeeDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              employees={employees}
              attendance={attendance}
              tasks={tasks}
              leaveRequests={leaveRequests}
              announcements={announcements}
              issues={issues}
              workHours={workHours}
              fetchEmployees={fetchEmployees}
              fetchAttendance={fetchAttendance}
              fetchTasks={fetchTasks}
              fetchLeaveRequests={fetchLeaveRequests}
              fetchAnnouncements={fetchAnnouncements}
              fetchIssues={fetchIssues}
              fetchWorkHours={fetchWorkHours}
            />
          );
      }
    }

    // Regular employees get employee dashboard
    return (
      <EmployeeDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        employees={employees}
        attendance={attendance}
        tasks={tasks}
        leaveRequests={leaveRequests}
        announcements={announcements}
        issues={issues}
        workHours={workHours}
        fetchEmployees={fetchEmployees}
        fetchAttendance={fetchAttendance}
        fetchTasks={fetchTasks}
        fetchLeaveRequests={fetchLeaveRequests}
        fetchAnnouncements={fetchAnnouncements}
        fetchIssues={fetchIssues}
        fetchWorkHours={fetchWorkHours}
      />
    );
  };

  return (
    <div className="app">
      {getDashboardComponent()}
    </div>
  );
}

export default App;
