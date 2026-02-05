const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// GET all leave requests
router.get('/', (req, res) => {
  const data = req.app.locals.data;
  const { status } = req.query;
  
  if (status) {
    const filteredLeave = data.leaveRequests.filter(l => l.status === status);
    return res.json(filteredLeave);
  }
  
  res.json(data.leaveRequests);
});

// GET leave request by ID
router.get('/:id', (req, res) => {
  const data = req.app.locals.data;
  const leave = data.leaveRequests.find(l => l.id === parseInt(req.params.id));
  
  if (!leave) {
    return res.status(404).json({ message: 'Leave request not found' });
  }
  
  res.json(leave);
});

// GET leave requests by employee ID
router.get('/employee/:id', (req, res) => {
  const data = req.app.locals.data;
  const leaves = data.leaveRequests.filter(l => l.employeeId === parseInt(req.params.id));
  res.json(leaves);
});

// POST create new leave request
router.post('/', async (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const { employeeId, startDate, endDate, type, reason } = req.body;
  
  if (!employeeId || !startDate || !endDate || !type || !reason) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }
  
  const newLeaveRequest = {
    id: data.leaveRequests.length > 0 ? Math.max(...data.leaveRequests.map(l => l.id)) + 1 : 1,
    employeeId: parseInt(employeeId),
    startDate,
    endDate,
    type,
    reason,
    status: 'Pending',
    requestedAt: new Date().toISOString(),
    reviewedAt: null
  };
  
  data.leaveRequests.push(newLeaveRequest);
  saveData();
  
  // Send email notification
  try {
    const employee = data.employees.find(emp => emp.id === parseInt(employeeId));
    await emailService.sendLeaveRequestNotification(newLeaveRequest, employee || { name: 'Unknown Employee', email: '' }, 'create');
    console.log('📧 ✓ Leave request email notification sent');
  } catch (emailError) {
    console.error('📧 ✗ Failed to send leave request email:', emailError.message);
  }
  
  res.status(201).json(newLeaveRequest);
});

// PUT update leave request (approve or reject)
router.put('/:id', async (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const leaveIndex = data.leaveRequests.findIndex(l => l.id === parseInt(req.params.id));
  
  if (leaveIndex === -1) {
    return res.status(404).json({ message: 'Leave request not found' });
  }
  
  const { status } = req.body;
  const leaveRequest = data.leaveRequests[leaveIndex];
  
  if (status && ['Approved', 'Rejected'].includes(status)) {
    // If approving leave, check and update employee balance
    if (status === 'Approved') {
      const employee = data.employees.find(e => e.id === leaveRequest.employeeId);
      if (employee) {
        // Reset balance if new month
        const lastReset = new Date(employee.lastBalanceReset || new Date());
        const now = new Date();
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          employee.leaveBalance = 2;
          employee.lastBalanceReset = now.toISOString();
        }
        
        // Calculate leave days
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);
        const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Check if employee has enough balance
        if ((employee.leaveBalance || 0) < leaveDays) {
          return res.status(400).json({ message: 'Insufficient leave balance' });
        }
        
        // Deduct from balance
        employee.leaveBalance = (employee.leaveBalance || 2) - leaveDays;
      }
    }
    
    data.leaveRequests[leaveIndex].status = status;
    data.leaveRequests[leaveIndex].reviewedAt = new Date().toISOString();
    
    // Send email notification for status update
    try {
      const employee = data.employees.find(emp => emp.id === leaveRequest.employeeId);
      const action = status === 'Approved' ? 'approve' : 'reject';
      await emailService.sendLeaveRequestNotification(data.leaveRequests[leaveIndex], employee || { name: 'Unknown Employee', email: '' }, action);
      console.log(`📧 ✓ Leave request ${action} email notification sent`);
    } catch (emailError) {
      console.error(`📧 ✗ Failed to send leave request ${action} email:`, emailError.message);
    }
  }
  
  saveData();
  res.json(data.leaveRequests[leaveIndex]);
});

// DELETE leave request
router.delete('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const leaveIndex = data.leaveRequests.findIndex(l => l.id === parseInt(req.params.id));
  
  if (leaveIndex === -1) {
    return res.status(404).json({ message: 'Leave request not found' });
  }
  
  data.leaveRequests.splice(leaveIndex, 1);
  saveData();
  
  res.json({ message: 'Leave request deleted successfully' });
});

module.exports = router;
