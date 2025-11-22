/**
 * 测试 Repository 层的基本 CRUD 操作
 */
require("dotenv").config();
const UserRepository = require("../repositories/UserRepository");
const AgentRepository = require("../repositories/AgentRepository");
const SessionRepository = require("../repositories/SessionRepository");
const EventRepository = require("../repositories/EventRepository");
const { closePool } = require("../config/database");

async function test() {
  console.log("🧪 Testing Repository Layer...\n");

  try {
    // 1. 测试 UserRepository
    console.log("1️⃣  Testing UserRepository...");
    const timestamp = Date.now();
    const testUser = {
      id: `test_user_${timestamp}`,
      username: `testuser_${timestamp}`,
      password: "testpassword",
    };
    const createdUser = await UserRepository.create(testUser);
    console.log("   ✅ Created user:", createdUser.id);

    const foundUser = await UserRepository.findById(testUser.id);
    console.log("   ✅ Found user:", foundUser?.username);

    const foundByUsername = await UserRepository.findByUsername("testuser");
    console.log("   ✅ Found by username:", foundByUsername?.username);

    // 2. 测试 AgentRepository
    console.log("\n2️⃣  Testing AgentRepository...");
    const testAgent = {
      createdBy: testUser.id,
      name: "测试 NPC",
      type: "general",
      model: "gpt-4",
      systemPrompt: "你是一个友好的助手",
    };
    const createdAgent = await AgentRepository.create(testAgent);
    console.log("   ✅ Created agent:", createdAgent.id);

    const foundAgent = await AgentRepository.findById(createdAgent.id);
    console.log("   ✅ Found agent:", foundAgent?.name);

    const agentsByUser = await AgentRepository.findByUserId(testUser.id);
    console.log("   ✅ Found agents by user:", agentsByUser.length);

    const nameExists = await AgentRepository.checkNameExists(
      testUser.id,
      "测试 NPC"
    );
    console.log("   ✅ Name exists check:", nameExists);

    // 3. 测试 SessionRepository
    console.log("\n3️⃣  Testing SessionRepository...");
    const participants = [
      { type: "user", id: testUser.id },
      { type: "agent", id: createdAgent.id },
    ];
    const session = await SessionRepository.getOrCreateSession(participants);
    console.log("   ✅ Created/get session:", session.sessionId);

    const foundSession = await SessionRepository.findSessionById(
      session.sessionId
    );
    console.log("   ✅ Found session:", foundSession?.sessionId);

    const sessionsByUser = await SessionRepository.findSessionsByUser(
      testUser.id
    );
    console.log("   ✅ Found sessions by user:", sessionsByUser.length);

    // 4. 测试 EventRepository
    console.log("\n4️⃣  Testing EventRepository...");
    const testEvent = {
      sessionId: session.sessionId,
      userId: testUser.id,
      agentId: createdAgent.id,
      fromType: "user",
      fromId: testUser.id,
      toType: "agent",
      toId: createdAgent.id,
      content: "你好，测试消息",
    };
    const createdEvent = await EventRepository.createEvent(testEvent);
    console.log("   ✅ Created event:", createdEvent.id);

    const eventsBySession = await EventRepository.getEventsBySession(
      session.sessionId
    );
    console.log("   ✅ Found events by session:", eventsBySession.length);

    const recentEvents = await EventRepository.getRecentEvents(
      session.sessionId,
      10
    );
    console.log("   ✅ Found recent events:", recentEvents.length);

    const foundEvent = await EventRepository.findEventById(createdEvent.id);
    console.log("   ✅ Found event:", foundEvent?.id);

    console.log("\n✅ All tests passed!");
    
    // 关闭数据库连接池
    await closePool();
    console.log("✅ Database connection closed");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    
    // 即使失败也要关闭连接池
    try {
      await closePool();
    } catch (closeError) {
      // 忽略关闭错误
    }
    
    process.exit(1);
  }
}

test();

