/**
 * ============================================
 * 版本信息配置 (version.js)
 * ============================================
 *
 * 【文件职责】
 * 版本比较和检查逻辑（版本数据从数据库获取）
 *
 * 【重要说明】
 * 版本更新日志现在存储在数据库中（version_changelogs 表）
 * 通过 VersionRepository 访问数据库获取版本信息
 */

const versionRepository = require('../repositories/VersionRepository');

/**
 * 版本比较函数
 * @param {string} v1 - 版本号1
 * @param {string} v2 - 版本号2
 * @returns {number} 1: v1 > v2, -1: v1 < v2, 0: v1 == v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

/**
 * 检查版本是否需要显示更新提示
 * 
 * 【工作流程】
 * 1. 从数据库获取当前最新版本
 * 2. 比较当前版本和用户已读版本
 * 3. 如果当前版本 > 用户已读版本，返回需要显示的更新信息
 * 
 * @param {string} userLastReadVersion - 用户已读的最新版本
 * @returns {Promise<Object>} { shouldShow: boolean, version: string, changelog: Object }
 */
async function shouldShowUpdate(userLastReadVersion) {
  // 从数据库获取当前最新版本
  const currentVersion = await versionRepository.getCurrentVersion();
  
  if (!currentVersion) {
    // 如果没有激活的版本，不显示更新提示
    return {
      shouldShow: false,
      version: null,
      changelog: null,
    };
  }

  // 如果用户没有已读版本，显示当前版本更新
  if (!userLastReadVersion) {
    return {
      shouldShow: true,
      version: currentVersion.version,
      changelog: {
        version: currentVersion.version,
        title: currentVersion.title,
        content: currentVersion.content, // Markdown 内容
        releaseDate: currentVersion.releaseDate,
      },
    };
  }

  // 比较版本号
  if (compareVersions(currentVersion.version, userLastReadVersion) > 0) {
    return {
      shouldShow: true,
      version: currentVersion.version,
      changelog: {
        version: currentVersion.version,
        title: currentVersion.title,
        content: currentVersion.content, // Markdown 内容
        releaseDate: currentVersion.releaseDate,
      },
    };
  }

  // 当前版本 <= 用户已读版本，不需要显示
  return {
    shouldShow: false,
    version: currentVersion.version,
    changelog: null,
  };
}

/**
 * 获取当前版本号（从数据库）
 * @returns {Promise<string|null>} 当前版本号
 */
async function getCurrentVersion() {
  const version = await versionRepository.getCurrentVersion();
  return version ? version.version : null;
}

/**
 * 获取指定版本的更新日志（从数据库）
 * @param {string} version - 版本号
 * @returns {Promise<Object|null>} 更新日志对象
 */
async function getChangelog(version) {
  const versionData = await versionRepository.getByVersion(version);
  if (!versionData) {
    return null;
  }
  return {
    version: versionData.version,
    title: versionData.title,
    content: versionData.content, // Markdown 内容
    releaseDate: versionData.releaseDate,
  };
}

/**
 * 获取所有激活的版本更新日志（从数据库）
 * @param {number} limit - 限制返回数量（可选）
 * @returns {Promise<Array>} 版本更新日志数组
 */
async function getAllChangelogs(limit = null) {
  const versions = await versionRepository.getAllActiveVersions(limit);
  return versions.map(v => ({
    version: v.version,
    title: v.title,
    content: v.content, // Markdown 内容
    releaseDate: v.releaseDate,
  }));
}

module.exports = {
  getCurrentVersion,
  getChangelog,
  getAllChangelogs,
  shouldShowUpdate,
  compareVersions,
};

