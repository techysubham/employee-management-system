// Global Variables
let employees = [];
let attendance = [];
let tasks = [];
let leaveRequests = [];
let currentUserRole = 'hr'; // 'hr' or 'employee'

// Initialize the application
function init() {
    // Load data from localStorage
    loadData();
    
    // Set today's date for attendance
    document.getElementById('attendanceDate').valueAsDate = new Date();
    
    // Update UI
    updateEmployeeTable();
    loadAttendance();
    updateTasksTable();
    updateLeaveTable();
    updateEmployeeSelects();
    updateUserInterface();
}

// Data Management
function loadData() {
    const savedEmployees = localStorage.getItem('employees');
    const savedAttendance = localStorage.getItem('attendance');
    const savedTasks = localStorage.getItem('tasks');
    const savedLeaveRequests = localStorage.getItem('leaveRequests');
    
    if (savedEmployees) employees = JSON.parse(savedEmployees);
    if (savedAttendance) attendance = JSON.parse(savedAttendance);
    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedLeaveRequests) leaveRequests = JSON.parse(savedLeaveRequests);
    
    // Add sample data if empty
    if (employees.length === 0) {
        employees = [
            { id: 1, name: 'John Doe', email: 'john@company.com', position: 'Developer' },
            { id: 2, name: 'Jane Smith', email: 'jane@company.com', position: 'Designer' },
            { id: 3, name: 'Bob Johnson', email: 'bob@company.com', position: 'Manager' }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('attendance', JSON.stringify(attendance));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Refresh data for the selected tab
    if (tabName === 'attendance') {
        loadAttendance();
    } else if (tabName === 'tasks') {
        updateTasksTable();
        updateTaskApprovals();
    } else if (tabName === 'leave') {
        updateLeaveTable();
    }
}

// User Role Management
function switchUserRole() {
    currentUserRole = currentUserRole === 'hr' ? 'employee' : 'hr';
    updateUserInterface();
}

function updateUserInterface() {
    const userDisplay = document.getElementById('currentUser');
    const container = document.querySelector('.container');
    
    if (currentUserRole === 'hr') {
        userDisplay.textContent = 'HR Dashboard';
        container.classList.remove('employee-view');
    } else {
        userDisplay.textContent = 'Employee Dashboard';
        container.classList.add('employee-view');
    }
    
    // Refresh all views
    updateEmployeeTable();
    loadAttendance();
    updateTasksTable();
    updateTaskApprovals();
    updateLeaveTable();
}

// Employee Management
function addEmployee() {
    const name = document.getElementById('empName').value.trim();
    const email = document.getElementById('empEmail').value.trim();
    const position = document.getElementById('empPosition').value.trim();
    
    if (!name || !email || !position) {
        alert('Please fill in all fields');
        return;
    }
    
    const newEmployee = {
        id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1,
        name,
        email,
        position
    };
    
    employees.push(newEmployee);
    saveData();
    updateEmployeeTable();
    updateEmployeeSelects();
    
    // Clear inputs
    document.getElementById('empName').value = '';
    document.getElementById('empEmail').value = '';
    document.getElementById('empPosition').value = '';
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        employees = employees.filter(emp => emp.id !== id);
        saveData();
        updateEmployeeTable();
        updateEmployeeSelects();
    }
}

function updateEmployeeTable() {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';
    
    employees.forEach(emp => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.position}</td>
            <td>
                ${currentUserRole === 'hr' ? 
                    `<button class="btn btn-delete" onclick="deleteEmployee(${emp.id})">Delete</button>` 
                    : '-'}
            </td>
        `;
    });
}

function updateEmployeeSelects() {
    const taskSelect = document.getElementById('taskEmployee');
    const leaveSelect = document.getElementById('leaveEmployee');
    
    taskSelect.innerHTML = '<option value="">Select Employee</option>';
    leaveSelect.innerHTML = '<option value="">Select Employee</option>';
    
    employees.forEach(emp => {
        taskSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
        leaveSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });
}

// Attendance Management
function loadAttendance() {
    const selectedDate = document.getElementById('attendanceDate').value;
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';
    
    employees.forEach(emp => {
        const attendanceRecord = attendance.find(
            a => a.employeeId === emp.id && a.date === selectedDate
        );
        
        const status = attendanceRecord ? attendanceRecord.status : 'Not Marked';
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td><span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span></td>
            <td class="hr-only">
                ${currentUserRole === 'hr' ? `
                    <button class="btn btn-mark-present" onclick="markAttendance(${emp.id}, '${selectedDate}', 'Present')">Present</button>
                    <button class="btn btn-mark-absent" onclick="markAttendance(${emp.id}, '${selectedDate}', 'Absent')">Absent</button>
                ` : '-'}
            </td>
        `;
    });
}

function markAttendance(employeeId, date, status) {
    // Remove existing record for this employee and date
    attendance = attendance.filter(a => !(a.employeeId === employeeId && a.date === date));
    
    // Add new record
    attendance.push({
        employeeId,
        date,
        status,
        markedAt: new Date().toISOString()
    });
    
    saveData();
    loadAttendance();
}

// Task Management
function addTask() {
    const employeeId = parseInt(document.getElementById('taskEmployee').value);
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    
    if (!employeeId || !title || !description || !deadline) {
        alert('Please fill in all fields');
        return;
    }
    
    const newTask = {
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        employeeId,
        title,
        description,
        deadline,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        completedAt: null,
        approvedAt: null
    };
    
    tasks.push(newTask);
    saveData();
    updateTasksTable();
    
    // Clear inputs
    document.getElementById('taskEmployee').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDeadline').value = '';
}

function markTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'Waiting Approval';
        task.completedAt = new Date().toISOString();
        saveData();
        updateTasksTable();
        updateTaskApprovals();
    }
}

function approveTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'Completed';
        task.approvedAt = new Date().toISOString();
        saveData();
        updateTasksTable();
        updateTaskApprovals();
    }
}

function rejectTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'In Progress';
        task.completedAt = null;
        saveData();
        updateTasksTable();
        updateTaskApprovals();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveData();
        updateTasksTable();
        updateTaskApprovals();
    }
}

function updateTasksTable() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    
    tasks.forEach(task => {
        const employee = employees.find(e => e.id === task.employeeId);
        const employeeName = employee ? employee.name : 'Unknown';
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${task.id}</td>
            <td>${employeeName}</td>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${new Date(task.deadline).toLocaleDateString()}</td>
            <td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span></td>
            <td>
                ${task.status === 'In Progress' && currentUserRole === 'employee' ? 
                    `<button class="btn btn-complete" onclick="markTaskComplete(${task.id})">Mark Complete</button>` : 
                    ''}
                ${task.status === 'Completed' ? 
                    `<span class="btn btn-tick">✓ Approved</span>` : 
                    ''}
                ${currentUserRole === 'hr' ? 
                    `<button class="btn btn-delete" onclick="deleteTask(${task.id})">Delete</button>` : 
                    ''}
            </td>
        `;
    });
}

function updateTaskApprovals() {
    const tbody = document.getElementById('taskApprovalsBody');
    tbody.innerHTML = '';
    
    const pendingTasks = tasks.filter(t => t.status === 'Waiting Approval');
    
    if (pendingTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No pending approvals</td></tr>';
        return;
    }
    
    pendingTasks.forEach(task => {
        const employee = employees.find(e => e.id === task.employeeId);
        const employeeName = employee ? employee.name : 'Unknown';
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${task.id}</td>
            <td>${employeeName}</td>
            <td>${task.title}</td>
            <td>${task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}</td>
            <td>
                <button class="btn btn-approve" onclick="approveTask(${task.id})">Approve</button>
                <button class="btn btn-reject" onclick="rejectTask(${task.id})">Reject</button>
            </td>
        `;
    });
}

// Leave Request Management
function requestLeave() {
    const employeeId = parseInt(document.getElementById('leaveEmployee').value);
    const startDate = document.getElementById('leaveStartDate').value;
    const endDate = document.getElementById('leaveEndDate').value;
    const type = document.getElementById('leaveType').value;
    const reason = document.getElementById('leaveReason').value.trim();
    
    if (!employeeId || !startDate || !endDate || !reason) {
        alert('Please fill in all fields');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('End date must be after start date');
        return;
    }
    
    const newLeaveRequest = {
        id: leaveRequests.length > 0 ? Math.max(...leaveRequests.map(l => l.id)) + 1 : 1,
        employeeId,
        startDate,
        endDate,
        type,
        reason,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
        reviewedAt: null
    };
    
    leaveRequests.push(newLeaveRequest);
    saveData();
    updateLeaveTable();
    
    // Clear inputs
    document.getElementById('leaveEmployee').value = '';
    document.getElementById('leaveStartDate').value = '';
    document.getElementById('leaveEndDate').value = '';
    document.getElementById('leaveType').value = 'sick';
    document.getElementById('leaveReason').value = '';
}

function approveLeave(leaveId) {
    const leave = leaveRequests.find(l => l.id === leaveId);
    if (leave) {
        leave.status = 'Approved';
        leave.reviewedAt = new Date().toISOString();
        saveData();
        updateLeaveTable();
    }
}

function rejectLeave(leaveId) {
    const leave = leaveRequests.find(l => l.id === leaveId);
    if (leave) {
        leave.status = 'Rejected';
        leave.reviewedAt = new Date().toISOString();
        saveData();
        updateLeaveTable();
    }
}

function deleteLeave(leaveId) {
    if (confirm('Are you sure you want to delete this leave request?')) {
        leaveRequests = leaveRequests.filter(l => l.id !== leaveId);
        saveData();
        updateLeaveTable();
    }
}

function updateLeaveTable() {
    const tbody = document.getElementById('leaveTableBody');
    tbody.innerHTML = '';
    
    if (leaveRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">No leave requests</td></tr>';
        return;
    }
    
    leaveRequests.forEach(leave => {
        const employee = employees.find(e => e.id === leave.employeeId);
        const employeeName = employee ? employee.name : 'Unknown';
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${leave.id}</td>
            <td>${employeeName}</td>
            <td>${new Date(leave.startDate).toLocaleDateString()}</td>
            <td>${new Date(leave.endDate).toLocaleDateString()}</td>
            <td>${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}</td>
            <td>${leave.reason}</td>
            <td><span class="status-badge status-${leave.status.toLowerCase()}">${leave.status}</span></td>
            <td class="hr-only">
                ${currentUserRole === 'hr' && leave.status === 'Pending' ? `
                    <button class="btn btn-approve" onclick="approveLeave(${leave.id})">Approve</button>
                    <button class="btn btn-reject" onclick="rejectLeave(${leave.id})">Reject</button>
                ` : ''}
                ${currentUserRole === 'hr' ? 
                    `<button class="btn btn-delete" onclick="deleteLeave(${leave.id})">Delete</button>` : 
                    '-'}
            </td>
        `;
    });
}

// Initialize on page load
window.onload = init;
