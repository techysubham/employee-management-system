const express = require('express');
const router = express.Router();

// GET all tasks
router.get('/', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  const { status } = req.query;
  
  // Auto-reset recurring tasks if completed yesterday
  const today = new Date().toISOString().split('T')[0];
  let tasksUpdated = false;
  
  data.tasks.forEach(task => {
    if (task.isRecurring && task.status === 'Completed' && task.lastCompletedDate) {
      if (task.lastCompletedDate !== today) {
        // Reset task for new day
        task.status = 'In Progress';
        tasksUpdated = true;
      }
    }
  });
  
  if (tasksUpdated) {
    saveData();
  }
  
  if (status) {
    const filteredTasks = data.tasks.filter(t => t.status === status);
    return res.json(filteredTasks);
  }
  
  res.json(data.tasks);
});

// GET task by ID
router.get('/:id', (req, res) => {
  const data = req.app.locals.data;
  const task = data.tasks.find(t => t.id === parseInt(req.params.id));
  
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  res.json(task);
});

// GET tasks by employee ID
router.get('/employee/:id', (req, res) => {
  const data = req.app.locals.data;
  const tasks = data.tasks.filter(t => t.employeeId === parseInt(req.params.id));
  res.json(tasks);
});

// POST create new task
router.post('/', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const { employeeId, title, description, deadline, isRecurring } = req.body;
  
  if (!employeeId || !title || !description) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }
  
  const newTask = {
    id: data.tasks.length > 0 ? Math.max(...data.tasks.map(t => t.id)) + 1 : 1,
    employeeId: parseInt(employeeId),
    title,
    description,
    deadline: deadline || new Date().toISOString().split('T')[0],
    status: 'In Progress',
    isRecurring: isRecurring || false,
    lastCompletedDate: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    approvedAt: null
  };
  
  data.tasks.push(newTask);
  saveData();
  
  res.status(201).json(newTask);
});

// PUT update task (mark complete, approve, reject)
router.put('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const taskIndex = data.tasks.findIndex(t => t.id === parseInt(req.params.id));
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  const { status, action } = req.body;
  
  if (action === 'complete') {
    const task = data.tasks[taskIndex];
    const today = new Date().toISOString().split('T')[0];
    
    if (task.isRecurring) {
      // For recurring tasks, mark as completed for today
      task.status = 'Completed';
      task.lastCompletedDate = today;
      task.completedAt = new Date().toISOString();
    } else {
      // For non-recurring tasks, mark as permanently completed
      task.status = 'Completed';
      task.completedAt = new Date().toISOString();
    }
  } else if (status) {
    data.tasks[taskIndex].status = status;
  }
  
  saveData();
  res.json(data.tasks[taskIndex]);
});

// DELETE task
router.delete('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const taskIndex = data.tasks.findIndex(t => t.id === parseInt(req.params.id));
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  data.tasks.splice(taskIndex, 1);
  saveData();
  
  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;
