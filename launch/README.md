# 视频与发布素材

- `copy.md`：中文长短文案、英文发布帖及社区讨论引导。
- `storyboard.json`：逐段标题、字幕、配音和图形内容；`endFrame` 是按 30 fps 标注的独占结束帧。所有素材均为合成演示。
- `sidekick-motion.jsx`：ChatCut Motion Graphic 源码。它通过可编辑属性读取分镜 JSON、配色和字体。语音与动效分轨，字幕内嵌在图形中。

重建时将 JSX 导入支持 Remotion Motion Graphics 的 ChatCut Desktop，设置 `scenes` 文本属性为分镜 JSON、`font` 为 `Noto Sans SC`、`accent` 为 `#5de6c4`、`background` 为 `#0c1823`。参考片长 32.10 秒，工程可分别用 1080×1920 或 1920×1080；配音按各段窗口对齐。

本地版无私人实例录屏。公开视频在确认许可及仓库可见性后再发布，仓库链接放视频简介，不把私仓地址做进画面。MP4 与本地项目包不纳入 Git。
