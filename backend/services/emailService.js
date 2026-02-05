const { Resend } = require('resend');
require('dotenv').config();

class EmailService {
    constructor() {
        this.resend = null;
        this.isEnabled = false;
        this.initEmailService();
    }

    initEmailService() {
        try {
            console.log('📧 Initializing email service...');
            
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey || apiKey === 'your_resend_api_key_here') {
                console.log('⚠️ Resend API key not configured. Email notifications disabled.');
                console.log('📧 Get your free API key at: https://resend.com/');
                this.isEnabled = false;
                return false;
            }

            this.resend = new Resend(apiKey);
            this.isEnabled = true;
            
            console.log('📧 Email service initialized successfully');
            console.log('📧 Using: Resend API');
            console.log('✅ Email notifications are enabled');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
            this.isEnabled = false;
            return false;
        }
    }

    getDepartmentEmails(department) {
        const emails = [];
        
        // Always include HR
        const hrEmail = process.env.HR_EMAIL;
        if (hrEmail) emails.push(...hrEmail.split(','));
        
        // Add department head
        const deptHeadEmail = process.env.DEPARTMENT_HEAD_EMAIL;
        if (deptHeadEmail) emails.push(...deptHeadEmail.split(','));
        
        // Remove duplicates and filter valid emails
        return [...new Set(emails)].filter(email => email && email.trim().includes('@')).map(email => email.trim());
    }

    async sendIssueNotification(issueData, employeeData = {}) {
        if (!this.isEnabled) {
            console.log('📧 Email service disabled, skipping notification');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            console.log('📧 Sending issue notification email...');
            
            const { title, description, priority, assignedTo, department, createdAt } = issueData;
            const { name: employeeName, email: employeeEmail } = employeeData;
            
            const recipients = this.getDepartmentEmails(assignedTo || department);
            
            if (recipients.length === 0) {
                console.log('📧 No email recipients configured');
                return { success: false, message: 'No recipients configured' };
            }

            // Priority color mapping
            const priorityColors = {
                low: '#28a745',
                medium: '#ffc107', 
                high: '#fd7e14',
                urgent: '#dc3545'
            };

            // Department icon mapping
            const departmentIcons = {
                'IT': '💻',
                'HR': '👥', 
                'Finance': '💰',
                'Operations': '⚙️',
                'Marketing': '📊',
                'Development': '🔧',
                'Design': '🎨',
                'Sales': '📈'
            };

            const priorityColor = priorityColors[priority] || '#6c757d';
            const deptIcon = departmentIcons[department] || '🏢';
            
            const emailContent = {
                from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
                to: recipients,
                subject: `🚨 New ${priority?.toUpperCase()} Issue Reported - ${title}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Issue Notification</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🚨 New Issue Report</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Employee Management System</p>
                            </div>

                            <!-- Priority Badge -->
                            <div style="padding: 20px 30px 10px; text-align: center;">
                                <span style="background-color: ${priorityColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                                    ${priority} PRIORITY
                                </span>
                            </div>

                            <!-- Content -->
                            <div style="padding: 20px 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">${title}</h2>
                                
                                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priorityColor};">
                                    <p style="color: #4a5568; margin: 0; line-height: 1.6; font-size: 14px;">${description}</p>
                                </div>

                                <!-- Details Grid -->
                                <div style="display: table; width: 100%; border-collapse: collapse; margin: 25px 0;">
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057; width: 140px;">
                                            👤 Reported By
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${employeeName || 'Unknown Employee'}
                                        </div>
                                    </div>
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057;">
                                            ${deptIcon} Department
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${assignedTo || department || 'Unknown'}
                                        </div>
                                    </div>
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057;">
                                            📅 Created
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${new Date(createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Button -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="http://192.168.1.6:3000" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; transition: all 0.3s ease;">
                                        View in Dashboard
                                    </a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; text-align: center;">
                                <p style="color: #6c757d; margin: 0; font-size: 12px;">
                                    This is an automated notification from the Employee Management System<br>
                                    Please do not reply to this email.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const result = await this.resend.emails.send(emailContent);
            console.log('✅ Issue notification sent successfully:', result.id);
            console.log('📧 Recipients:', recipients.join(', '));
            
            return { 
                success: true, 
                messageId: result.id,
                recipients: recipients,
                message: 'Email notification sent via Resend API successfully'
            };
            
        } catch (error) {
            console.error('❌ Failed to send issue notification:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendTestEmail() {
        if (!this.isEnabled) {
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const testEmail = process.env.HR_EMAIL?.split(',')[0]?.trim() || 'test@example.com';
            
            const result = await this.resend.emails.send({
                from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
                to: [testEmail],
                subject: '✅ Email Service Test - Resend Integration Working',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #28a745;">✅ Email Service Working!</h2>
                        <p>This is a test email from your Employee Management System.</p>
                        <p><strong>Service:</strong> Resend API</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <p style="color: #28a745; font-weight: bold;">🎉 Your email notifications are working perfectly!</p>
                        <hr style="margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            Get your free Resend API key at: https://resend.com/<br>
                            3,000 emails/month free tier
                        </p>
                    </div>
                `
            });

            return { success: true, messageId: result.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendAnnouncementNotification(announcementData, targetEmployee = null) {
        if (!this.isEnabled) {
            console.log('📧 Email service disabled, skipping notification');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            console.log('📧 Sending announcement notification email...');
            
            const { title, message, type, createdAt } = announcementData;
            
            let recipients;
            if (type === 'individual' && targetEmployee) {
                recipients = [targetEmployee.email].filter(Boolean);
            } else {
                recipients = this.getDepartmentEmails('all');
            }
            
            if (recipients.length === 0) {
                console.log('📧 No email recipients configured');
                return { success: false, message: 'No recipients configured' };
            }

            const typeColors = {
                company: '#007bff',
                individual: '#28a745',
                urgent: '#dc3545'
            };

            const typeIcons = {
                company: '📢',
                individual: '👤',
                urgent: '🚨'
            };

            const typeColor = typeColors[type] || '#007bff';
            const typeIcon = typeIcons[type] || '📢';
            
            const emailContent = {
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: recipients,
                subject: `${typeIcon} New Announcement - ${title}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Announcement Notification</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, ${typeColor} 0%, ${typeColor}bb 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${typeIcon} New Announcement</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Employee Management System</p>
                            </div>

                            <!-- Type Badge -->
                            <div style="padding: 20px 30px 10px; text-align: center;">
                                <span style="background-color: ${typeColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                                    ${type} ANNOUNCEMENT
                                </span>
                            </div>

                            <!-- Content -->
                            <div style="padding: 20px 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">${title}</h2>
                                
                                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${typeColor};">
                                    <p style="color: #4a5568; margin: 0; line-height: 1.6; font-size: 14px;">${message}</p>
                                </div>

                                <!-- Details -->
                                <div style="display: table; width: 100%; border-collapse: collapse; margin: 25px 0;">
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057; width: 140px;">
                                            📅 Date
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${new Date(createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    ${targetEmployee ? `
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057;">
                                            👤 For
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${targetEmployee.name}
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>

                                <!-- Action Button -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="http://192.168.1.6:3000" style="background: linear-gradient(135deg, ${typeColor} 0%, ${typeColor}bb 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                                        View Dashboard
                                    </a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; text-align: center;">
                                <p style="color: #6c757d; margin: 0; font-size: 12px;">
                                    This is an automated notification from the Employee Management System<br>
                                    Please do not reply to this email.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const result = await this.resend.emails.send(emailContent);
            console.log('✅ Announcement notification sent successfully:', result.id);
            console.log('📧 Recipients:', recipients.join(', '));
            
            return { 
                success: true, 
                messageId: result.id,
                recipients: recipients,
                message: 'Announcement notification sent successfully'
            };
            
        } catch (error) {
            console.error('❌ Failed to send announcement notification:', error.message);
            return { success: false, error: error.message };
        }
    }

    async sendLeaveRequestNotification(leaveData, employeeData, action = 'create') {
        if (!this.isEnabled) {
            console.log('📧 Email service disabled, skipping notification');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            console.log(`📧 Sending leave request ${action} notification email...`);
            
            const { startDate, endDate, type, reason, status, createdAt } = leaveData;
            const { name: employeeName, email: employeeEmail } = employeeData;
            
            const recipients = this.getDepartmentEmails('HR');
            
            if (recipients.length === 0) {
                console.log('📧 No email recipients configured');
                return { success: false, message: 'No recipients configured' };
            }

            const actionColors = {
                create: '#17a2b8',
                approve: '#28a745',
                reject: '#dc3545'
            };

            const actionIcons = {
                create: '📝',
                approve: '✅',
                reject: '❌'
            };

            const statusColors = {
                pending: '#ffc107',
                approved: '#28a745',
                rejected: '#dc3545'
            };

            const actionColor = actionColors[action] || '#17a2b8';
            const actionIcon = actionIcons[action] || '📝';
            const statusColor = statusColors[status] || '#ffc107';
            
            const emailContent = {
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: recipients,
                subject: `${actionIcon} Leave Request ${action.charAt(0).toUpperCase() + action.slice(1)} - ${employeeName}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Leave Request Notification</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, ${actionColor} 0%, ${actionColor}bb 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${actionIcon} Leave Request ${action.charAt(0).toUpperCase() + action.slice(1)}</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Employee Management System</p>
                            </div>

                            <!-- Status Badge -->
                            <div style="padding: 20px 30px 10px; text-align: center;">
                                <span style="background-color: ${statusColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                                    ${status || 'PENDING'}
                                </span>
                            </div>

                            <!-- Content -->
                            <div style="padding: 20px 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Leave Request Details</h2>
                                
                                <!-- Details Grid -->
                                <div style="display: table; width: 100%; border-collapse: collapse; margin: 25px 0;">
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057; width: 140px;">
                                            👤 Employee
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${employeeName}
                                        </div>
                                    </div>
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057;">
                                            📅 Start Date
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${new Date(startDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057;">
                                            📅 End Date
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${new Date(endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; font-weight: 600; color: #495057;">
                                            🏷️ Type
                                        </div>
                                        <div style="display: table-cell; padding: 12px; background: white; border: 1px solid #e9ecef; color: #6c757d;">
                                            ${type}
                                        </div>
                                    </div>
                                </div>

                                <!-- Reason -->
                                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${actionColor};">
                                    <h4 style="margin: 0 0 10px 0; color: #2d3748;">Reason:</h4>
                                    <p style="color: #4a5568; margin: 0; line-height: 1.6; font-size: 14px;">${reason}</p>
                                </div>

                                <!-- Action Button -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="http://192.168.1.6:3000" style="background: linear-gradient(135deg, ${actionColor} 0%, ${actionColor}bb 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                                        Review Request
                                    </a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; text-align: center;">
                                <p style="color: #6c757d; margin: 0; font-size: 12px;">
                                    This is an automated notification from the Employee Management System<br>
                                    Please do not reply to this email.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const result = await this.resend.emails.send(emailContent);
            console.log(`✅ Leave request ${action} notification sent successfully:`, result.id);
            console.log('📧 Recipients:', recipients.join(', '));
            
            return { 
                success: true, 
                messageId: result.id,
                recipients: recipients,
                message: `Leave request ${action} notification sent successfully`
            };
            
        } catch (error) {
            console.error(`❌ Failed to send leave request ${action} notification:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

// Create and export a single instance
const emailService = new EmailService();

module.exports = {
    initEmailService: () => emailService.initEmailService(),
    sendIssueNotification: (issueData, employeeData) => emailService.sendIssueNotification(issueData, employeeData),
    sendAnnouncementNotification: (announcementData, targetEmployee) => emailService.sendAnnouncementNotification(announcementData, targetEmployee),
    sendLeaveRequestNotification: (leaveData, employeeData, action) => emailService.sendLeaveRequestNotification(leaveData, employeeData, action),
    sendTestEmail: () => emailService.sendTestEmail(),
    getDepartmentEmails: (department) => emailService.getDepartmentEmails(department)
};