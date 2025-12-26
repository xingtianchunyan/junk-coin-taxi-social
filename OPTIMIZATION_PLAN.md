# Junk Coin Taxi Social - 项目优化与开发指导计划

## 1. 项目愿景与目标
本计划旨在将 Junk Coin Taxi Social 从一个功能原型（MVP）提升为生产级、可扩展且安全的 Web3 社交拼车平台。核心目标包括：
- **安全性**：保护用户数据与支付流程。
- **稳定性**：通过自动化测试减少回归 Bug。
- **可维护性**：优化代码结构，降低长期开发成本。
- **自动化**：实现支付验证与部署流程的自动化。

---

## 2. 当前核心问题分析
1. **安全性隐患**：API 密钥硬编码，缺乏环境变量管理。
2. **测试缺失**：无任何单元测试或集成测试，核心调度算法（时间重叠检测）风险高。
3. **架构失位**：核心业务计算逻辑（如司机冲突检测）耦合在前端组件中。
4. **包管理混乱**：`npm` 与 `bun` 锁定文件共存。
5. **文档薄弱**：缺乏环境配置、数据库模式及 API 业务说明。

---

## 3. 阶段性优化路线图

### 第一阶段：基础设施与安全性 (优先级：最高 - 立即执行)
- [x] **环境变量重构**：创建 `.env.example`，将 Supabase Key 等敏感信息移出源码。
- [x] **统一包管理器**：确定使用 `npm`，删除 `bun.lockb`，修复 `npm audit` 漏洞。
- [x] **安全性加固 (RLS 策略)**：
  - [x] **修复隐患**：`ride_requests` 表目前允许 `SELECT (true)`，存在全量数据泄露风险。
  - [x] **修复隐患**：`payments` 表目前缺乏严格的归属校验（RLS 被禁用且无策略）。
  - [x] **方案**：重写 SQL 策略，强制要求 `access_code` 匹配，并为 `super_admin` 添加全局管理权限。已创建 `20251226000000_fix_rls_vulnerabilities.sql`。
- [x] **添加许可证**：在根目录添加 `LICENSE` 文件（已添加 MIT）。

### 第二阶段：代码质量与重构 (优先级：高 - 已完成)
- [x] **提取公共转换层**：在 `src/services` 中提取通用的数据映射（Data Mapping）函数，消除冗余（已统一 Destination 和 WalletAddress 类型）。
- [x] **消除 `any` 类型**：全面修复 TS 类型定义，特别是 `RideRequest` 相关的复杂对象及 Supabase Edge Functions 中的类型。
- [x] **核心逻辑后端化**：将 `checkDriverTimingForRequest` 等逻辑迁移至 Supabase RPC 和 Edge Functions（已实现费用计算、时间冲突检测、支付验证 RPC 及数据库触发器）。
- [x] **全局状态优化**：使用 `Zustand` 替代了 `AccessCodeProvider` 和 `WalletContext`，提升了状态管理的持久化和同步效率。

### 第三阶段：自动化测试与 CI/CD (优先级：中 - 已完成)
- [x] **搭建测试框架**：引入 `Vitest` 和 `React Testing Library`，并配置了 `jsdom` 环境。
- [x] **核心算法测试**：为车费计算、时间冲突检测编写了单元测试（`rideRequestService.test.ts`）。
- [x] **配置 CI 流水线**：添加了 `.github/workflows/ci.yml`，实现提交代码自动运行 Lint 和测试。
- [x] **E2E 测试**：使用 `Playwright` 覆盖了“叫车-登录-查看需求”的主路径（`e2e/ride-flow.spec.ts`）。

### 第四阶段：业务增强与体验优化 (优先级：低 - 持续迭代)
- [ ] **支付自动化**：集成 Webhook 监听链上交易，实现支付状态自动更新。
- [ ] **地图 API 集成**：集成 Google Maps/Mapbox，支持地图选点和路径规划。
- [ ] **通知系统**：实现 Telegram Bot 或 Web Push 通知，提醒订单状态变更。

---

## 4. 技术标准与规范

### 代码规范
- **组件化**：UI 组件必须放在 `src/components/ui`，业务逻辑组件放在 `src/components/`。
- **Hooks**：复杂的页面逻辑必须提取到 `src/hooks/` 下。
- **命名**：
    - 组件：大驼峰 (PascalCase)。
    - 工具函数/变量：小驼峰 (camelCase)。
    - 常量：全大写下划线 (SNAKE_CASE)。

### Git 提交规范
遵循 Conventional Commits：
- `feat`: 新功能
- `fix`: 修复 Bug
- `refactor`: 重构
- `docs`: 文档更新
- `test`: 测试相关

---

## 5. 维护与更新
本计划应根据开发进度每两周审查一次，并根据社区反馈动态调整优先级。
