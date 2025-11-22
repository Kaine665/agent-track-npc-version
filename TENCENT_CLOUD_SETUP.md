# 腾讯云服务器部署指南

**文档版本**：v1.0  
**最后更新**：2025-11-22  
**适用环境**：腾讯云 Ubuntu 服务器

---

## 📋 第一步：连接服务器

### 方式一：使用腾讯云控制台（最简单）

1. **登录腾讯云控制台**
   - 访问：https://console.cloud.tencent.com/
   - 登录你的账号

2. **找到你的服务器**
   - 点击左侧菜单「云服务器」→ 「实例」
   - 找到你刚买的服务器

3. **使用网页终端连接**
   - 点击服务器右侧的「登录」按钮
   - 选择「标准登录方式」
   - 输入用户名（Ubuntu 系统默认是 `ubuntu`）
   - 输入密码（购买时设置的密码）

### 方式二：使用 SSH 客户端（Windows）

**使用 PowerShell（Windows 10/11 自带）**：

```powershell
# 在本地电脑打开 PowerShell
ssh ubuntu@你的服务器公网IP

# 例如：
ssh ubuntu@123.456.789.0

# 输入密码（输入时不会显示，直接输入后按 Enter）
```

**使用 PuTTY（如果 PowerShell 不行）**：
1. 下载 PuTTY：https://www.putty.org/
2. 打开 PuTTY
3. Host Name 填写：`你的服务器IP`
4. Port：`22`
5. Connection type：`SSH`
6. 点击「Open」
7. 输入用户名：`ubuntu`
8. 输入密码

---

## 🔐 第二步：配置服务器（首次登录必做）

### 1. 更新系统

```bash
# 更新软件包列表
sudo apt update

# 升级系统（可选，但推荐）
sudo apt upgrade -y
```

### 2. 安装 Docker

```bash
# 安装 Docker（一键安装脚本）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
# 应该显示：Docker version 24.x.x 或类似版本号
```

### 3. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
# 应该显示：Docker Compose version v2.x.x
```

### 4. 配置 Docker 用户组（可选，但推荐）

```bash
# 将当前用户添加到 docker 组（避免每次都用 sudo）
sudo usermod -aG docker $USER

# 重新登录或执行以下命令使配置生效
newgrp docker

# 测试（不需要 sudo）
docker ps
```

---

## 🔥 第三步：配置腾讯云安全组（重要！）

**安全组相当于防火墙，需要开放端口才能访问网站**

### 1. 打开安全组配置

1. 登录腾讯云控制台
2. 点击「云服务器」→ 「实例」
3. 点击你的服务器名称
4. 点击「安全组」标签页
5. 点击安全组名称（例如：`launch-wizard-1`）

### 2. 添加入站规则

点击「入站规则」→ 「添加规则」，添加以下规则：

| 类型 | 协议端口 | 来源 | 策略 | 说明 |
|------|---------|------|------|------|
| HTTP | TCP:80 | 0.0.0.0/0 | 允许 | Web 访问（HTTP） |
| HTTPS | TCP:443 | 0.0.0.0/0 | 允许 | Web 访问（HTTPS） |
| SSH | TCP:22 | 你的IP/32 | 允许 | SSH 连接（可选，更安全） |
| 自定义 | TCP:8000 | 0.0.0.0/0 | 允许 | 后端 API（可选） |
| 自定义 | TCP:3000 | 0.0.0.0/0 | 允许 | 前端服务（可选） |

**快速添加方法**：
- 点击「添加规则」
- 类型选择「HTTP」或「HTTPS」
- 来源选择「0.0.0.0/0」（允许所有 IP 访问）
- 策略选择「允许」
- 点击「完成」

**重要**：
- **80 和 443 端口必须开放**（用于网站访问）
- SSH（22端口）建议只允许你的 IP 访问（更安全）
- 8000 和 3000 端口可选（如果只用 Nginx，可以不开放）

---

## 📦 第四步：上传项目代码

### 方式一：使用 Git（推荐）

```bash
# 在服务器上执行
# 安装 Git（如果还没安装）
sudo apt install git -y

# 克隆项目（替换为你的仓库地址）
git clone https://github.com/your-username/agent-track-npc-version.git

# 进入项目目录
cd agent-track-npc-version
```

### 方式二：使用 SCP 上传（Windows）

**在本地电脑的 PowerShell 中执行**：

```powershell
# 进入项目目录
cd "C:\Users\17130\Desktop\Programming Projects\personal-projects\agent-track\agent-track-npc-version"

# 上传整个项目（替换为你的服务器 IP）
scp -r . ubuntu@你的服务器IP:/home/ubuntu/npc-app

# 例如：
scp -r . ubuntu@123.456.789.0:/home/ubuntu/npc-app
```

然后在服务器上：

```bash
cd /home/ubuntu/npc-app
```

### 方式三：使用 WinSCP（图形界面，最简单）

1. **下载 WinSCP**：https://winscp.net/
2. **连接服务器**：
   - 主机名：你的服务器 IP
   - 用户名：`ubuntu`
   - 密码：你的服务器密码
   - 端口：`22`
3. **上传文件**：
   - 左侧：本地项目文件夹
   - 右侧：服务器 `/home/ubuntu/npc-app`
   - 拖拽整个项目文件夹到右侧

---

## ⚙️ 第五步：配置环境变量

```bash
# 在服务器上，进入项目目录
cd /home/ubuntu/npc-app  # 或你的项目路径

# 复制配置文件
cp env.example .env

# 编辑配置文件
nano .env
# 或使用 vim
vim .env
```

**必须修改的配置**：

```env
# 数据库密码（重要！使用强密码）
DB_PASSWORD=你的强密码123456

# OpenRouter API Key（重要！）
OPENROUTER_API_KEY=sk-or-v1-你的api-key

# 前端 API 地址（使用你的服务器 IP 或域名）
FRONTEND_API_URL=http://你的服务器IP:8000
# 例如：FRONTEND_API_URL=http://123.456.789.0:8000
```

**编辑方法（nano）**：
- 使用方向键移动光标
- 直接输入修改内容
- 保存：`Ctrl + O`，然后 `Enter`
- 退出：`Ctrl + X`

---

## 🚀 第六步：部署应用

### 方法一：使用部署脚本（推荐）

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

脚本会自动：
1. 检查 Docker 环境
2. 启动 MySQL
3. 初始化数据库
4. 构建并启动所有服务

### 方法二：手动部署

**1. 启动 MySQL**

```bash
docker-compose up -d mysql
```

等待 30 秒让 MySQL 启动完成：

```bash
# 查看 MySQL 日志
docker-compose logs -f mysql

# 看到 "ready for connections" 表示启动成功
# 按 Ctrl+C 退出日志查看
```

**2. 初始化数据库**

```bash
# 进入后端目录
cd npc-backend

# 安装依赖（如果还没安装）
npm install

# 初始化数据库
npm run db:init

# 返回项目根目录
cd ..
```

**3. 启动所有服务**

```bash
# 构建并启动所有服务（首次构建需要几分钟）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 应该看到 4 个服务都在运行：
# - npc-mysql
# - npc-backend
# - npc-frontend
# - npc-nginx
```

**4. 查看日志**

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## ✅ 第七步：验证部署

### 1. 检查服务状态

```bash
docker-compose ps
```

所有服务应该显示 `Up` 状态。

### 2. 测试后端 API

```bash
# 在服务器上测试
curl http://localhost:8000/api/v1/health

# 应该返回：{"success":true,"data":{"status":"ok","message":"Server is running"},"timestamp":...}
```

### 3. 访问网站

在浏览器中访问：

```
http://你的服务器IP
```

例如：`http://123.456.789.0`

如果看到登录页面，说明部署成功！🎉

---

## 🌐 配置域名（可选）

### 1. 在腾讯云配置域名解析

1. 登录腾讯云控制台
2. 点击「域名」→ 「我的域名」
3. 找到你的域名，点击「解析」
4. 添加记录：
   - 主机记录：`@`（或 `www`）
   - 记录类型：`A`
   - 记录值：你的服务器 IP
   - TTL：`600`

### 2. 修改 Nginx 配置

```bash
# 编辑 Nginx 配置
nano nginx/conf.d/default.conf

# 修改 server_name
server_name yourdomain.com www.yourdomain.com;  # 替换为你的域名
```

### 3. 重启 Nginx

```bash
docker-compose restart nginx
```

### 4. 访问域名

在浏览器访问：`http://yourdomain.com`

---

## 🔧 常用命令

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 停止并删除容器
docker-compose down

# 更新代码后重新部署
git pull
docker-compose build
docker-compose up -d
```

---

## 🐛 常见问题

### 问题 1：无法连接服务器

**检查**：
- 服务器是否运行中（腾讯云控制台查看）
- 安全组是否开放了 22 端口
- IP 地址是否正确
- 密码是否正确

### 问题 2：端口无法访问

**检查**：
- 安全组是否开放了 80/443 端口
- 服务是否正常运行：`docker-compose ps`
- 查看日志：`docker-compose logs -f`

### 问题 3：数据库连接失败

**检查**：
- `.env` 文件中的 `DB_PASSWORD` 是否正确
- MySQL 是否启动：`docker-compose ps mysql`
- 查看 MySQL 日志：`docker-compose logs mysql`

### 问题 4：前端无法访问后端 API

**检查**：
- `.env` 文件中的 `FRONTEND_API_URL` 是否正确
- 后端服务是否运行：`docker-compose ps backend`
- 测试后端：`curl http://localhost:8000/api/v1/health`

### 问题 5：Docker 命令需要 sudo

**解决**：
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**：`docker-compose logs -f`
2. **查看详细文档**：`DEPLOYMENT.md`
3. **检查服务状态**：`docker-compose ps`
4. **重启服务**：`docker-compose restart`

---

## 🎉 完成！

部署成功后，你可以：
- 访问网站：`http://你的服务器IP`
- 登录并创建 NPC
- 开始使用你的 AI NPC 应用！

**下一步**：
- 配置域名（可选）
- 配置 SSL 证书（HTTPS，可选）
- 设置自动备份（推荐）

祝部署顺利！🚀

