const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure nodemailer with your email service (e.g., Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

exports.sendTransferRequestEmail = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    try {
      // Get user email from auth
      const userRecord = await admin.auth().getUser(notification.toUserId);
      const fromUserRecord = await admin.auth().getUser(notification.fromUserId);
      
      const emailTemplate = {
        from: '"Transfer System" <noreply@yourdomain.com>',
        to: userRecord.email,
        subject: `New Transfer Request from ${notification.fromUserName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Transfer Request</h2>
            <p>You have received a new transfer request from ${notification.fromUserName}.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #475569; margin-top: 0;">Request Details:</h3>
              <p><strong>From:</strong> ${notification.fromCurrentLocation}</p>
              <p><strong>To:</strong> ${notification.fromWantedLocation}</p>
              <p><strong>Department:</strong> ${notification.fromDepartment}</p>
            </div>
            
            <p>Please log in to the transfer portal to review and respond to this request.</p>
            
            <a href="http://your-app-url.com/dashboard" 
               style="display: inline-block; background: #2563eb; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                      margin-top: 20px;">
              View Request
            </a>
          </div>
        `
      };
      
      await transporter.sendMail(emailTemplate);
      
      // Update notification with email sent status
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
    }
  });

exports.sendTransferCompletedEmail = functions.firestore
  .document('notifications/{notificationId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    
    if (newData.status === 'completed' && previousData.status !== 'completed') {
      try {
        const userRecord = await admin.auth().getUser(newData.toUserId);
        const fromUserRecord = await admin.auth().getUser(newData.fromUserId);
        
        // Send email to both users
        const emailTemplate = {
          from: '"Transfer System" <noreply@yourdomain.com>',
          to: [userRecord.email, fromUserRecord.email].join(','),
          subject: 'Transfer Request Completed',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Transfer Request Completed</h2>
              <p>Your transfer request has been completed successfully.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #475569; margin-top: 0;">Transfer Details:</h3>
                <p><strong>From:</strong> ${newData.fromCurrentLocation}</p>
                <p><strong>To:</strong> ${newData.fromWantedLocation}</p>
                <p><strong>Department:</strong> ${newData.fromDepartment}</p>
              </div>
              
              <p>Please log in to the transfer portal to view the complete details.</p>
              
              <a href="http://your-app-url.com/dashboard" 
                 style="display: inline-block; background: #059669; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        margin-top: 20px;">
                View Details
              </a>
            </div>
          `
        };
        
        await transporter.sendMail(emailTemplate);
        
        // Update notification with completion email sent status
        await change.after.ref.update({
          completionEmailSent: true,
          completionEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
      } catch (error) {
        console.error('Error sending completion email:', error);
      }
    }
  }); 