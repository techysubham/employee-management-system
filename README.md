# Employee Management System

A full-stack Employee Management System built with Node.js, Express, and React.

## Features

- **Employee Management**: Add, view, and delete employees
- **Attendance Tracking**: Mark daily attendance for employees (Present/Absent)
- **Task Management**: 
  - Employees can add and mark tasks as complete
  - Tasks require HR approval after completion
  - Approved tasks show a checkmark
- **Leave Requests**:
  - Employees can submit leave requests
  - HR can approve or reject leave requests
  - Different leave types (Sick, Casual, Vacation, Other)
- **Role Switching**: Toggle between HR and Employee dashboards

## Project Structure

```
Task manager/
├── backend/
│   ├── routes/
│   │   ├── employees.js
│   │   ├── attendance.js
│   │   ├── tasks.js
│   │   └── leave.js
│   ├── server.js
│   ├── package.json
│   └── data.json (auto-generated)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Employees.js
│   │   │   ├── Attendance.js
│   │   │   ├── Tasks.js
│   │   │   └── LeaveRequests.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance?date=YYYY-MM-DD` - Get attendance for specific date
- `GET /api/attendance/employee/:id` - Get attendance by employee ID
- `POST /api/attendance` - Mark attendance
- `DELETE /api/attendance/:id` - Delete attendance record

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `GET /api/tasks/employee/:id` - Get tasks by employee ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task (complete, approve, reject)
- `DELETE /api/tasks/:id` - Delete task

### Leave Requests
- `GET /api/leave` - Get all leave requests
- `GET /api/leave/:id` - Get leave request by ID
- `GET /api/leave/employee/:id` - Get leave requests by employee ID
- `POST /api/leave` - Create new leave request
- `PUT /api/leave/:id` - Update leave request (approve, reject)
- `DELETE /api/leave/:id` - Delete leave request

## Usage

1. **Start both servers** (backend on port 5000, frontend on port 3000)

2. **Switch Roles**: Click the "Switch Role" button to toggle between HR and Employee views

3. **HR Dashboard**:
   - Add/delete employees
   - Mark daily attendance
   - Approve/reject completed tasks
   - Approve/reject leave requests

4. **Employee Dashboard**:
   - Add new tasks
   - Mark tasks as complete (sends for HR approval)
   - Submit leave requests
   - View attendance records

## Data Storage

The application uses file-based storage (`data.json`) to persist data. This file is automatically created when the backend server starts.

## Deployment to Vercel

This application is ready to be deployed to Vercel with zero additional configuration needed.

### Quick Deploy

1. Push your code to a GitHub repository
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect the configuration from `vercel.json`
4. Click "Deploy"

### What's Configured

The repository includes a `vercel.json` file that:
- Configures the React frontend as a static build
- Sets up the Express backend as serverless functions
- Routes `/api/*` requests to the backend
- Handles SPA routing for the frontend
- Sets appropriate build environment variables

### Important Notes

- The backend API will run as serverless functions on Vercel
- File-based storage (`data.json`) will reset on each deployment in serverless environment
- For production use, consider migrating to a persistent database (MongoDB, PostgreSQL, etc.)
- Environment variables (like email service keys) should be configured in Vercel's dashboard

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **HTTP Client**: Axios
- **Styling**: Custom CSS with gradient themes
- **Deployment**: Vercel-ready with serverless functions

## License

ISC
