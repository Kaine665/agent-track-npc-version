# 腾讯云快速部署（5分钟版）

> **超简单版本** - 跟着步骤做就行

---

## 🎯 准备工作

- ✅ 腾讯云服务器（Ubuntu 系统）
- ✅ 服务器公网 IP
- ✅ 服务器密码

---

## 📝 步骤清单

### ✅ 步骤 1：连接服务器

**在腾讯云控制台**：
1. 登录 https://console.cloud.tencent.com/
2. 云服务器 → 实例 → 点击「登录」
3. 选择「标准登录方式」
4. 用户名：`ubuntu`
5. 输入密码

---

### ✅ 步骤 2：一键安装 Docker

**在服务器终端执行**：

```bash
# 更新系统
sudo apt update

# 安装 Docker（使用腾讯云镜像源，更稳定）
# 方法一：使用腾讯云镜像源（推荐）
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose（独立版本）
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

**如果上面的命令还是失败，使用备用方法**：

```bash
# 备用方法：直接使用 apt 安装（腾讯云已配置好镜像源）
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
docker --version
docker-compose --version
```

看到版本号就成功了！

---

### ✅ 步骤 3：开放端口（重要！）

**在腾讯云控制台**：
1. 云服务器 → 实例 → 点击你的服务器
2. 点击「安全组」标签
3. 点击安全组名称
4. 点击「入站规则」→ 「添加规则」

**添加这 3 条规则**：

| 类型 | 端口 | 来源 | 策略 |
|------|------|------|------|
| HTTP | 80 | 0.0.0.0/0 | 允许 |
| HTTPS | 443 | 0.0.0.0/0 | 允许 |
| SSH | 22 | 你的IP | 允许 |

**快速操作**：
- 点击「添加规则」
- 类型选「HTTP」，端口填「80」，来源选「0.0.0.0/0」
- 点击「完成」
- 重复添加 HTTPS（443）和 SSH（22）

---

### ✅ 步骤 4：上传代码

**方法 A：使用 Git（推荐）**

```bash
# 在服务器上执行
sudo apt install git -y
git clone https://github.com/your-username/agent-track-npc-version.git
cd agent-track-npc-version
```

**方法 B：使用 WinSCP（图形界面）**

1. 下载 WinSCP：https://winscp.net/
2. 连接服务器：
   - 主机：你的服务器 IP
   - 用户名：`ubuntu`
   - 密码：你的密码
3. 拖拽项目文件夹到服务器

---

### ✅ 步骤 5：配置环境变量

```bash
# 在项目目录下执行
cp env.example .env
nano .env
```

**修改这 3 个配置**：

```env
DB_PASSWORD=你的密码123456  # 改成强密码
OPENROUTER_API_KEY=sk-or-v1-你的key  # 填写你的 API Key
FRONTEND_API_URL=http://你的服务器IP:8000  # 例如：http://123.456.789.0:8000
```

**保存**：`Ctrl + O` → `Enter` → `Ctrl + X`

---

### ✅ 步骤 6：一键部署

```bash
# 给脚本权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

等待 3-5 分钟，看到「部署完成」就成功了！

---

### ✅ 步骤 7：访问网站

在浏览器打开：

```
http://你的服务器IP
```

看到登录页面就成功了！🎉

---

## 🔧 如果脚本不工作，手动部署

```bash
# 1. 启动 MySQL
docker-compose up -d mysql
sleep 30

# 2. 初始化数据库
cd npc-backend
npm install
npm run db:init
cd ..

# 3. 启动所有服务
docker-compose up -d

# 4. 查看状态
docker-compose ps
```

---

## ❓ 遇到问题？

**无法连接服务器？**
- 检查安全组是否开放 22 端口
- 检查服务器是否运行中

**网站打不开？**
- 检查安全组是否开放 80 端口
- 运行：`docker-compose ps` 查看服务状态
- 运行：`docker-compose logs -f` 查看日志

**数据库错误？**
- 检查 `.env` 文件中的 `DB_PASSWORD` 是否正确

---

## 📚 更多帮助

- **详细文档**：查看 `TENCENT_CLOUD_SETUP.md`
- **查看日志**：`docker-compose logs -f`
- **重启服务**：`docker-compose restart`

---

**完成！** 现在可以开始使用你的应用了！🚀

