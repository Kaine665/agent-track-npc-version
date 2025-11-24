# 后端测试文档

## 测试框架

本项目使用 **Jest** 作为测试框架，**Supertest** 用于 API 集成测试。

## 安装依赖

```bash
npm install --save-dev jest supertest @types/jest
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监听模式（自动运行相关测试）
npm run test:watch
```

## 测试结构

```
__tests__/
├── setup.js                    # 测试环境设置
├── helpers/                    # 测试辅助工具
│   ├── db-mock.js             # 数据库 Mock 工具
│   └── test-data.js           # 测试数据生成器
├── services/                   # Service 层测试
│   ├── UserService.test.js
│   ├── AgentService.test.js
│   └── FeedbackService.test.js
├── repositories/              # Repository 层测试
│   ├── UserRepository.test.js
│   └── AgentRepository.test.js
├── routes/                     # Route 层测试（API 集成测试）
│   ├── users.test.js
│   └── agents.test.js
├── middleware/                 # Middleware 测试
│   ├── auth.test.js
│   └── errorHandler.test.js
└── utils/                      # Utils 测试
    └── jwt.test.js
```

## 测试覆盖范围

### ✅ 已覆盖

1. **Utils 层**
   - JWT 工具（生成、验证、解码 Token）

2. **Services 层**
   - UserService（登录、注册、忘记密码）
   - AgentService（创建、查询、更新、删除）
   - FeedbackService（提交、查询反馈）

3. **Repositories 层**
   - UserRepository（CRUD 操作）
   - AgentRepository（CRUD 操作、名称唯一性检查）

4. **Routes 层（API 集成测试）**
   - Users API（登录、注册、忘记密码）
   - Agents API（创建、查询、更新、删除）

5. **Middleware**
   - Auth 中间件（认证、可选认证）
   - Error Handler（错误处理、404 处理、请求日志）

### ⏳ 待补充

1. **Services 层**
   - MessageService（消息发送流程）
   - SessionService（会话管理）
   - EventService（事件创建和查询）
   - ImportService（数据导入）
   - LLMService（LLM API 调用）

2. **Repositories 层**
   - EventRepository
   - SessionRepository
   - FeedbackRepository

3. **Routes 层**
   - Messages API
   - History API
   - Sessions API
   - Import API
   - Feedbacks API

## 测试原则

1. **独立性**：每个测试应该独立运行，不依赖其他测试
2. **可重复性**：测试结果应该一致，可重复运行
3. **快速性**：测试应该快速执行，避免真实数据库操作
4. **全面性**：覆盖正常流程、边界情况、错误处理

## Mock 策略

1. **数据库操作**：使用 Jest Mock 模拟数据库查询
2. **外部服务**：Mock LLM API 调用
3. **中间件**：Mock 认证中间件（测试路由时）

## 测试数据

使用 `__tests__/helpers/test-data.js` 中的辅助函数生成测试数据：
- `createTestUser()` - 生成测试用户
- `createTestAgent()` - 生成测试 Agent
- `createTestSession()` - 生成测试 Session
- `createTestEvent()` - 生成测试 Event
- `createTestFeedback()` - 生成测试反馈

## 覆盖率目标

- **语句覆盖率**：≥ 70%
- **分支覆盖率**：≥ 70%
- **函数覆盖率**：≥ 70%
- **行覆盖率**：≥ 70%

## 注意事项

1. **环境变量**：测试使用独立的测试环境变量（`NODE_ENV=test`）
2. **数据库**：测试不连接真实数据库，使用 Mock
3. **异步测试**：使用 `async/await` 处理异步操作
4. **清理工作**：每个测试后清理 Mock，避免测试间相互影响

## 运行示例

```bash
# 运行所有测试
$ npm test

 PASS  __tests__/utils/jwt.test.js
 PASS  __tests__/services/UserService.test.js
 PASS  __tests__/services/AgentService.test.js
 PASS  __tests__/repositories/UserRepository.test.js
 PASS  __tests__/routes/users.test.js

Test Suites: 5 passed, 5 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.345 s
```

## 持续集成

建议在 CI/CD 流程中运行测试：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
```

