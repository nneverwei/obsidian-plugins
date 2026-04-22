---
name: auto-convert-plugin-rules
description: auto-convert 插件开发规范：版本号管理和变更记录维护规则
type: feedback
---

**规则**: 每次修改 auto-convert 插件后必须同步更新版本号和 CHANGELOG.md。

**Why:** 用户要求对插件所有修改维护按版本号的修改历史，避免变更丢失，也方便分发给其他用户时了解改动内容。

**How to apply:**
- 大功能（新能力、架构变更）→ 升中间位：1.3.0 → 1.4.0
- 小功能（修复、优化、小调整）→ 升最后位：1.3.0 → 1.3.1
- 反复修改同一问题/功能，合并在同一个版本号里，更新该版本的 CHANGELOG 描述
- 文件位置：manifest.json 改版本号，CHANGELOG.md 改记录
