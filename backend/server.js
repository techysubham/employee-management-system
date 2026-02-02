const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data
let data = {
  employees: [
    { id: 1, name: 'John Doe', email: 'john@company.com', position: 'Developer', leaveBalance: 2, lastBalanceReset: new Date().toISOString() },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', position: 'Designer', leaveBalance: 2, lastBalanceReset: new Date().toISOString() },
    { id: 3, name: 'Bob Johnson', email: 'bob@company.com', position: 'Manager', leaveBalance: 2, lastBalanceReset: new Date().toISOString() }
  ],
  attendance: [],
  tasks: [],
  leaveRequests: [],
  announcements: [],
  issues: [],
  workHours: []
};

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      data = JSON.parse(fileData);
    } else {
      saveData();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data on startup
loadData();

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const taskRoutes = require('./routes/tasks');
const leaveRoutes = require('./routes/leave');
const announcementRoutes = require('./routes/announcements');
const issueRoutes = require('./routes/issues');
const workHoursRoutes = require('./routes/workhours');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/workhours', workHoursRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Employee Management System API' });
});

// Export data and saveData for routes
app.locals.data = data;
app.locals.saveData = saveData;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
