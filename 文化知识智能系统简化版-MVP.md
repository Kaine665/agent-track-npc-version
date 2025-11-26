# 文化知识智能系统简化版 - MVP

**文档版本**：v1.0  
**创建时间**：2025-01-XX  
**目标**：生成工作流系统 MVP 实施方案

---

## 一、系统定位

### 1.1 核心定位

**不是"自主提升系统"，而是"工作流生成系统"**

- **目标**：根据用户需求生成工作流
- **输入**：用户需求描述（自然语言或结构化）
- **输出**：可执行的工作流定义（JSON格式）
- **后续**：生成的工作流可以被Agent执行

### 1.2 设计理念

**先有工作流，再谈提升**

- 前期专注于**生成工作流**，不涉及提升功能
- 等有了工作流执行数据后，再考虑如何提升
- 生成的工作流为后续的提升系统提供数据基础

### 1.3 与整体系统的关系

```
生成工作流系统（当前MVP）
    ↓
生成工作流定义
    ↓
Agent执行工作流
    ↓
执行记录 → 记忆系统 → 可视化系统
    ↓
（后续）提升系统分析数据 → 改进工作流
```

---

## 二、系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────┐
│      生成工作流系统（Workflow Generator）│
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. 需求理解器                     │ │
│  │    - 解析用户需求                 │ │
│  │    - 识别工作流类型               │ │
│  │    - 提取关键信息                 │ │
│  └──────────────┬────────────────────┘ │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐ │
│  │ 2. 工作流生成器                   │ │
│  │    - 生成道→法→术→器流程          │ │
│  │    - 生成步骤定义                 │ │
│  │    - 生成条件分支                 │ │
│  └──────────────┬────────────────────┘ │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐ │
│  │ 3. 工作流验证器                   │ │
│  │    - 验证工作流完整性             │ │
│  │    - 验证步骤连接                 │ │
│  │    - 生成测试用例                 │ │
│  └──────────────┬────────────────────┘ │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐ │
│  │ 4. Agent生成器（可选）            │ │
│  │    - 根据工作流生成Agent          │ │
│  │    - 配置Agent的systemPrompt      │ │
│  │    - 注册工作流工具               │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 2.2 核心组件

#### 2.2.1 需求理解器（Requirement Parser）

**职责**：
- 解析用户自然语言需求
- 识别工作流类型（文化知识处理、数据分析、文档生成等）
- 提取关键信息（输入、输出、处理步骤）

**输入**：
- 用户需求描述（自然语言）
- 可选的输入输出样例

**输出**：
- 解析后的结构化需求
- 工作流类型
- 关键信息提取

#### 2.2.2 工作流生成器（Workflow Generator）

**职责**：
- 生成道→法→术→器流程
- 生成步骤定义（顺序执行、条件分支、循环迭代）
- 生成步骤间的数据传递

**输入**：
- 解析后的需求
- 工作流类型

**输出**：
- 完整的工作流定义（JSON格式）

#### 2.2.3 工作流验证器（Workflow Validator）

**职责**：
- 验证工作流完整性
- 验证步骤连接是否正确
- 生成测试用例

**输入**：
- 工作流定义

**输出**：
- 验证结果
- 测试用例（可选）

#### 2.2.4 Agent生成器（Agent Generator，可选）

**职责**：
- 根据工作流自动生成Agent
- 配置Agent的systemPrompt
- 注册工作流需要的工具

**输入**：
- 工作流定义

**输出**：
- Agent配置
- Agent ID

---

## 三、MVP功能范围

### 3.1 阶段1：基础工作流生成（2-3周）

**核心功能**：

1. **需求理解**
   - 解析用户自然语言需求
   - 识别工作流类型（文化知识处理、数据分析、文档生成等）
   - 提取关键信息（输入、输出、处理步骤）

2. **工作流生成**
   - 生成道→法→术→器流程
   - 生成步骤定义（顺序执行）
   - 生成步骤间的数据传递

3. **工作流存储**
   - 保存工作流定义（JSON格式）
   - 工作流列表管理
   - 工作流编辑和更新

**验收标准**：
- 输入："分析儒家思想在汉代的体现"
- 输出：包含道→法→术→器流程的工作流定义

### 3.2 阶段2：高级工作流生成（2-3周）

**扩展功能**：

1. **条件分支**
   - 支持if-else条件判断
   - 支持多分支选择

2. **循环迭代**
   - 支持for循环
   - 支持while循环

3. **Agent生成**
   - 根据工作流自动生成Agent
   - 配置Agent的systemPrompt
   - 注册工作流需要的工具

**验收标准**：
- 支持if-else条件判断
- 支持for/while循环
- 生成的工作流可以自动创建Agent并执行

---

## 四、技术实现方案

### 4.1 工作流定义格式

```javascript
// 工作流定义结构
WorkflowDefinition {
  id: string
  name: string
  description: string
  type: 'cultural' | 'data' | 'document' | 'custom'
  
  // 道→法→术→器流程
  flow: {
    dao: Step[]      // 道：理解根源
    fa: Step[]       // 法：理解展现
    shu: Step[]      // 术：理解方法
    qi: Step[]       // 器：理解载体
  }
  
  // 步骤定义
  steps: Step[]
  
  // 输入输出定义
  input: {
    schema: object   // 输入数据格式
    examples: any[]  // 输入样例
  }
  
  output: {
    schema: object   // 输出数据格式
    examples: any[]  // 输出样例
  }
}

// 步骤定义
Step {
  id: string
  name: string
  type: 'llm_call' | 'action' | 'condition' | 'loop'
  level: 'dao' | 'fa' | 'shu' | 'qi'  // 所属层级
  
  // LLM调用步骤
  llmCall?: {
    prompt: string
    model: string
    systemPrompt?: string
  }
  
  // 动作步骤
  action?: {
    name: string
    params: object
  }
  
  // 条件步骤
  condition?: {
    expression: string
    branches: Branch[]
  }
  
  // 循环步骤
  loop?: {
    type: 'for' | 'while'
    condition: string
    steps: Step[]
  }
  
  // 数据传递
  inputMapping: object   // 输入映射
  outputMapping: object  // 输出映射
  
  // 下一步
  nextSteps: string[]    // 下一步步骤ID
}
```

### 4.2 需求理解器实现

```javascript
// 需求理解服务
class RequirementParser {
  /**
   * 解析用户需求
   * @param {string} requirement - 用户需求描述
   * @returns {ParsedRequirement} 解析后的需求
   */
  async parse(requirement) {
    // 使用LLM解析需求
    const prompt = `
      请分析以下需求，提取关键信息：
      1. 工作流类型（文化知识处理、数据分析、文档生成等）
      2. 输入数据格式
      3. 输出数据格式
      4. 主要处理步骤
      5. 是否需要条件分支
      6. 是否需要循环迭代
      
      需求：${requirement}
      
      请以JSON格式返回分析结果。
    `;
    
    const result = await llmService.generateReply({
      prompt,
      model: 'anthropic/claude-sonnet-4.5'
    });
    
    return JSON.parse(result);
  }
  
  /**
   * 识别工作流类型
   */
  identifyType(requirement) {
    // 关键词匹配 + LLM判断
    if (requirement.includes('文化') || requirement.includes('知识')) {
      return 'cultural';
    }
    if (requirement.includes('数据') || requirement.includes('分析')) {
      return 'data';
    }
    if (requirement.includes('文档') || requirement.includes('生成')) {
      return 'document';
    }
    return 'custom';
  }
}
```

### 4.3 工作流生成器实现

```javascript
// 工作流生成服务
class WorkflowGenerator {
  /**
   * 生成工作流
   * @param {ParsedRequirement} requirement - 解析后的需求
   * @returns {WorkflowDefinition} 工作流定义
   */
  async generate(requirement) {
    // 1. 生成道→法→术→器流程
    const flow = await this.generateFlow(requirement);
    
    // 2. 生成步骤定义
    const steps = await this.generateSteps(requirement, flow);
    
    // 3. 生成输入输出定义
    const inputOutput = await this.generateInputOutput(requirement);
    
    return {
      id: `workflow_${Date.now()}`,
      name: requirement.name,
      description: requirement.description,
      type: requirement.type,
      flow,
      steps,
      input: inputOutput.input,
      output: inputOutput.output
    };
  }
  
  /**
   * 生成道→法→术→器流程
   */
  async generateFlow(requirement) {
    const prompt = `
      根据以下需求，生成道→法→术→器的处理流程：
      
      需求：${requirement.description}
      
      请按照以下格式生成：
      - 道（dao）：理解文化根源，为什么产生
      - 法（fa）：理解时代展现，如何展现
      - 术（shu）：理解方法技巧，怎么做
      - 器（qi）：理解物品载体，用什么
      
      请以JSON格式返回，包含每个层级的处理步骤。
    `;
    
    const result = await llmService.generateReply({ 
      prompt,
      model: 'anthropic/claude-sonnet-4.5'
    });
    
    return JSON.parse(result);
  }
  
  /**
   * 生成步骤定义
   */
  async generateSteps(requirement, flow) {
    const steps = [];
    
    // 为每个层级生成步骤
    for (const [level, levelSteps] of Object.entries(flow)) {
      for (const stepDesc of levelSteps) {
        const step = await this.generateStep(stepDesc, level);
        steps.push(step);
      }
    }
    
    // 连接步骤
    this.connectSteps(steps);
    
    return steps;
  }
  
  /**
   * 生成单个步骤
   */
  async generateStep(stepDesc, level) {
    return {
      id: `step_${Date.now()}_${Math.random()}`,
      name: stepDesc.name,
      type: stepDesc.type || 'llm_call',
      level,
      llmCall: {
        prompt: stepDesc.prompt,
        model: stepDesc.model || 'anthropic/claude-sonnet-4.5'
      },
      inputMapping: stepDesc.inputMapping || {},
      outputMapping: stepDesc.outputMapping || {},
      nextSteps: []
    };
  }
  
  /**
   * 连接步骤
   */
  connectSteps(steps) {
    // 按照层级顺序连接步骤
    const levels = ['dao', 'fa', 'shu', 'qi'];
    
    for (let i = 0; i < levels.length - 1; i++) {
      const currentLevel = levels[i];
      const nextLevel = levels[i + 1];
      
      const currentSteps = steps.filter(s => s.level === currentLevel);
      const nextSteps = steps.filter(s => s.level === nextLevel);
      
      // 连接当前层级的最后一步到下一层级的第一步
      if (currentSteps.length > 0 && nextSteps.length > 0) {
        const lastStep = currentSteps[currentSteps.length - 1];
        const firstStep = nextSteps[0];
        lastStep.nextSteps.push(firstStep.id);
      }
    }
  }
}
```

### 4.4 数据库设计

```sql
-- 工作流定义表
CREATE TABLE workflows (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  definition JSON NOT NULL,  -- 工作流定义（JSON格式）
  input_schema JSON,
  output_schema JSON,
  examples JSON,              -- 输入输出样例
  status VARCHAR(50) DEFAULT 'draft',  -- draft, active, archived
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status)
);

-- 工作流执行记录表（可选，用于后续提升）
CREATE TABLE workflow_executions (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255),
  input_data JSON,
  output_data JSON,
  execution_log JSON,         -- 执行日志
  status VARCHAR(50),         -- running, success, failed
  error_message TEXT,
  created_at BIGINT NOT NULL,
  completed_at BIGINT,
  INDEX idx_workflow_id (workflow_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_status (status)
);
```

### 4.5 API设计

```javascript
// 工作流生成API
POST /api/v1/workflows/generate
请求体：
{
  "requirement": "用户需求描述",
  "type": "cultural",  // 可选
  "examples": []       // 可选，输入输出样例
}

响应：
{
  "success": true,
  "data": {
    "workflow": WorkflowDefinition,
    "agent": Agent  // 可选，如果自动生成Agent
  }
}

// 工作流管理API
POST /api/v1/workflows          // 创建工作流
GET /api/v1/workflows           // 获取工作流列表
GET /api/v1/workflows/:id       // 获取工作流详情
PUT /api/v1/workflows/:id       // 更新工作流
DELETE /api/v1/workflows/:id    // 删除工作流

// 工作流执行API（可选）
POST /api/v1/workflows/:id/execute  // 执行工作流
GET /api/v1/workflows/:id/executions // 获取执行历史
```

---

## 五、实施计划

### 5.1 第1周：需求理解和基础生成

**目标**：能够根据简单需求生成基础工作流

**任务清单**：
1. ✅ 实现需求理解器（LLM解析）
   - 解析用户自然语言需求
   - 识别工作流类型
   - 提取关键信息

2. ✅ 实现基础工作流生成器（顺序步骤）
   - 生成道→法→术→器流程
   - 生成步骤定义
   - 连接步骤

3. ✅ 实现工作流存储（数据库）
   - 创建workflows表
   - 实现Repository层
   - 实现Service层

4. ✅ 实现基础API
   - POST /api/v1/workflows/generate
   - GET /api/v1/workflows
   - GET /api/v1/workflows/:id

**验收标准**：
- 输入："分析儒家思想在汉代的体现"
- 输出：包含道→法→术→器流程的工作流定义
- 工作流可以保存和查询

### 5.2 第2周：工作流验证和Agent生成

**目标**：生成的工作流可以被Agent执行

**任务清单**：
1. ✅ 实现工作流验证器
   - 验证工作流完整性
   - 验证步骤连接
   - 生成验证报告

2. ✅ 实现Agent生成器（根据工作流生成Agent）
   - 根据工作流生成systemPrompt
   - 创建Agent记录
   - 配置Agent参数

3. ✅ 实现工作流执行引擎（基础版）
   - 顺序执行步骤
   - 数据传递
   - 错误处理

4. ✅ 测试完整流程
   - 需求 → 工作流 → Agent → 执行

**验收标准**：
- 生成的工作流可以自动创建Agent
- Agent可以执行工作流
- 执行结果符合预期

### 5.3 第3周：条件分支和循环

**目标**：支持复杂工作流

**任务清单**：
1. ✅ 实现条件分支生成
   - if-else条件判断
   - 多分支选择
   - 条件表达式解析

2. ✅ 实现循环迭代生成
   - for循环
   - while循环
   - 循环条件判断

3. ✅ 完善工作流执行引擎
   - 支持条件分支执行
   - 支持循环执行
   - 优化执行性能

4. ✅ 添加错误处理
   - 步骤执行失败处理
   - 数据传递错误处理
   - 循环超时处理

**验收标准**：
- 支持if-else条件判断
- 支持for/while循环
- 错误处理完善
- 执行性能可接受

---

## 六、与整体系统配合

### 6.1 与记忆系统配合

**数据流**：
```
工作流执行 → 记忆系统存储执行记录
工作流生成 → 记忆系统检索相似工作流
```

**实现方式**：
```javascript
// 工作流执行时，记录到记忆系统
workflowExecution → MemorySystem.save({
  type: 'workflow_execution',
  workflowId: workflow.id,
  steps: executionLog,
  result: output
})

// 工作流生成时，参考历史记忆
MemorySystem.retrieve({
  type: 'workflow',
  similarRequirement: requirement
}) → WorkflowGenerator.generate()
```

### 6.2 与可视化系统配合

**数据流**：
```
工作流定义 → 可视化系统渲染工作流图
工作流执行 → 可视化系统展示执行过程
```

**实现方式**：
```javascript
// 工作流可视化
VisualizationSystem.renderWorkflow({
  workflow: workflowDefinition,
  execution: executionLog  // 可选，执行过程可视化
})

// 工作流生成过程可视化
VisualizationSystem.renderGeneration({
  requirement: requirement,
  steps: generationSteps,  // 生成步骤
  result: workflowDefinition
})
```

### 6.3 与Agent集群配合

**数据流**：
```
工作流定义 → Agent生成器 → Agent
Agent执行工作流 → 执行记录 → 记忆系统
```

**实现方式**：
```javascript
// 生成的工作流可以被Agent执行
WorkflowDefinition → AgentGenerator.generate() → Agent

// Agent执行工作流
Agent.execute(workflow, input) → {
  steps: executionSteps,
  result: output
}
```

### 6.4 与提升系统配合（后续）

**数据流**：
```
工作流执行记录 → 提升系统分析 → 改进方案 → 更新工作流
```

**实现方式**：
```javascript
// 提升系统分析执行记录
ImprovementSystem.analyze({
  workflowId: workflow.id,
  executions: executionHistory
}) → ImprovementPlan

// 应用改进方案
ImprovementSystem.apply({
  workflowId: workflow.id,
  plan: improvementPlan
}) → UpdatedWorkflow
```

---

## 七、关键设计决策

### 7.1 先做生成，不做提升

**决策**：MVP阶段专注于工作流生成，不涉及提升功能

**原因**：
- 先要有工作流，才能提升
- 等有了工作流执行数据后，再考虑如何提升
- 生成的工作流为后续的提升系统提供数据基础

**后续**：
- 收集工作流执行数据
- 分析执行效果
- 设计提升策略

### 7.2 工作流格式标准化

**决策**：使用JSON格式，便于存储和传输

**原因**：
- JSON格式易于解析和处理
- 支持复杂的数据结构
- 便于版本管理和迁移

**格式**：
- 工作流定义：JSON格式
- 步骤定义：JSON格式
- 执行记录：JSON格式

### 7.3 支持道→法→术→器层级结构

**决策**：工作流必须包含道→法→术→器四个层级

**原因**：
- 符合文化知识智能系统的核心理念
- 提供清晰的处理流程
- 便于理解和维护

**实现**：
- 每个步骤必须指定所属层级
- 步骤按照层级顺序执行
- 支持跨层级的数据传递

### 7.4 LLM驱动生成

**决策**：使用LLM理解需求和生成工作流

**原因**：
- LLM能够理解自然语言需求
- LLM能够生成符合道→法→术→器结构的工作流
- 灵活性强，易于扩展

**实现**：
- 需求理解：使用LLM解析需求
- 工作流生成：使用LLM生成步骤
- 可配置LLM模型

### 7.5 可扩展设计

**决策**：支持自定义步骤类型和工具

**原因**：
- 不同场景需要不同的步骤类型
- 支持未来扩展
- 提高系统灵活性

**实现**：
- 步骤类型可扩展（llm_call, action, condition, loop）
- 支持自定义工具注册
- 支持自定义数据格式

---

## 八、技术选型

### 8.1 后端技术栈

- **框架**：Node.js + Express.js（与现有项目一致）
- **数据库**：MySQL（与现有项目一致）
- **LLM服务**：OpenRouter（与现有项目一致）
- **数据格式**：JSON

### 8.2 前端技术栈（可选）

- **框架**：React + Vite（与现有项目一致）
- **UI组件**：Ant Design（与现有项目一致）
- **可视化**：D3.js / ECharts（工作流可视化）

### 8.3 工具和库

- **JSON解析**：原生JSON
- **工作流执行**：自研执行引擎
- **LLM调用**：复用现有LLMService

---

## 九、风险与挑战

### 9.1 技术风险

**风险1**：LLM生成的工作流质量不稳定

**应对**：
- 添加工作流验证器
- 提供人工审核机制
- 支持工作流编辑和优化

**风险2**：复杂工作流执行性能问题

**应对**：
- 优化执行引擎
- 支持异步执行
- 添加超时和重试机制

### 9.2 业务风险

**风险1**：用户需求理解不准确

**应对**：
- 提供需求模板和示例
- 支持多轮对话澄清需求
- 允许用户编辑生成的工作流

**风险2**：工作流执行失败率高

**应对**：
- 完善的错误处理
- 详细的错误日志
- 支持工作流调试模式

---

## 十、后续规划

### 10.1 短期规划（1-3个月）

1. **完善工作流生成**
   - 支持更多工作流类型
   - 优化生成质量
   - 添加工作流模板库

2. **增强执行引擎**
   - 支持并行执行
   - 优化执行性能
   - 添加执行监控

3. **完善可视化**
   - 工作流可视化编辑器
   - 执行过程可视化
   - 性能分析可视化

### 10.2 中期规划（3-6个月）

1. **工作流提升系统**
   - 分析执行数据
   - 生成改进方案
   - 自动优化工作流

2. **工作流市场**
   - 工作流分享
   - 工作流模板库
   - 工作流评分系统

3. **智能推荐**
   - 根据需求推荐工作流
   - 根据历史推荐相似工作流
   - 智能优化建议

### 10.3 长期规划（6-12个月）

1. **自主提升系统**
   - 自动分析问题
   - 自动生成改进方案
   - 自动应用改进

2. **多Agent协作**
   - 工作流支持多Agent协作
   - Agent间数据共享
   - Agent间任务分配

3. **知识图谱集成**
   - 工作流与知识图谱关联
   - 基于知识图谱优化工作流
   - 知识图谱可视化

---

## 十一、总结

### 11.1 核心价值

**生成工作流系统MVP**的核心价值：

1. **降低工作流创建门槛**
   - 用户只需描述需求，系统自动生成工作流
   - 无需编程知识，自然语言即可

2. **标准化工作流格式**
   - 统一的工作流定义格式
   - 便于存储、传输和执行

3. **为提升系统提供基础**
   - 生成的工作流可以被执行
   - 执行数据为后续提升提供基础

### 11.2 实施建议

**优先级排序**：
1. **阶段1**：基础工作流生成（必须，2-3周）
2. **阶段2**：工作流验证和Agent生成（重要，2-3周）
3. **阶段3**：条件分支和循环（可选，2-3周）

**关键原则**：
- 先做生成，不做提升
- 工作流格式标准化
- 支持道→法→术→器层级结构
- LLM驱动生成
- 可扩展设计

### 11.3 与整体系统配合

**数据流**：
```
用户需求 → 生成工作流系统 → 工作流定义
    ↓
工作流定义 → Agent生成器 → Agent
    ↓
Agent执行工作流 → 执行记录 → 记忆系统
    ↓
记忆系统 → 可视化系统 → 用户查看
    ↓
（后续）执行记录 → 提升系统 → 改进工作流
```

**系统配合**：
- 生成的工作流 → Agent执行 → 记忆系统记录 → 可视化系统展示
- 后续可以基于执行记录做提升
- 形成完整的数据闭环

---

**文档维护**：本文档记录生成工作流系统MVP的完整实施方案，后续根据实施情况更新。

