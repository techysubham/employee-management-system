const express = require('express');
const router = express.Router();

// Get all work hours
router.get('/', (req, res) => {
  const workHours = req.app.locals.data.workHours || [];
  res.json(workHours);
});

// Get work hours by employee
router.get('/employee/:employeeId', (req, res) => {
  const employeeId = parseInt(req.params.employeeId);
  const workHours = (req.app.locals.data.workHours || []).filter(w => w.employeeId === employeeId);
  res.json(workHours);
});

// Check-in
router.post('/checkin', (req, res) => {
  const { employeeId } = req.body;
  
  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  const data = req.app.locals.data;
  if (!data.workHours) {
    data.workHours = [];
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Check if already checked in today
  const existingEntry = data.workHours.find(w => 
    w.employeeId === employeeId && w.date === today && !w.checkOut
  );

  if (existingEntry) {
    return res.status(400).json({ message: 'Already checked in today' });
  }

  const newEntry = {
    id: data.workHours.length + 1,
    employeeId,
    date: today,
    checkIn: new Date().toISOString(),
    checkOut: null,
    totalHours: 0,
    overtime: 0
  };

  data.workHours.push(newEntry);
  req.app.locals.saveData();
  
  res.status(201).json(newEntry);
});

// Check-out
router.post('/checkout', (req, res) => {
  const { employeeId } = req.body;
  
  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  const data = req.app.locals.data;
  const today = new Date().toISOString().split('T')[0];
  
  const entry = data.workHours.find(w => 
    w.employeeId === employeeId && w.date === today && !w.checkOut
  );

  if (!entry) {
    return res.status(400).json({ message: 'No check-in found for today' });
  }

  entry.checkOut = new Date().toISOString();
  
  // Calculate total hours
  const checkInTime = new Date(entry.checkIn);
  const checkOutTime = new Date(entry.checkOut);
  const diffMs = checkOutTime - checkInTime;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  entry.totalHours = parseFloat(diffHours.toFixed(2));
  
  // Calculate overtime (standard work day is 8 hours)
  entry.overtime = Math.max(0, parseFloat((diffHours - 8).toFixed(2)));
  
  req.app.locals.saveData();
  
  res.json(entry);
});

// Get weekly summary for employee
router.get('/weekly/:employeeId', (req, res) => {
  const employeeId = parseInt(req.params.employeeId);
  const data = req.app.locals.data;
  
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  
  const weeklyEntries = (data.workHours || []).filter(w => {
    if (w.employeeId !== employeeId) return false;
    const entryDate = new Date(w.date);
    return entryDate >= weekAgo && entryDate <= today;
  });
  
  const totalHours = weeklyEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
  const totalOvertime = weeklyEntries.reduce((sum, entry) => sum + (entry.overtime || 0), 0);
  
  res.json({
    totalHours: parseFloat(totalHours.toFixed(2)),
    totalOvertime: parseFloat(totalOvertime.toFixed(2)),
    entries: weeklyEntries
  });
});

module.exports = router;
