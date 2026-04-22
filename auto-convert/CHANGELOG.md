# 更新历史

## 1.3.0

- 新增 `.doc`（Word 97-2003）格式支持：通过 PowerShell 调用本机 Word/WPS COM 接口，将 `.doc` 转为 `.docx` 后再走 pandoc 流程
- 新增 `.docx` 文件格式检测：自动识别实际为旧版 `.doc` 格式但被命名为 `.docx` 的文件，走相同的 COM 转换流程
- 新增 `convertDocViaCOM` 方法：依次尝试 `Word.Application` → `KWps.Application` → `WPS.Application`，兼容微软 Office 和金山 WPS
- 临时转换文件使用 `__conv_temp__` 标记，`handleNewFile` 和 `batchConvert` 均跳过此类文件，避免竞争条件
- Word/WPS 未安装时给出明确的中文提示，而非 pandoc 的原始错误信息
