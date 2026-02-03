const express = require('express');
const router = express.Router();

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

// POST create new issue
router.post('/', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  if (!data.issues) {
    data.issues = [];
  }
  
  const { employeeId, title, description, priority } = req.body;
  
  if (!employeeId || !title || !description) {
    return res.status(400).json({ message: 'Employee ID, title and description are required' });
  }
  
  const newIssue = {
    id: data.issues.length > 0 ? Math.max(...data.issues.map(i => i.id)) + 1 : 1,
    employeeId: parseInt(employeeId),
    title,
    description,
    priority: priority || 'medium',
    status: 'Open',
    createdAt: new Date().toISOString()
  };
  
  data.issues.push(newIssue);
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
  
  const { status } = req.body;
  
  if (status) {
    data.issues[issueIndex].status = status;
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
