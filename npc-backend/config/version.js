/**
 * ============================================
 * 版本信息配置 (version.js)
 * ============================================
 *
 * 【文件职责】
 * 定义当前版本号和更新日志
 *
 * 【使用方式】
 * 当有新版本发布时，更新 CURRENT_VERSION 和 CHANGELOG
 */

// 当前版本号
const CURRENT_VERSION = '1.5.0';

// 版本更新日志
const CHANGELOG = {
  '1.5.0': {
    version: '1.5.0',
    releaseDate: '2025-11-25',
    title: 'v1.5.0 版本更新',
    features: [
      '✨ 新增版本更新提示功能',
      '🔐 优化用户登录体验（老用户自动登录）',
      '🐛 修复若干已知问题',
      '⚡ 性能优化和体验改进',
    ],
    description: '本次更新带来了更好的用户体验和功能优化。',
  },
  // 可以添加更多版本的更新日志
  // '1.6.0': { ... }
};

/**
 * 获取当前版本号
 * @returns {string} 当前版本号
 */
function getCurrentVersion() {
  return CURRENT_VERSION;
}

/**
 * 获取指定版本的更新日志
 * @param {string} version - 版本号
 * @returns {Object|null} 更新日志对象，如果不存在则返回 null
 */
function getChangelog(version) {
  return CHANGELOG[version] || null;
}

/**
 * 获取所有版本的更新日志
 * @returns {Object} 所有版本的更新日志
 */
function getAllChangelogs() {
  return CHANGELOG;
}

/**
 * 检查版本是否需要显示更新提示
 * @param {string} userLastReadVersion - 用户已读的最新版本
 * @returns {Object} { shouldShow: boolean, version: string, changelog: Object }
 */
function shouldShowUpdate(userLastReadVersion) {
  // 如果用户没有已读版本，或者已读版本小于当前版本，需要显示
  if (!userLastReadVersion) {
    return {
      shouldShow: true,
      version: CURRENT_VERSION,
      changelog: CHANGELOG[CURRENT_VERSION],
    };
  }

  // 简单的版本比较（假设版本格式为 x.y.z）
  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    return 0;
  };

  if (compareVersions(CURRENT_VERSION, userLastReadVersion) > 0) {
    return {
      shouldShow: true,
      version: CURRENT_VERSION,
      changelog: CHANGELOG[CURRENT_VERSION],
    };
  }

  return {
    shouldShow: false,
    version: CURRENT_VERSION,
    changelog: null,
  };
}

module.exports = {
  getCurrentVersion,
  getChangelog,
  getAllChangelogs,
  shouldShowUpdate,
};

