/**
 * ============================================
 * 数据验证工具 (validator.js)
 * ============================================
 *
 * 【文件职责】
 * 提供统一的数据验证功能，验证请求参数和业务数据
 *
 * 【主要功能】
 * 1. 字符串验证：非空、长度限制
 * 2. 类型验证：字符串、数字、对象、数组
 * 3. 格式验证：邮箱、URL、ID 格式
 * 4. 范围验证：数字范围、数组长度
 *
 * 【工作流程】
 * 调用验证方法 → 检查数据 → 返回验证结果或抛出错误
 *
 * 【依赖】
 * - 无外部依赖（纯 JavaScript 实现）
 *
 * 【被谁使用】
 * - routes/*.js: 验证请求参数
 * - services/*.js: 验证业务数据
 *
 * 【错误处理】
 * 验证失败时抛出 ValidationError，包含错误码和消息
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

/**
 * 自定义验证错误类
 *
 * 【功能说明】
 * 用于表示验证失败的错误
 */
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.field = field;
  }
}

/**
 * 验证工具对象
 */
const validator = {
  /**
   * 验证字符串非空
   *
   * 【功能说明】
   * 检查字符串是否存在且不为空
   *
   * @param {string} value - 要验证的值
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {string} 验证通过返回原值
   * @throws {ValidationError} 验证失败时抛出错误
   */
  required(value, fieldName = "字段") {
    if (value === null || value === undefined || value === "") {
      throw new ValidationError(`${fieldName}不能为空`, fieldName);
    }
    if (typeof value !== "string") {
      throw new ValidationError(`${fieldName}必须是字符串`, fieldName);
    }
    return value.trim();
  },

  /**
   * 验证字符串长度
   *
   * 【功能说明】
   * 检查字符串长度是否在指定范围内
   *
   * @param {string} value - 要验证的值
   * @param {number} min - 最小长度（可选）
   * @param {number} max - 最大长度（可选）
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {string} 验证通过返回原值
   * @throws {ValidationError} 验证失败时抛出错误
   */
  stringLength(value, min = null, max = null, fieldName = "字段") {
    if (typeof value !== "string") {
      throw new ValidationError(`${fieldName}必须是字符串`, fieldName);
    }
    const length = value.length;
    if (min !== null && length < min) {
      throw new ValidationError(
        `${fieldName}长度不能少于${min}个字符`,
        fieldName
      );
    }
    if (max !== null && length > max) {
      throw new ValidationError(
        `${fieldName}长度不能超过${max}个字符`,
        fieldName
      );
    }
    return value;
  },

  /**
   * 验证数字范围
   *
   * 【功能说明】
   * 检查数字是否在指定范围内
   *
   * @param {number} value - 要验证的值
   * @param {number} min - 最小值（可选）
   * @param {number} max - 最大值（可选）
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {number} 验证通过返回原值
   * @throws {ValidationError} 验证失败时抛出错误
   */
  numberRange(value, min = null, max = null, fieldName = "字段") {
    if (typeof value !== "number" || isNaN(value)) {
      throw new ValidationError(`${fieldName}必须是数字`, fieldName);
    }
    if (min !== null && value < min) {
      throw new ValidationError(
        `${fieldName}不能小于${min}`,
        fieldName
      );
    }
    if (max !== null && value > max) {
      throw new ValidationError(
        `${fieldName}不能大于${max}`,
        fieldName
      );
    }
    return value;
  },

  /**
   * 验证 ID 格式
   *
   * 【功能说明】
   * 检查 ID 是否符合格式要求（如 user_xxx, agent_xxx）
   *
   * @param {string} value - 要验证的值
   * @param {string} prefix - ID 前缀（如 "user", "agent"）
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {string} 验证通过返回原值
   * @throws {ValidationError} 验证失败时抛出错误
   */
  idFormat(value, prefix, fieldName = "字段") {
    if (typeof value !== "string") {
      throw new ValidationError(`${fieldName}必须是字符串`, fieldName);
    }
    const pattern = new RegExp(`^${prefix}_[a-zA-Z0-9_]+$`);
    if (!pattern.test(value)) {
      throw new ValidationError(
        `${fieldName}格式不正确，应为 ${prefix}_xxx 格式`,
        fieldName
      );
    }
    return value;
  },

  /**
   * 验证对象
   *
   * 【功能说明】
   * 检查值是否为对象类型
   *
   * @param {Object} value - 要验证的值
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {Object} 验证通过返回原值
   * @throws {ValidationError} 验证失败时抛出错误
   */
  object(value, fieldName = "字段") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ValidationError(`${fieldName}必须是对象`, fieldName);
    }
    return value;
  },

  /**
   * 验证数组
   *
   * 【功能说明】
   * 检查值是否为数组类型
   *
   * @param {Array} value - 要验证的值
   * @param {number} minLength - 最小长度（可选）
   * @param {string} fieldName - 字段名称（用于错误消息）
   * @returns {Array} 验证通过返回原值
   * @throws {ValidationError} 验证失败时抛出错误
   */
  array(value, minLength = null, fieldName = "字段") {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName}必须是数组`, fieldName);
    }
    if (minLength !== null && value.length < minLength) {
      throw new ValidationError(
        `${fieldName}数组长度不能少于${minLength}`,
        fieldName
      );
    }
    return value;
  },
};

module.exports = validator;
module.exports.ValidationError = ValidationError;

