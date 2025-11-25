/**
 * ============================================
 * Versions API 路由 (versions.js)
 * ============================================
 * 
 * GET /api/v1/versions - 获取所有版本更新日志
 * GET /api/v1/versions/:version - 获取指定版本的更新日志
 * POST /api/v1/versions - 创建版本更新日志（管理接口）
 * PUT /api/v1/versions/:version - 更新版本更新日志（管理接口）
 */

const express = require('express');
const router = express.Router();
const versionRepository = require('../repositories/VersionRepository');
const { authenticate } = require('../middleware/auth');

// 统一响应辅助函数
function sendSuccessResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data: data,
    timestamp: Date.now(),
  });
}

function sendErrorResponse(res, statusCode, code, message) {
  res.status(statusCode).json({
    success: false,
    error: {
      code: code,
      message: message,
    },
    timestamp: Date.now(),
  });
}

/**
 * 获取所有激活的版本更新日志
 * 公开接口，不需要认证
 */
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const versions = await versionRepository.getAllActiveVersions(limit);
    
    sendSuccessResponse(res, 200, {
      versions: versions,
      total: versions.length,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 获取指定版本的更新日志
 * 公开接口，不需要认证
 */
router.get('/:version', async (req, res) => {
  try {
    const { version } = req.params;
    const versionData = await versionRepository.getByVersion(version);
    
    if (!versionData) {
      return sendErrorResponse(res, 404, 'VERSION_NOT_FOUND', 'Version not found');
    }
    
    sendSuccessResponse(res, 200, versionData);
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 创建版本更新日志
 * 需要认证（管理接口）
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { version, title, content, releaseDate, isActive } = req.body;
    
    if (!version || !title) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Version and title are required');
    }
    
    // 检查版本是否已存在
    const existing = await versionRepository.getByVersion(version);
    if (existing) {
      return sendErrorResponse(res, 409, 'DUPLICATE_VERSION', 'Version already exists');
    }
    
    const newVersion = await versionRepository.create({
      version,
      title,
      content: content || '', // Markdown 内容
      releaseDate,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    sendSuccessResponse(res, 201, newVersion);
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 更新版本更新日志
 * 需要认证（管理接口）
 */
router.put('/:version', authenticate, async (req, res) => {
  try {
    const { version } = req.params;
    const { title, content, releaseDate, isActive } = req.body;
    
    // 检查版本是否存在
    const existing = await versionRepository.getByVersion(version);
    if (!existing) {
      return sendErrorResponse(res, 404, 'VERSION_NOT_FOUND', 'Version not found');
    }
    
    const updatedVersion = await versionRepository.update(version, {
      title,
      content, // Markdown 内容
      releaseDate,
      isActive,
    });
    
    if (!updatedVersion) {
      return sendErrorResponse(res, 500, 'UPDATE_FAILED', 'Failed to update version');
    }
    
    sendSuccessResponse(res, 200, updatedVersion);
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

module.exports = router;

