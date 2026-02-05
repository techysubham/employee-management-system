const express = require('express');
const router = express.Router();
const { sendIssueNotification } = require('../services/emailService');

// GET all issues
router.get('/', (req, res) => {
  const data = req.app.locals.data;
  if (!data.issues) {
    data.issues = [];
  }
  res.json(data.issues);
});

// GET issues by employee ID
router.get('/employee/:id', (req, res) => {
  const data = req.app.locals.data;
  if (!data.issues) {
    data.issues = [];
  }
  const issues = data.issues.filter(i => i.employeeId === parseInt(req.params.id));
  res.json(issues);
});

// GET issues by department
router.get('/department/:dept', (req, res) => {
  const data = req.app.locals.data;
  if (!data.issues) {
    data.issues = [];
  }
  const department = req.params.dept.toLowerCase();
  
  let issues = [];
  
  if (department === 'hr') {
    // HR dashboard shows all issues
    issues = data.issues;
  } else {
    // Other departments only see their assigned issues
    issues = data.issues.filter(i => 
      (i.assignedTo && i.assignedTo.toLowerCase() === department) ||
      (i.department && i.department.toLowerCase() === department)
    );
  }
  
  res.json(issues);
});

// POST create new issue
router.post('/', async (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  if (!data.issues) {
    data.issues = [];
  }
  
  const { employeeId, title, description, priority, assignedTo, department } = req.body;
  
  if (!employeeId || !title || !description || !assignedTo) {
    return res.status(400).json({ message: 'Employee ID, title, description and assigned department are required' });
  }
  
  const newIssue = {
    id: data.issues.length > 0 ? Math.max(...data.issues.map(i => i.id)) + 1 : 1,
    employeeId: parseInt(employeeId),
    title,
    description,
    priority: priority || 'medium',
    status: 'Open',
    assignedTo, // Department assignment (hr, operations, listing, resource-manager, product-research)
    department: department || assignedTo, // For backward compatibility
    createdAt: new Date().toISOString(),
    assignedAt: new Date().toISOString()
  };
  
  data.issues.push(newIssue);
  saveData();
  
  // Send email notification
  try {
    // Get employee information for the notification
    const employee = data.employees ? data.employees.find(emp => emp.id === parseInt(employeeId)) : null;
    const employeeData = employee ? {
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department: employee.department
    } : { name: 'Unknown Employee' };
    
    console.log('📧 Sending issue notification email...');
    const emailResult = await sendIssueNotification(newIssue, employeeData);
    
    if (emailResult.success) {
      console.log('✅ Issue notification sent successfully to:', emailResult.recipients?.join(', '));
      // Add email status to response (optional)
      newIssue.emailNotificationSent = true;
      newIssue.emailSentTo = emailResult.recipients;
    } else {
      console.log('❌ Failed to send issue notification:', emailResult.message);
      newIssue.emailNotificationSent = false;
      newIssue.emailError = emailResult.message;
    }
    
  } catch (error) {
    console.error('❌ Email notification error:', error.message);
    newIssue.emailNotificationSent = false;
    newIssue.emailError = error.message;
  }
  
  // Save updated issue with email status
  saveData();
  
  res.status(201).json(newIssue);
});

// PUT update issue status
router.put('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  if (!data.issues) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  
  const issueIndex = data.issues.findIndex(i => i.id === parseInt(req.params.id));
  
  if (issueIndex === -1) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  
  const { status, assignedTo, department, priority, resolvedBy, resolution } = req.body;
  
  if (status) {
    data.issues[issueIndex].status = status;
    if (status === 'Resolved' || status === 'Closed') {
      data.issues[issueIndex].resolvedAt = new Date().toISOString();
      if (resolvedBy) data.issues[issueIndex].resolvedBy = resolvedBy;
      if (resolution) data.issues[issueIndex].resolution = resolution;
    }
  }
  
  if (assignedTo) {
    data.issues[issueIndex].assignedTo = assignedTo;
    data.issues[issueIndex].department = department || assignedTo;
    data.issues[issueIndex].reassignedAt = new Date().toISOString();
  }
  
  if (priority) {
    data.issues[issueIndex].priority = priority;
  }
  
  saveData();
  res.json(data.issues[issueIndex]);
});

// DELETE issue
router.delete('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  if (!data.issues) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  
  const issueIndex = data.issues.findIndex(i => i.id === parseInt(req.params.id));
  
  if (issueIndex === -1) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  
  data.issues.splice(issueIndex, 1);
  saveData();
  
  res.json({ message: 'Issue deleted successfully' });
});

module.exports = router;
