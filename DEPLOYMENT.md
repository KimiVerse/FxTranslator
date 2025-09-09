# FxTranslator Deployment Guide

This guide provides a complete, step-by-step process for deploying the FxTranslator application on an Ubuntu 22.04 server using Gunicorn, Nginx, and a secure HTTPS connection with Certbot.

## Prerequisites

1.  **Ubuntu 22.04 Server:** A clean server instance with root or sudo access.
2.  **Domain Name:** A registered domain name pointing to your server's IP address.
3.  **GitHub Repository:** Your project code pushed to a GitHub repository.

---

### Phase 1: Code on GitHub

Before deploying, ensure your code is on GitHub.

1.  **Create a `.gitignore` file** in your project root to exclude temporary files:
    ```
    venv/
    __pycache__/
    .vscode/
    ```

2.  **Initialize Git and push your code:**
    ```bash
    git init
    git add .
    git commit -m "Prepare for initial deployment"
    git remote add origin https://github.com/YourUsername/FxTranslator.git
    git branch -M main
    git push -u origin main
    ```

---

### Phase 2: Server Preparation

1.  **Connect to your server via SSH:**
    ```bash
    ssh your_user@your_server_ip
    ```

2.  **Update system packages:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

3.  **Install required software (Nginx, Python, Git):**
    ```bash
    sudo apt install python3-venv python3-pip nginx git -y
    ```

4.  **Configure the firewall:**
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 'OpenSSH'
    sudo ufw enable
    ```

---

### Phase 3: Application Setup

1.  **Clone the repository into `/var/www`:**
    ```bash
    # Replace with your GitHub username and repo name
    sudo git clone https://github.com/YourUsername/FxTranslator.git /var/www/FxTranslator
    ```

2.  **Create and configure the Python virtual environment:**
    ```bash
    cd /var/www/FxTranslator
    sudo python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    ```

3.  **Set correct ownership and permissions:**
    ```bash
    # Replace 'your_user' with your server's username (e.g., root)
    sudo chown -R your_user:www-data /var/www/FxTranslator
    sudo chmod -R 775 /var/www/FxTranslator
    ```

---

### Phase 4: Gunicorn & systemd Service

Create a service to manage the Gunicorn process automatically.

1.  **Create the systemd service file:**
    ```bash
    sudo nano /etc/systemd/system/fxtranslator.service
    ```

2.  **Paste the following configuration.** Replace `your_user` with your server's username.
    ```ini
    [Unit]
    Description=Gunicorn instance to serve FxTranslator
    After=network.target

    [Service]
    User=your_user
    Group=www-data
    WorkingDirectory=/var/www/FxTranslator
    Environment="PATH=/var/www/FxTranslator/venv/bin"
    ExecStart=/var/www/FxTranslator/venv/bin/gunicorn --workers 3 --bind unix:fxtranslator.sock -m 007 app:app

    [Install]
    WantedBy=multi-user.target
    ```

3.  **Start and enable the service:**
    ```bash
    sudo systemctl start fxtranslator
    sudo systemctl enable fxtranslator
    ```
    *Verify it's running with `sudo systemctl status fxtranslator`.*

---

### Phase 5: Nginx Configuration

Configure Nginx to act as a reverse proxy, forwarding web traffic to your app.

1.  **Create the Nginx configuration file:**
    ```bash
    sudo nano /etc/nginx/sites-available/fxtranslator
    ```

2.  **Paste the following.** Replace `your_domain.com` with your actual domain.
    ```nginx
    server {
        listen 80;
        server_name your_domain.com www.your_domain.com;

        location / {
            include proxy_params;
            proxy_pass http://unix:/var/www/FxTranslator/fxtranslator.sock;
        }
    }
    ```

3.  **Enable the configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/fxtranslator /etc/nginx/sites-enabled
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

### Phase 6: Securing with HTTPS (Certbot)

1.  **Install Certbot:**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

2.  **Obtain and install the SSL certificate:**
    ```bash
    sudo certbot --nginx -d your_domain.com -d www.your_domain.com
    ```
    Follow the on-screen prompts. When asked about redirecting traffic, choose **option 2 (Redirect)** to enforce HTTPS.

---

### Updating the Application

To update your live application after pushing new changes to GitHub:

1.  **SSH into your server.**
2.  **Navigate to the project directory:**
    ```bash
    cd /var/www/FxTranslator
    ```
3.  **Pull the latest changes:**
    ```bash
    git pull
    ```
4.  **Re-install dependencies (just in case) and restart the service:**
    ```bash
    source venv/bin/activate
    pip install -r requirements.txt
    sudo systemctl restart fxtranslator
    ```

Your application is now fully deployed and documented!