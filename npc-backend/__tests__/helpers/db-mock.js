/**
 * 数据库 Mock 工具
 * 用于模拟数据库操作，避免真实数据库依赖
 */

/**
 * 创建数据库查询 Mock
 * @param {Array} mockResults - Mock 查询结果数组
 * @returns {Object} Mock 数据库对象
 */
function createDbMock(mockResults = []) {
  const results = [...mockResults];
  let queryIndex = 0;
  
  return {
    query: jest.fn((sql, params) => {
      const result = results[queryIndex] || [];
      queryIndex++;
      return Promise.resolve(result);
    }),
    execute: jest.fn((sql, params) => {
      const result = results[queryIndex] || [];
      queryIndex++;
      return Promise.resolve([result]);
    }),
    reset: () => {
      queryIndex = 0;
    },
    setResults: (newResults) => {
      results.length = 0;
      results.push(...newResults);
      queryIndex = 0;
    }
  };
}

/**
 * Mock 数据库连接池
 */
function mockDatabase() {
  const mockPool = {
    execute: jest.fn(),
    query: jest.fn(),
    getConnection: jest.fn(() => Promise.resolve({
      execute: jest.fn(),
      query: jest.fn(),
      beginTransaction: jest.fn(() => Promise.resolve()),
      commit: jest.fn(() => Promise.resolve()),
      rollback: jest.fn(() => Promise.resolve()),
      release: jest.fn()
    })),
    end: jest.fn(() => Promise.resolve())
  };
  
  return mockPool;
}

module.exports = {
  createDbMock,
  mockDatabase
};

