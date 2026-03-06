# Updated Footer

在 Typora 编辑区底部显示“最后更新于”时间，优先保证稳定，不修改正文和 front matter。

## 新增内容

- 新增独立插件 `Updated Footer`
- 页脚显示最后更新时间：`YYYY/M/D HH:mm:ss`
- 保存时立即刷新时间，再异步用文件真实修改时间（mtime）校准
- 切换文件后自动恢复显示，避免页脚丢失

## 安装

将目录 `typora-community-plugin.updated-footer` 放入：

- macOS: `~/Library/Application Support/abnerworks.Typora/plugins/plugins/`

重启 Typora 后在“已安装插件”中启用 `Updated Footer`。

## 打包文件

仓库 Release 中提供 `plugin.zip`，可直接用于插件市场安装。
