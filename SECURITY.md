# 本地敏感资料保护

云端账号凭据（credentials）、开发者联系方式和原始项目文档保留在本机，并已加入忽略规则（ignore rules）。`documentation/` 仅允许上传 `chatbot_development_progress.md`；交接报告、最终报告及其草稿、团队资料和会议记录需先另行制作脱敏版本（redacted copies）。Google Cloud 密钥文件、数据库备份（database dumps）、初始用户数据及本地生成目录也不应提交。

后端（backend）使用根目录 `.env.local`。原有连接配置已保存于此，旧数据库使用 `LEGACY_DATABASE_URL_1`。已有 `python-dotenv` 依赖自动加载本地配置；云端部署（deployment）须在平台配置对应环境变量（environment variables），其中 `DATABASE_URL` 是当前数据库连接。前端（frontend）的 Mapbox 令牌（tokens）保存于 `LivingAtlas1-main/client/.env.local`。它们会出现在浏览器中，应由平台限制使用范围；不得在前端配置数据库密码。Node 数据导入脚本须先在运行环境设置 `DATABASE_URL` 或完整 `PG*` 参数。

本地原文件备份位于 `.private/security-backup/`，禁止上传。原始 Google Cloud 文件仍保留在原路径。

本仓库的提交前检查（pre-commit check）检查本批暂存文件（staged files），推送前检查（pre-push check）检查待推送历史中的私密文件、私钥和常见凭据格式，只打印路径和问题类别。运行检查脚本且不加参数时会检查整个暂存区（index）。当前机器已经启用；其他克隆（clones）需执行：

```powershell
git config core.hooksPath .githooks
python scripts/check_private_files.py --worktree
```

Git 钩子（Git hooks）仅保护本地常规操作，可以被跳过，不等同于 GitHub 服务端保护。已进入历史提交（commit history）的信息不会因取消跟踪而消失；历史清理完成前，推送检查会阻止带有这些信息的推送。已上传的密码与密钥应先撤销或更换，再协调历史清理。此修改未重写历史，也未推送到 GitHub。
