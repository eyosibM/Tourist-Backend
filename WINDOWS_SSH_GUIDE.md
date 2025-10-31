# 🪟 Windows SSH Guide for AWS EC2

## How to SSH into your AWS EC2 instance from Windows

Since you're on Windows, you have several options for SSH. Here's the easiest approach:

## 🎯 Option 1: Using Windows PowerShell (Recommended)

### **Step 1: Open PowerShell**
1. Press `Windows + R`
2. Type `powershell` and press Enter
3. Or search "PowerShell" in Start menu

### **Step 2: Navigate to your key file**
```powershell
# Go to your Downloads folder (where the .pem file was downloaded)
cd $env:USERPROFILE\Downloads

# List files to confirm your key is there
ls *.pem
```

### **Step 3: Set key file permissions (Windows equivalent)**
```powershell
# Remove inheritance and set permissions for current user only
icacls "tourlicity-key.pem" /inheritance:r
icacls "tourlicity-key.pem" /grant:r "$($env:USERNAME):R"
```

### **Step 4: SSH into your EC2 instance**
```powershell
# Replace YOUR-EC2-PUBLIC-IP with your actual EC2 public IP
ssh -i tourlicity-key.pem ubuntu@51.21.253.140
```

**Example:**
```powershell
ssh -i tourlicity-key.pem ubuntu@3.15.123.456
```

---

## 🎯 Option 2: Using Git Bash (If you have Git installed)

### **Step 1: Open Git Bash**
1. Right-click in your Downloads folder
2. Select "Git Bash Here"
3. Or open Git Bash from Start menu and navigate to Downloads

### **Step 2: Set permissions and SSH**
```bash
# Set proper permissions (Linux-style)
chmod 400 tourlicity-key.pem

# SSH into your instance
ssh -i tourlicity-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

---

## 🎯 Option 3: Using PuTTY (Traditional Windows SSH client)

### **Step 1: Download PuTTY**
1. Go to [putty.org](https://www.putty.org/)
2. Download PuTTY installer
3. Install PuTTY

### **Step 2: Convert .pem to .ppk**
1. Open **PuTTYgen** (installed with PuTTY)
2. Click **"Load"**
3. Select your `tourlicity-key.pem` file
4. Click **"Save private key"**
5. Save as `tourlicity-key.ppk`

### **Step 3: Connect with PuTTY**
1. Open **PuTTY**
2. **Host Name**: `ubuntu@YOUR-EC2-PUBLIC-IP`
3. **Port**: `22`
4. **Connection Type**: `SSH`
5. Go to **Connection → SSH → Auth**
6. **Private key file**: Browse and select `tourlicity-key.ppk`
7. Click **"Open"**

---

## 🔍 Finding Your EC2 Public IP

### **In AWS Console:**
1. Go to **EC2 Dashboard**
2. Click **"Instances"** in left sidebar
3. Select your instance
4. Look for **"Public IPv4 address"** in the details below
5. Copy this IP address

**Example IP formats:**
- `3.15.123.456`
- `18.191.45.123`
- `52.14.78.234`

---

## 🚀 Complete Step-by-Step Example

### **Using PowerShell (Most Common):**

```powershell
# 1. Open PowerShell
# Press Windows + R, type "powershell", press Enter

# 2. Go to Downloads folder
cd $env:USERPROFILE\Downloads

# 3. Check if your key file is there
ls tourlicity-key.pem

# 4. Set permissions (Windows way)
icacls "tourlicity-key.pem" /inheritance:r
icacls "tourlicity-key.pem" /grant:r "$($env:USERNAME):R"

# 5. SSH into your EC2 instance (replace with your actual IP)
ssh -i tourlicity-key.pem ubuntu@3.15.123.456
```

### **What you'll see when it works:**
```
The authenticity of host '3.15.123.456 (3.15.123.456)' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '3.15.123.456' (ECDSA) to the list of known hosts.
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1040-aws x86_64)

ubuntu@ip-172-31-xx-xx:~$
```

**Type `yes` when prompted about authenticity.**

---

## 🚨 Troubleshooting Common Issues

### **"Permission denied (publickey)" error:**
```powershell
# Make sure you're using the right username (ubuntu for Ubuntu AMI)
ssh -i tourlicity-key.pem ubuntu@YOUR-IP

# NOT ec2-user, NOT root, NOT admin - use "ubuntu"
```

### **"Bad permissions" error:**
```powershell
# Fix permissions again
icacls "tourlicity-key.pem" /inheritance:r
icacls "tourlicity-key.pem" /grant:r "$($env:USERNAME):R"
```

### **"Connection timed out" error:**
- Check your Security Group has SSH (port 22) rule
- Verify you're using the correct public IP
- Make sure your EC2 instance is running

### **"Host key verification failed" error:**
```powershell
# Remove old host key and try again
ssh-keygen -R YOUR-EC2-PUBLIC-IP
ssh -i tourlicity-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

---

## 🎯 Quick Reference Commands

### **Navigate to key file:**
```powershell
cd $env:USERPROFILE\Downloads
```

### **Set permissions:**
```powershell
icacls "tourlicity-key.pem" /inheritance:r
icacls "tourlicity-key.pem" /grant:r "$($env:USERNAME):R"
```

### **SSH command template:**
```powershell
ssh -i tourlicity-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

### **Exit SSH session:**
```bash
exit
# or press Ctrl+D
```

---

## 🔄 After Successfully Connecting

Once you're connected via SSH, you'll see a prompt like:
```
ubuntu@ip-172-31-xx-xx:~$
```

Now you can run the deployment commands:
```bash
# Update system
sudo apt update

# Install Git
sudo apt install -y git

# Clone your repository
git clone https://github.com/eyosibM/Tourist-Backend.git

# Navigate to project
cd Tourist-Backend

# Run the free tier deployment script
./deploy-freetier.sh
```

---

## 💡 Pro Tips

### **Save SSH command for easy reuse:**
Create a text file with your SSH command:
```
ssh -i tourlicity-key.pem ubuntu@3.15.123.456
```
Save it as `connect-to-aws.txt` for easy copy-paste.

### **Keep PowerShell window open:**
Don't close the PowerShell window while connected to your server.

### **Multiple sessions:**
You can open multiple PowerShell windows to have multiple SSH connections.

**You're now ready to connect to your AWS EC2 instance!** 🚀