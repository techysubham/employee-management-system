# Email Notification Setup Guide

## 📧 Email Configuration Instructions

### Step 1: Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Navigate to: Security → 2-Step Verification → App passwords
4. Select "Mail" and your device
5. Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update .env Configuration

Edit the `.env` file in the backend folder:

```env
# Email Configuration for Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com           # Replace with your Gmail
EMAIL_PASS=your-16-char-app-password      # Replace with app password (no spaces)

# Notification Recipients
HR_EMAIL=hr@company.com                   # Replace with actual HR email
DEPARTMENT_HEAD_EMAIL=dept-head@company.com # Replace with department head email

# App Configuration
PORT=5000
```

### Step 3: Test Email Configuration

1. Start the backend server: `npm start`
2. Test the email service: Visit `http://localhost:5000/api/test-email`
3. Check if test email is received

### Step 4: Department Email Mapping (Optional)

You can customize department-specific emails by editing `backend/services/emailService.js`:

```javascript
const departmentSpecificEmails = {
  'hr': ['hr@company.com'],
  'operations': ['operations-head@company.com', 'ops-manager@company.com'],
  'listing': ['listing-head@company.com'],
  'resource-manager': ['resource-manager@company.com'],
  'product-research': ['research-head@company.com']
};
```

## 🚨 How Issue Notifications Work

### When an Issue is Reported:
1. **Automatic Email Trigger**: New issue creates instant email notification
2. **Recipients**: HR + Department Head + Department-specific emails
3. **Email Content**: 
   - Issue title and description
   - Priority level (High/Medium/Low)
   - Reporter information
   - Department assignment
   - Timestamp

### Email Template Features:
- 🎨 Professional HTML design
- 📱 Mobile-responsive layout
- 🏷️ Priority color coding
- 📋 Department badges
- ⚡ Action required highlighting

## 🔧 Troubleshooting

### Common Issues:
1. **"Email service disabled"**: Check EMAIL_USER and EMAIL_PASS in .env
2. **"Authentication failed"**: Verify app password (not regular password)
3. **"No recipients configured"**: Set HR_EMAIL and DEPARTMENT_HEAD_EMAIL
4. **Gmail blocks email**: Enable "Less secure app access" or use App Passwords

### Testing Steps:
1. Check server console for email initialization messages
2. Use test endpoint: `GET /api/test-email`
3. Create a test issue and verify email delivery
4. Check spam/junk folders if emails not received

## 📊 Email Analytics

The system tracks email delivery status:
- `emailNotificationSent`: true/false
- `emailSentTo`: array of recipient emails
- `emailError`: error message if failed

## 🔒 Security Notes

- Never commit real credentials to Git
- Use environment variables for all sensitive data
- App passwords are safer than regular passwords
- Consider using dedicated service emails