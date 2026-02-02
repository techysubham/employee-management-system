const express = require('express');
const router = express.Router();

// GET attendance records (optionally filter by date)
router.get('/', (req, res) => {
  const data = req.app.locals.data;
  const { date } = req.query;
  
  if (date) {
    const records = data.attendance.filter(a => a.date === date);
    return res.json(records);
  }
  
  res.json(data.attendance);
});

// GET attendance by employee ID
router.get('/employee/:id', (req, res) => {
  const data = req.app.locals.data;
  const records = data.attendance.filter(a => a.employeeId === parseInt(req.params.id));
  res.json(records);
});

// POST mark attendance
router.post('/', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const { employeeId, date, status } = req.body;
  
  if (!employeeId || !date || !status) {
    return res.status(400).json({ message: 'Employee ID, date, and status are required' });
  }
  
  // Remove existing record for this employee and date
  data.attendance = data.attendance.filter(
    a => !(a.employeeId === employeeId && a.date === date)
  );
  
  const newRecord = {
    id: data.attendance.length > 0 ? Math.max(...data.attendance.map(a => a.id || 0)) + 1 : 1,
    employeeId: parseInt(employeeId),
    date,
    status,
    markedAt: new Date().toISOString()
  };
  
  data.attendance.push(newRecord);
  saveData();
  
  res.status(201).json(newRecord);
});

// DELETE attendance record
router.delete('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const recordIndex = data.attendance.findIndex(a => a.id === parseInt(req.params.id));
  
  if (recordIndex === -1) {
    return res.status(404).json({ message: 'Attendance record not found' });
  }
  
  data.attendance.splice(recordIndex, 1);
  saveData();
  
  res.json({ message: 'Attendance record deleted successfully' });
});

module.exports = router;
