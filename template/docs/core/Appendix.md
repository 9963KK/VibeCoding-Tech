# 附加材料（Additional Materials）

> 开发过程中需要的规范、技术标准和特殊注意事项的快速索引入口

---

## 1. 编码规范（Coding Standards）

> 记录项目代码风格、设计原则、命名规范等

| ID | 主题 | 一句话结论 | 触发条件 | 关联文件 | 规范链接 | 状态 |
|---|---|---|---|---|---|---|
| CS-001 | SOLID原则检查 | 每个模块/类/函数必须遵循单一职责原则 | 新增模块、类、函数 | `src/**/*.ts` | L-101 | active |
| CS-002 | 命名规范 | 使用语义化命名，避免缩写和拼音 | 所有代码文件 | `src/**/*` | L-102 | active |
| CS-003 | 函数复杂度限制 | 单个函数不超过50行，圈复杂度≤10 | 新增/修改函数 | `src/**/*.ts` | L-103 | active |

---

## 2. API设计规范（API Design Standards）

> 记录RESTful API设计原则、响应格式、错误码规范等

| ID | 主题 | 一句话结论 | 触发条件 | 关联文件 | 规范链接 | 状态 |
|---|---|---|---|---|---|---|
| API-001 | RESTful规范 | 使用标准HTTP方法，资源命名使用复数名词 | 新增/修改API端点 | `src/routes/**/*.ts` | L-201 | active |
| API-002 | 统一响应格式 | 所有API响应必须包含code、message、data字段 | 新增/修改API端点 | `src/controllers/**/*.ts` | L-202 | active |
| API-003 | 错误码规范 | 使用标准HTTP状态码 + 业务错误码 | 新增错误处理 | `src/errors/**/*.ts` | L-203 | active |

---

## 3. 数据库设计规范（Database Design Standards）

> 记录数据库表设计、索引策略、迁移规范等

| ID | 主题 | 一句话结论 | 触发条件 | 关联文件 | 规范链接 | 状态 |
|---|---|---|---|---|---|---|
| DB-001 | 表命名规范 | 使用snake_case，表名使用复数 | 新增/修改数据表 | `prisma/schema.prisma` | L-301 | active |
| DB-002 | 索引设计原则 | 外键、查询条件字段必须建索引 | 新增/修改表结构 | `prisma/migrations/**/*.sql` | L-302 | active |
| DB-003 | 迁移脚本规范 | 不可直接修改Schema，必须通过migration | 数据库变更 | `prisma/` | L-303 | active |

---

## 4. 安全检查清单（Security Checklist）

> 记录安全审查要点、常见漏洞防范措施

| ID | 主题 | 一句话结论 | 触发条件 | 关联文件 | 规范链接 | 状态 |
|---|---|---|---|---|---|---|
| SEC-001 | SQL注入防范 | 使用参数化查询，禁止字符串拼接SQL | 数据库查询相关代码 | `src/**/*.ts` | L-401 | active |
| SEC-002 | XSS防范 | 用户输入必须转义，使用Content Security Policy | 前端渲染用户输入 | `src/frontend/**/*.tsx` | L-402 | active |
| SEC-003 | 敏感信息保护 | 密码、密钥不得硬编码，必须使用环境变量 | 所有代码文件 | `src/**/*` `.env` | L-403 | active |

---

## 5. 测试策略（Testing Strategy）

> 记录测试覆盖要求、测试用例编写规范

| ID | 主题 | 一句话结论 | 触发条件 | 关联文件 | 规范链接 | 状态 |
|---|---|---|---|---|---|---|
| TEST-001 | 测试覆盖率要求 | 单元测试覆盖率≥80%，核心模块≥90% | 所有功能代码 | `src/**/*.test.ts` | L-501 | active |
| TEST-002 | 测试用例命名 | 使用"should + 预期行为"格式 | 所有测试文件 | `**/*.test.ts` `**/*.spec.ts` | L-502 | active |
| TEST-003 | Mock策略 | 外部依赖必须Mock，避免真实网络/DB调用 | 单元测试 | `src/**/*.test.ts` | L-503 | active |

---

## 6. 技术细节（Technical Details）

> 记录项目特殊的技术约束/接入规范/实现注意点

| ID | 主题 | 一句话结论 | 触发条件 | 关联文件 | 规范链接 | 状态 |
|---|---|---|---|---|---|---|
| TD-001 | JWT Token配置 | accessToken过期时间15分钟，refreshToken 7天 | 认证相关代码 | `src/modules/auth/jwt.util.ts` | L-601 | active |
| TD-002 | WebSocket连接管理 | 使用Socket.io，支持断线重连和消息补发 | 实时通信代码 | `src/modules/chat/websocket.gateway.ts` | L-602 | active |

---

## 7. 设计风格参考（Design Style Reference）

> 记录前端风格基线与设计资产入口，包括配色、字体、组件风格等

| ID | 范围 | 风格基线描述 | 资产入口 | 落地位置 | 状态 |
|---|---|---|---|---|---|
| DS-001 | Web前端 | 采用Material Design 3风格 | L-701 | `src/frontend/styles/theme.ts` | active |
| DS-002 | 移动端 | 遵循iOS HIG和Material Design Mobile | L-702 | `src/mobile/theme/` | active |

---

## 8. 用户记忆（User Memory）

> 记录用户在交互中明确强调的修改点/偏好/禁止项，避免迭代中丢失

| ID | 用户强调点摘要 | 影响范围 | 关联需求 | 关联文件 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|
| UM-20260109-001 | 核心流程只专注开发，不包含监控和验证 | 开发流程文档 | - | `02-开发生命周期.md` | 流程终点为代码合并，不包含DevOps | done |
| UM-20260109-002 | 功能清单保持整洁，只有3要素 | 功能清单文档 | - | `模板-功能清单.md` | 每条功能只包含：名称+描述+TODO | done |

---

## 9. Links字典

> 统一管理外链/资产链接，正文只引用 `L-xxx`

### 编码规范相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-101 | SOLID原则详解 | https://en.wikipedia.org/wiki/SOLID |
| L-102 | 命名规范参考 | https://google.github.io/styleguide/ |
| L-103 | 代码复杂度工具 | https://eslint.org/docs/rules/complexity |

### API设计规范相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-201 | RESTful API设计指南 | https://restfulapi.net/ |
| L-202 | HTTP状态码参考 | https://httpstatuses.com/ |
| L-203 | API错误处理最佳实践 | https://www.rfc-editor.org/rfc/rfc7807 |

### 数据库设计规范相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-301 | PostgreSQL命名规范 | https://www.postgresql.org/docs/current/sql-syntax.html |
| L-302 | 索引设计最佳实践 | https://use-the-index-luke.com/ |
| L-303 | Prisma迁移文档 | https://www.prisma.io/docs/concepts/components/prisma-migrate |

### 安全检查清单相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-401 | OWASP Top 10 | https://owasp.org/www-project-top-ten/ |
| L-402 | XSS防范指南 | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html |
| L-403 | 密钥管理最佳实践 | https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html |

### 测试策略相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-501 | Jest测试框架 | https://jestjs.io/ |
| L-502 | 测试金字塔 | https://martinfowler.com/articles/practical-test-pyramid.html |
| L-503 | Mock最佳实践 | https://jestjs.io/docs/mock-functions |

### 技术细节相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-601 | JWT最佳实践 | https://jwt.io/introduction |
| L-602 | Socket.io文档 | https://socket.io/docs/v4/ |

### 设计风格相关

| Link ID | 名称 | 链接 |
|---|---|---|
| L-701 | Material Design 3 | https://m3.material.io/ |
| L-702 | iOS Human Interface Guidelines | https://developer.apple.com/design/human-interface-guidelines/ |

### 内部文档（模板）

| Link ID | 名称 | 链接 |
|---|---|---|
| L-900 | JVibe技术规范 | `./JVibe技术规范.md` |
| L-901 | 项目文档模板 | `./模板-项目文档.md` |
| L-902 | 功能清单模板 | `./模板-功能清单.md` |
| L-903 | 附加材料模板 | `./模板-附加材料.md` |
| L-904 | 规范文档模板 | `./模版-规范文档.md` |

### 内部文档（Core文档）

| Link ID | 名称 | 链接 |
|---|---|---|
| L-910 | 规范文档 | `./Standards.md` |
| L-911 | 项目文档 | `./Project.md` |
| L-912 | 功能清单 | `./Feature-List.md` |
| L-913 | 附加材料 | `./Appendix.md` |

