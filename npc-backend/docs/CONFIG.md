# 配置文件说明

**文档版本**：v1.0  
**最后更新**：2025-01-22

---

## 📋 概述

所有配置统一在 **`config.yaml`** 文件中管理，无需使用 `.env` 文件。

---

## 📁 配置文件位置

```
npc-backend/
  ├── config.yaml          # ⭐ 主配置文件（所有配置都在这里）
  └── config/
      └── config-loader.js # 配置加载器
```

---

## 🔧 配置优先级

1. **`config.yaml`**（优先级最高）
   - 所有配置统一在这里管理
   - YAML 格式，清晰易读
   - 启动时自动加载

2. **环境变量**（Docker 部署时使用）
   - 仅在 Docker 部署时使用
   - 本地开发不需要设置

3. **`.env` 文件**（已废弃，仅向后兼容）
   - 不再推荐使用
   - 如果存在，会被 `config.yaml` 覆盖

---

## 📝 配置结构

```yaml
# 服务器配置
server:
  port: 8000

# 数据库配置
database:
  host: localhost
  port: 3306
  user: root
  password: "your_password"
  name: npc_db

# LLM 提供商配置
llm:
  # OpenRouter 配置（推荐）
  openrouter:
    enabled: true
    # 多个 API Key 用逗号分隔（不要有空格）
    api_key: "key1,key2,key3"
  
  # OpenAI 配置（可选）
  openai:
    enabled: false
    api_key: ""
  
  # DeepSeek 配置（可选）
  deepseek:
    enabled: false
    api_key: ""
```

---

## 🔑 API Key 配置

### 单个 API Key

```yaml
llm:
  openrouter:
    enabled: true
    api_key: "sk-or-v1-your-api-key-here"
```

### 多个 API Key（故障转移）

```yaml
llm:
  openrouter:
    enabled: true
    # 多个 API Key 用逗号分隔，系统会自动故障转移
    # 当第一个失败时，自动尝试下一个
    api_key: "key1,key2,key3"
```

**注意**：
- ✅ 正确：`"key1,key2,key3"`（逗号分隔，无空格）
- ❌ 错误：`"key1, key2, key3"`（有空格，会被自动清理）

---

## 🚀 使用方法

### 1. 编辑配置文件

直接编辑 `npc-backend/config.yaml` 文件：

```bash
# 使用任何文本编辑器
code npc-backend/config.yaml
# 或
notepad npc-backend/config.yaml
```

### 2. 重启服务

修改配置后，重启后端服务：

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 3. 验证配置

启动时会显示配置加载信息：

```
✅ Loaded configuration from config.yaml
📋 Configuration loaded:
   - Server Port: 8000
   - Database: npc_db @ localhost:3306
   - Database User: root
   - Database Password: ***
   - OpenRouter API Key: 3 key(s) configured
```

---

## 🔍 调试配置

### 查看当前配置

启动服务时，控制台会显示：
- ✅ 配置来源（`config.yaml` 或 `.env`）
- 📋 服务器端口
- 📋 数据库配置
- 📋 API Key 数量（不显示实际内容）

### 常见问题

#### 1. API Key 未加载

**问题**：启动时显示 `OpenRouter API Key: (not set)`

**解决**：
- 检查 `config.yaml` 中 `llm.openrouter.api_key` 是否正确设置
- 确保格式正确：`"key1,key2"`（不要有空格）
- 重启服务

#### 2. 配置未生效

**问题**：修改了 `config.yaml`，但配置未生效

**解决**：
- 确保服务已重启
- 检查 YAML 格式是否正确（缩进、引号）
- 查看启动日志，确认配置来源

#### 3. 环境变量覆盖配置

**问题**：系统环境变量覆盖了 `config.yaml` 配置

**解决**：
- 现在 `config.yaml` 优先级更高，会自动覆盖环境变量
- 如果仍有问题，检查是否有 `.env` 文件干扰

---

## 📚 相关文档

- [多 API Key 故障转移配置指南](./MULTI_API_KEYS.md)
- [LLM 模型配置说明](./LLM_MODELS.md)
- [数据库配置说明](./DATABASE_SETUP.md)

---

## 💡 最佳实践

1. **统一管理**：所有配置都在 `config.yaml` 中
2. **版本控制**：将 `config.yaml` 添加到 `.gitignore`，避免泄露敏感信息
3. **多环境**：不同环境使用不同的 `config.yaml` 文件
4. **API Key 管理**：使用多个 API Key 实现故障转移

---

## 🔒 安全提示

⚠️ **重要**：`config.yaml` 包含敏感信息（数据库密码、API Key）

1. **不要提交到 Git**：
   ```gitignore
   # .gitignore
   config.yaml
   ```

2. **创建示例文件**：
   ```bash
   cp config.yaml config.yaml.example
   # 然后编辑 config.yaml.example，移除敏感信息
   ```

3. **生产环境**：使用环境变量或密钥管理服务

---

## 📝 更新日志

- **2025-01-22**：统一配置管理，YAML 配置优先级提升
- **2025-11-21**：初始版本，支持 YAML 和 .env 配置

