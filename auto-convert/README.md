# Auto Convert

自动将 Word（.docx/.doc）、Excel（.xlsx/.xls）、RTF、ODT 等文档转换为 Markdown 格式。

基于 [Pandoc](https://pandoc.org/) 进行格式转换，Excel 文件使用 [SheetJS](https://sheetjs.com/) 在插件内直接解析。

## 功能

- **自动转换** — 新增匹配的文档文件时自动转换为 Markdown
- **批量转换** — 一键扫描仓库中所有未转换的文件并批量处理
- **Excel 支持** — 将 Excel 工作表转换为 Markdown 表格，支持合并单元格、多 Sheet
- **文件夹排除** — 可指定不参与转换的文件夹路径

## 前置条件

需要安装 [Pandoc](https://pandoc.org/installing.html)，插件会在启动时自动检测。

## 安装

1. 将 `auto-convert/` 文件夹复制到 vault 的 `.obsidian/plugins/auto-convert/`
2. 在 Obsidian 设置 → 第三方插件中启用「自动转换doc」
3. 如果 Pandoc 不在系统 PATH 中，在插件设置中指定 Pandoc 可执行文件路径

## 设置

| 选项 | 说明 |
| --- | --- |
| Pandoc 路径 | Pandoc 可执行文件路径，留空使用系统 PATH |
| 文件扩展名 | 自动转换的文件扩展名列表，默认 `.docx, .doc, .rtf, .odt, .xlsx, .xls` |
| 删除原文件 | 转换成功后是否删除原始文件，默认关闭 |
| 排除文件夹 | 不参与转换的文件夹路径，逗号分隔 |

## 命令

| 命令 | 说明 |
| --- | --- |
| 批量转换所有未转换的文件 | 扫描仓库并转换所有匹配的文档 |
| 检查 Pandoc 安装 | 验证 Pandoc 是否可用 |

## 注意！！！

很头疼的说，虽然插件支持doc格式，但这个格式是老古董！！！pandoc根本不支持。为了避免用户需要装一个巨大的LibreOffice来转化doc到docx，我偷偷用命令行调用了你电脑上的office或者WPS来转化docx——我测试了我的电脑OK，但是别人的环境不知道，可能有点慢，可能有点不稳定。

**最好你自己打开Office或者WPS,把doc另存为docx，再丢到vault里，这样最保险！**

## 许可

[MIT](../LICENSE)
