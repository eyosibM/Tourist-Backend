require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function testEmail() {
  try {
    console.log('🧪 Testing email configuration...\n');
    console.log('Configuration:');
    console.log('  SMTP_HOST:', process.env.SMTP_HOST);
    console.log('  SMTP_PORT:', process.env.SMTP_PORT);
    console.log('  SMTP_USER:', process.env.SMTP_USER);
    console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
    console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || process.env.SMTP_USER);
    console.log('\n📧 Sending test email...\n');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.EMAIL_USER || process.env.SMTP_USER, // Send to yourself
      subject: 'Tourlicity Email Test - ' + new Date().toLocaleString(),
      text: 'If you receive this, your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #4CAF50;">✅ Email Configuration Test</h1>
            <p style="font-size: 16px; color: #333;">
              Congratulations! Your email service is working correctly.
            </p>
            <p style="font-size: 14px; color: #666;">
              This test email was sent from your Tourlicity backend at ${new Date().toLocaleString()}
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              Tourlicity Email Service Test
            </p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📨 Check your inbox:', process.env.EMAIL_USER || process.env.SMTP_USER);
    console.log('\n🎉 Email configuration is working correctly!');
  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Possible solutions:');
      console.error('   1. Use Gmail App Password instead of regular password');
      console.error('   2. Enable "Less secure app access" in Gmail settings');
      console.error('   3. Check if 2-Step Verification is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Connection failed. Check:');
      console.error('   1. SMTP_HOST and SMTP_PORT are correct');
      console.error('   2. Your internet connection');
      console.error('   3. Firewall settings');
    } else {
      console.error('\nFull error details:', error);
    }
  }
}

console.log('🚀 Tourlicity Email Configuration Test\n');
testEmail();
