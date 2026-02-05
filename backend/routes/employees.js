const express = require('express');
const router = express.Router();

// GET all employees
router.get('/', (req, res) => {
  const data = req.app.locals.data;
  res.json(data.employees);
});

// GET employee by ID
router.get('/:id', (req, res) => {
  const data = req.app.locals.data;
  const employee = data.employees.find(e => e.id === parseInt(req.params.id));
  
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  
  res.json(employee);
});

// POST create new employee
router.post('/', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const { name, email, position, department, role, customRole, customDepartment } = req.body;
  
  if (!name || !email || !position || !department) {
    return res.status(400).json({ message: 'Name, email, position, and department are required' });
  }
  
  const newEmployee = {
    id: data.employees.length > 0 ? Math.max(...data.employees.map(e => e.id)) + 1 : 1,
    name,
    email,
    position,
    department: department || 'operations',
    role: role || 'employee',
    customRole: customRole || false,
    customDepartment: customDepartment || false,
    leaveBalance: 2,
    lastBalanceReset: new Date().toISOString()
  };
  
  data.employees.push(newEmployee);
  saveData();
  
  res.status(201).json(newEmployee);
});

// PUT update employee
router.put('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const employeeIndex = data.employees.findIndex(e => e.id === parseInt(req.params.id));
  
  if (employeeIndex === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  
  const { name, email, position, department, role, customRole, customDepartment } = req.body;
  
  data.employees[employeeIndex] = {
    ...data.employees[employeeIndex],
    name: name || data.employees[employeeIndex].name,
    email: email || data.employees[employeeIndex].email,
    position: position || data.employees[employeeIndex].position,
    department: department || data.employees[employeeIndex].department,
    role: role || data.employees[employeeIndex].role,
    customRole: customRole !== undefined ? customRole : data.employees[employeeIndex].customRole,
    customDepartment: customDepartment !== undefined ? customDepartment : data.employees[employeeIndex].customDepartment
  };
  
  saveData();
  res.json(data.employees[employeeIndex]);
});

// DELETE employee
router.delete('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  const employeeIndex = data.employees.findIndex(e => e.id === parseInt(req.params.id));
  
  if (employeeIndex === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  
  data.employees.splice(employeeIndex, 1);
  saveData();
  
  res.json({ message: 'Employee deleted successfully' });
});

module.exports = router;
