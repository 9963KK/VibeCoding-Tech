# [项目名称] 功能清单

> 功能状态的唯一来源（SoT），记录每个功能的描述和实现TODO

**编号规则**: `F-XXX`（F = Feature，XXX = 三位数字）

**状态说明**:
- ✅ 已完成 - 开发完成、测试通过、已合并
- 🚧 开发中 - 正在开发，TODO未全部完成
- ❌ 未开始 - 已规划但未开始

---

# 示例模块（AuthModule）

## F-001 ✅ 用户注册

**描述**：允许新用户通过邮箱和密码创建账户。注册成功后，系统自动发送验证邮件，用户需点击邮件中的链接完成邮箱验证。
**优先级**：P1
**关联模块**：AuthModule

**TODO**
- [x] 设计数据库users表结构
- [x] 实现 POST /api/auth/register 端点
- [x] 实现邮件发送服务
- [x] 实现邮箱验证端点 GET /api/auth/verify/:token
- [x] 单元测试（邮箱格式、密码强度、加密函数）
- [x] 集成测试（注册流程、异常情况）
- [x] API文档更新

---

## F-002 🚧 用户登录

**描述**：用户使用邮箱与密码登录。登录成功后签发 Access Token / Refresh Token（或 Session），并返回用户基础信息。
**优先级**：P1
**关联模块**：AuthModule

**TODO**
- [x] 实现 POST /api/auth/login 端点
- [x] 校验邮箱/密码并生成 Token
- [x] 登录失败策略（错误码、提示文案、防枚举）
- [ ] 刷新 Token 机制对齐（与 F-003）
- [ ] 登录频率限制（防爆破）
- [ ] 单元测试（密码校验、Token 签发、异常分支）
- [ ] 集成测试（登录流程、异常情况）
- [ ] API 文档更新

---

## F-003 ❌ Token刷新

**描述**：使用 Refresh Token 刷新 Access Token（可选：轮换 Refresh Token）。要求安全、可撤销、可追踪。
**优先级**：P2
**关联模块**：AuthModule

**TODO**
- [ ] 实现 POST /api/auth/refresh 端点
- [ ] Refresh Token 校验与过期策略
- [ ] Token 轮换与重放防护（可选）
- [ ] 登出/撤销机制（黑名单或版本号）
- [ ] 单元测试与集成测试
- [ ] API 文档更新
