const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// GET all announcements
router.get('/', (req, res) => {
  const data = req.app.locals.data;
  if (!data.announcements) {
    data.announcements = [];
  }
  res.json(data.announcements);
});

// POST create new announcement
router.post('/', async (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  if (!data.announcements) {
    data.announcements = [];
  }
  
  const { title, message, type, targetEmployeeId } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }
  
  const newAnnouncement = {
    id: data.announcements.length > 0 ? Math.max(...data.announcements.map(a => a.id)) + 1 : 1,
    title,
    message,
    type: type || 'company', // 'company' or 'individual'
    targetEmployeeId: type === 'individual' ? targetEmployeeId : null,
    createdAt: new Date().toISOString()
  };
  
  data.announcements.push(newAnnouncement);
  saveData();
  
  // Send email notification
  try {
    let targetEmployee = null;
    if (type === 'individual' && targetEmployeeId) {
      targetEmployee = data.employees.find(emp => emp.id === parseInt(targetEmployeeId));
    }
    
    await emailService.sendAnnouncementNotification(newAnnouncement, targetEmployee);
    console.log('📧 ✓ Announcement email notification sent');
  } catch (emailError) {
    console.error('📧 ✗ Failed to send announcement email:', emailError.message);
  }
  
  res.status(201).json(newAnnouncement);
});

// DELETE announcement
router.delete('/:id', (req, res) => {
  const data = req.app.locals.data;
  const saveData = req.app.locals.saveData;
  
  if (!data.announcements) {
    return res.status(404).json({ message: 'Announcement not found' });
  }
  
  const announcementIndex = data.announcements.findIndex(a => a.id === parseInt(req.params.id));
  
  if (announcementIndex === -1) {
    return res.status(404).json({ message: 'Announcement not found' });
  }
  
  data.announcements.splice(announcementIndex, 1);
  saveData();
  
  res.json({ message: 'Announcement deleted successfully' });
});

module.exports = router;
