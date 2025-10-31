# 🔐 AWS Key Pair & Security Group Setup Guide

## Step-by-Step Instructions with Visual Guide

### 🔑 Part 1: Creating a Key Pair

A Key Pair is used for secure SSH access to your EC2 instance.

#### **Step 1: Navigate to Key Pairs**
1. **Login to AWS Console**: Go to [aws.amazon.com](https://aws.amazon.com) and sign in
2. **Go to EC2 Dashboard**: 
   - Click "Services" in top menu
   - Search for "EC2" and click it
   - You'll see the EC2 Dashboard

#### **Step 2: Create Key Pair**
1. **Find Key Pairs**:
   - In the left sidebar, scroll down to "Network & Security"
   - Click "Key Pairs"

2. **Create New Key Pair**:
   - Click the orange "Create key pair" button (top right)

3. **Configure Key Pair**:
   ```
   Name: tourlicity-key
   Key pair type: RSA
   Private key file format: .pem (for SSH)
   ```

4. **Download Key**:
   - Click "Create key pair"
   - **IMPORTANT**: The .pem file will download automatically
   - **Save it securely** - you can't download it again!

#### **Step 3: Secure Your Key File**
```bash
# On Windows (if using WSL or Git Bash):
chmod 400 tourlicity-key.pem

# On Mac/Linux:
chmod 400 tourlicity-key.pem
```

---

### 🛡️ Part 2: Creating a Security Group

A Security Group acts as a virtual firewall controlling traffic to your instance.

#### **Step 1: Navigate to Security Groups**
1. **In EC2 Dashboard**:
   - Left sidebar → "Network & Security" → "Security Groups"
   - Click "Security Groups"

#### **Step 2: Create Security Group**
1. **Click "Create security group"** (orange button, top right)

2. **Basic Details**:
   ```
   Security group name: tourlicity-sg
   Description: Security group for Tourlicity API server
   VPC: (leave default - usually vpc-xxxxxx)
   ```

#### **Step 3: Configure Inbound Rules**
This is the most important part! Add these rules one by one:

**Rule 1: SSH Access**
```
Type: SSH
Protocol: TCP
Port Range: 22
Source: My IP (this will auto-detect your current IP)
Description: SSH access from my IP
```

**Rule 2: HTTP Access**
```
Type: HTTP
Protocol: TCP
Port Range: 80
Source: Anywhere-IPv4 (0.0.0.0/0)
Description: HTTP access for web traffic
```

**Rule 3: HTTPS Access**
```
Type: HTTPS
Protocol: TCP
Port Range: 443
Source: Anywhere-IPv4 (0.0.0.0/0)
Description: HTTPS access for secure web traffic
```

**Rule 4: API Direct Access**
```
Type: Custom TCP
Protocol: TCP
Port Range: 5000
Source: Anywhere-IPv4 (0.0.0.0/0)
Description: Direct API access
```

#### **Step 4: Outbound Rules**
- **Leave default outbound rules** (All traffic to 0.0.0.0/0)
- This allows your server to make outbound connections (for updates, etc.)

#### **Step 5: Create Security Group**
- Click "Create security group" (orange button at bottom)

---

## 🚀 Visual Step-by-Step Process

### **Creating Key Pair - Detailed Steps:**

1. **AWS Console Home**
   ```
   [Services] → Type "EC2" → Click "EC2"
   ```

2. **EC2 Dashboard**
   ```
   Left Sidebar:
   ├── Instances
   ├── Images
   ├── Elastic Block Store
   ├── Network & Security
   │   ├── Security Groups
   │   ├── Key Pairs ← Click here
   │   └── ...
   ```

3. **Key Pairs Page**
   ```
   [Create key pair] ← Orange button (top right)
   ```

4. **Create Key Pair Form**
   ```
   Name: [tourlicity-key]
   Key pair type: ● RSA ○ ED25519
   Private key file format: ● .pem ○ .ppk
   
   [Create key pair] ← Click this
   ```

5. **Download Happens Automatically**
   ```
   ✅ tourlicity-key.pem downloaded to your Downloads folder
   ```

### **Creating Security Group - Detailed Steps:**

1. **Security Groups Page**
   ```
   Left Sidebar → Network & Security → Security Groups
   [Create security group] ← Orange button
   ```

2. **Basic Details Section**
   ```
   Security group name: [tourlicity-sg]
   Description: [Security group for Tourlicity API server]
   VPC: [vpc-xxxxxxxx] ← Leave default
   ```

3. **Inbound Rules Section**
   ```
   [Add rule] ← Click 4 times to add 4 rules
   
   Rule 1:
   Type: [SSH ▼]  Port: [22]  Source: [My IP ▼]
   
   Rule 2:
   Type: [HTTP ▼]  Port: [80]  Source: [Anywhere-IPv4 ▼]
   
   Rule 3:
   Type: [HTTPS ▼]  Port: [443]  Source: [Anywhere-IPv4 ▼]
   
   Rule 4:
   Type: [Custom TCP ▼]  Port: [5000]  Source: [Anywhere-IPv4 ▼]
   ```

4. **Final Result Should Look Like:**
   ```
   Inbound rules:
   ┌─────────────┬──────┬─────────────┬─────────────────┐
   │ Type        │ Port │ Protocol    │ Source          │
   ├─────────────┼──────┼─────────────┼─────────────────┤
   │ SSH         │ 22   │ TCP         │ xxx.xxx.xxx.xxx │
   │ HTTP        │ 80   │ TCP         │ 0.0.0.0/0       │
   │ HTTPS       │ 443  │ TCP         │ 0.0.0.0/0       │
   │ Custom TCP  │ 5000 │ TCP         │ 0.0.0.0/0       │
   └─────────────┴──────┴─────────────┴─────────────────┘
   ```

---

## 🔍 What Each Rule Does

### **SSH (Port 22)**
- **Purpose**: Allows you to connect to your server via SSH
- **Source**: "My IP" - Only your current IP can connect
- **Security**: High - only you can access

### **HTTP (Port 80)**
- **Purpose**: Allows web browsers to access your API
- **Source**: "0.0.0.0/0" - Anyone on the internet can access
- **Security**: Public access for your API

### **HTTPS (Port 443)**
- **Purpose**: Allows secure web browsers access (SSL/TLS)
- **Source**: "0.0.0.0/0" - Anyone on the internet can access
- **Security**: Public access with encryption

### **Custom TCP (Port 5000)**
- **Purpose**: Direct access to your Node.js API
- **Source**: "0.0.0.0/0" - Anyone can access your API directly
- **Security**: Public access for API testing

---

## 🚨 Security Best Practices

### **For Production:**
1. **Change SSH source** from "My IP" to specific IPs only
2. **Remove port 5000** access (use only 80/443 through Nginx)
3. **Add monitoring** with CloudWatch
4. **Enable VPC Flow Logs**

### **For Development:**
- Current setup is perfect for testing and development
- You can always modify rules later

---

## 🎯 Quick Checklist

### **Before Launching EC2 Instance:**
- [ ] Key Pair created and downloaded (`tourlicity-key.pem`)
- [ ] Key file permissions set (`chmod 400 tourlicity-key.pem`)
- [ ] Security Group created (`tourlicity-sg`)
- [ ] All 4 inbound rules added (SSH, HTTP, HTTPS, Custom TCP 5000)
- [ ] Key file saved in secure location

### **After Creating These:**
You're ready to launch your EC2 instance! When launching:
1. **Select your Key Pair**: `tourlicity-key`
2. **Select your Security Group**: `tourlicity-sg`
3. **Instance Type**: `t3.micro` (Free Tier)
4. **AMI**: Ubuntu Server 22.04 LTS

---

## 🔧 Troubleshooting

### **Can't SSH to instance:**
- Check if you selected the right Key Pair during launch
- Verify Security Group has SSH rule with your IP
- Ensure key file has correct permissions (`chmod 400`)

### **Can't access API:**
- Check if Security Group has HTTP (80) and Custom TCP (5000) rules
- Verify rules have source `0.0.0.0/0`
- Make sure your API is running on the instance

### **"My IP" not working:**
- Your IP might have changed
- Edit Security Group → Inbound Rules → Edit SSH rule → Update "My IP"

---

## 📞 Need Help?

If you get stuck:
1. **AWS Documentation**: [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
2. **AWS Support**: Free tier includes basic support
3. **Community**: AWS forums and Stack Overflow

**You're now ready to launch your free EC2 instance!** 🚀