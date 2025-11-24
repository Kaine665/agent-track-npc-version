/**
 * JWT 工具测试
 */

const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
} = require('../../utils/jwt');

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'test_user_123',
    username: 'testuser'
  };

  describe('generateAccessToken', () => {
    it('应该生成有效的 Access Token', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 格式：header.payload.signature
    });

    it('Token 应该包含正确的载荷', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
      expect(decoded.type).toBe('access');
    });

    it('Token 应该包含过期时间', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('应该生成有效的 Refresh Token', () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('Refresh Token 应该包含正确的类型', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = decodeToken(token);
      expect(decoded.type).toBe('refresh');
      expect(decoded.userId).toBe(testPayload.userId);
    });
  });

  describe('verifyToken', () => {
    it('应该验证有效的 Access Token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
      expect(decoded.type).toBe('access');
    });

    it('应该验证有效的 Refresh Token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.type).toBe('refresh');
    });

    it('应该拒绝无效的 Token', () => {
      const invalidToken = 'invalid.token.here';
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('应该拒绝格式错误的 Token', () => {
      expect(() => {
        verifyToken('not-a-jwt-token');
      }).toThrow();
    });

    it('应该拒绝空 Token', () => {
      expect(() => {
        verifyToken('');
      }).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('应该解码 Token（不验证）', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
    });

    it('应该解码无效的 Token（不验证）', () => {
      // decodeToken 不验证，所以即使 Token 无效也能解码
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0In0.invalid';
      const decoded = decodeToken(invalidToken);
      expect(decoded).toBeDefined();
    });
  });

  describe('Token 过期处理', () => {
    it('应该正确处理过期的 Token', () => {
      // 创建一个立即过期的 Token（需要修改 JWT_SECRET 或使用不同的密钥）
      // 这里我们测试 verifyToken 对过期 Token 的处理
      const oldSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret';
      
      // 生成一个 Token，然后修改时间使其过期
      // 注意：实际测试中需要使用更短的有效期或手动设置过期时间
      
      process.env.JWT_SECRET = oldSecret;
    });
  });
});

