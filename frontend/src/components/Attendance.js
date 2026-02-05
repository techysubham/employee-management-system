import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

function Attendance({ employees, attendance, fetchAttendance, userRole }) {
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchAttendance(today);
  }, []);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchAttendance(date);
  };

  const markAttendance = async (employeeId, status) => {
    try {
      await axios.post(`${API_URL}/attendance`, {
        employeeId,
        date: selectedDate,
        status
      });
      fetchAttendance(selectedDate);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const getAttendanceStatus = (employeeId) => {
    const record = attendance.find(
      a => a.employeeId === employeeId && a.date === selectedDate
    );
    return record ? record.status : 'Not Marked';
  };

  return (
    <div className="attendance-section">
      <h2>Daily Attendance</h2>
      
      <div className="date-selector">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Position</th>
              <th>Status</th>
              {userRole === 'hr' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => {
              const status = getAttendanceStatus(employee.id);
              return (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.position}</td>
                  <td>
                    <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
                      {status}
                    </span>
                  </td>
                  {userRole === 'hr' && (
                    <td>
                      <button
                        className="btn btn-mark-present"
                        onClick={() => markAttendance(employee.id, 'Present')}
                      >
                        Present
                      </button>
                      <button
                        className="btn btn-mark-absent"
                        onClick={() => markAttendance(employee.id, 'Absent')}
                      >
                        Absent
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Attendance;
