# 数据库配置指南

**文档版本**：v1.0  
**最后更新**：2025-11-21  
**适用系统**：Windows 10/11

---

## 📋 前置条件

- ✅ MySQL 已安装（已验证）
- ✅ MySQL 服务已启动
- ✅ 知道 MySQL root 密码

---

## 🚀 快速开始（3 步搞定）

### 步骤 1：配置环境变量

在 `npc-backend` 目录下创建 `.env` 文件，内容如下：

```env
# 服务器配置
PORT=8000

# 数据库配置（重要！）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码    # ⚠️ 请填写你的 MySQL root 密码
DB_NAME=npc_db

# LLM 配置（可选，暂时不填）
OPENAI_API_KEY=
ENABLE_OPENAI=false
DEEPSEEK_API_KEY=
ENABLE_DEEPSEEK=false
OPENROUTER_API_KEY=
ENABLE_OPENROUTER=false
MODELS=
```

**重要**：
- 将 `你的MySQL密码` 替换为你的实际 MySQL root 密码
- 如果不知道密码，参考下面的"忘记密码怎么办"

### 步骤 2：初始化数据库

在 `npc-backend` 目录下运行：

```bash
npm run db:init
```

**预期输出**：
```
🚀 Starting database initialization...
📡 Connecting to MySQL server...
✅ Connected to MySQL server
📖 Reading SQL file...
✅ SQL file read successfully
⚙️  Executing SQL statements...
✅ SQL statements executed successfully
🔍 Verifying tables...
✅ Tables created: users, agents, events, sessions
🎉 Database initialization completed!
```

### 步骤 3：验证数据库连接

运行后端服务器：

```bash
npm run dev
```

如果看到服务器启动成功，说明数据库配置正确！

---

## 🔍 详细说明

### 方式一：使用 Node.js 脚本（推荐）

**优点**：简单快速，自动执行

**步骤**：
1. 配置 `.env` 文件（见步骤 1）
2. 运行 `npm run db:init`

### 方式二：使用 MySQL 命令行

**优点**：直接操作数据库，可以看到详细输出

**步骤**：

1. **打开 PowerShell 或 CMD**

2. **登录 MySQL**：
   ```bash
   mysql -u root -p
   ```
   - 输入你的 MySQL root 密码
   - 如果提示"不是内部或外部命令"，需要将 MySQL 添加到 PATH

3. **执行 SQL 文件**：
   ```sql
   source C:/Users/17130/Desktop/Programming Projects/personal-projects/agent-track/agent-track-npc-version/npc-backend/migrations/001_create_database.sql
   ```
   **注意**：路径需要根据你的实际项目路径修改

4. **验证表是否创建**：
   ```sql
   USE npc_db;
   SHOW TABLES;
   ```
   应该看到：`users`, `agents`, `events`, `sessions`

5. **退出 MySQL**：
   ```sql
   exit;
   ```

### 方式三：使用 MySQL Workbench（图形界面）

**优点**：可视化操作，适合新手

**步骤**：

1. **打开 MySQL Workbench**
   - 如果安装 MySQL 时选择了 MySQL Workbench，可以在开始菜单找到

2. **连接到 MySQL 服务器**
   - 点击 "Local instance MySQL80"（或你的实例名称）
   - 输入 root 密码
   - 点击 "OK"

3. **打开 SQL 文件**
   - 点击菜单：File → Open SQL Script
   - 选择文件：`npc-backend/migrations/001_create_database.sql`

4. **执行 SQL**
   - 点击工具栏的 "Execute" 按钮（⚡ 图标）
   - 或按快捷键 `Ctrl + Shift + Enter`

5. **验证结果**
   - 在左侧 "SCHEMAS" 面板中，刷新（右键 → Refresh All）
   - 展开 `npc_db` 数据库
   - 应该看到 4 个表：`users`, `agents`, `events`, `sessions`

---

## ❓ 常见问题

### 问题 1：忘记 MySQL root 密码怎么办？

**解决方案**：

1. **停止 MySQL 服务**：
   - 打开"服务"（Win+R，输入 `services.msc`）
   - 找到 "MySQL80" 服务
   - 右键 → 停止

2. **以跳过权限表方式启动 MySQL**：
   ```bash
   # 打开 PowerShell（管理员权限）
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   .\mysqld --skip-grant-tables
   ```

3. **新开一个 PowerShell 窗口，登录 MySQL**：
   ```bash
   mysql -u root
   ```

4. **重置密码**：
   ```sql
   USE mysql;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
   FLUSH PRIVILEGES;
   exit;
   ```

5. **重启 MySQL 服务**：
   - 在服务管理器中启动 MySQL80 服务

6. **使用新密码登录测试**：
   ```bash
   mysql -u root -p
   ```

### 问题 2：MySQL 服务未启动

**解决方案**：

1. **检查服务状态**：
   - 打开"服务"（Win+R，输入 `services.msc`）
   - 找到 "MySQL80" 服务
   - 查看状态是否为"正在运行"

2. **启动服务**：
   - 如果未运行，右键 → 启动

3. **如果启动失败**：
   - 检查错误日志（通常在 `C:\ProgramData\MySQL\MySQL Server 8.0\Data\`）
   - 或查看服务属性中的"登录"选项卡，确保服务账户有权限

### 问题 3：连接被拒绝（ECONNREFUSED）

**可能原因**：
- MySQL 服务未启动
- 端口被占用
- 防火墙阻止连接

**解决方案**：

1. **检查 MySQL 服务是否启动**（见问题 2）

2. **检查端口是否被占用**：
   ```bash
   netstat -ano | findstr :3306
   ```
   如果看到输出，说明端口被占用

3. **检查防火墙设置**：
   - 开发环境可以暂时关闭防火墙测试
   - 或添加 MySQL 到防火墙例外列表

### 问题 4：数据库已存在错误

**解决方案**：

- **方案 A**：忽略错误（数据库已存在，可以继续使用）
- **方案 B**：删除数据库后重新创建：
  ```sql
  DROP DATABASE IF EXISTS npc_db;
  ```
  然后重新运行初始化脚本

### 问题 5：权限不足

**错误信息**：`Access denied for user 'root'@'localhost'`

**解决方案**：

1. **检查用户名和密码是否正确**
2. **检查用户权限**：
   ```sql
   SHOW GRANTS FOR 'root'@'localhost';
   ```
3. **如果权限不足，授予权限**：
   ```sql
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
   FLUSH PRIVILEGES;
   ```

---

## ✅ 验证数据库配置

### 方法 1：使用 Node.js 脚本测试

创建测试文件 `test-db-connection.js`：

```javascript
require("dotenv").config();
const { testConnection } = require("./config/database");

async function test() {
  const connected = await testConnection();
  if (connected) {
    console.log("✅ Database connection successful!");
  } else {
    console.log("❌ Database connection failed!");
  }
  process.exit(connected ? 0 : 1);
}

test();
```

运行：
```bash
node test-db-connection.js
```

### 方法 2：使用 MySQL 命令行

```bash
mysql -u root -p
```

输入密码后，执行：
```sql
USE npc_db;
SHOW TABLES;
```

应该看到 4 个表。

---

## 📊 数据库结构

初始化完成后，会创建以下表：

1. **users** - 用户表
   - 存储用户信息（ID、用户名、密码等）

2. **agents** - NPC 表
   - 存储 NPC 配置信息（名称、类型、模型、人设等）

3. **events** - 事件表
   - 存储对话事件记录（用户发言、NPC 回复）

4. **sessions** - 会话表
   - 存储会话信息（参与者、创建时间、活动时间）

详细表结构请参考：[数据模型文档](../产品文档/05-数据模型.md)

---

## 🔄 后续操作

数据库初始化完成后：

1. ✅ **验证连接**：运行 `npm run dev` 启动服务器
2. ✅ **测试 API**：使用 Postman 或 Insomnia 测试 API
3. ✅ **查看数据**：使用 MySQL Workbench 查看数据库内容

---

## 📚 相关文档

- [数据模型文档](../产品文档/05-数据模型.md) - 详细的表结构说明
- [开发环境配置指南](../../开发环境配置指南.md) - 完整的开发环境配置
- [快速开始指南](../产品文档/00-快速开始指南.md) - 开发执行指南

---

**配置完成后，告诉我结果，我们继续下一步！** 🚀

