# Video and launch material / 视频与发布素材

English · 中文在下方

- `copy.md`: Chinese long and short copy, an English launch post, and a community discussion prompt.
- `storyboard.json`: per-scene chapter, title, captions, voice-over and graphics; `endFrame` is the exclusive end frame at 30 fps. All material is a synthetic demo.
- `sidekick-motion.jsx`: ChatCut Motion Graphic source. It reads the storyboard JSON, colors and font from editable props. Voice and motion are separate tracks; captions are part of the graphics.

To rebuild, import the JSX into ChatCut Desktop with Remotion Motion Graphics support and set the `scenes` text prop to the storyboard JSON, `font` to `Noto Sans SC`, `accent` to `#5de6c4`, `background` to `#0c1823`. Reference length is 32.10 s; the project works at 1080×1920 or 1920×1080. Align the voice-over to each scene's window.

Show the repository URL `https://github.com/Cznorth/sidekick-open` in the video (the last scene's caption carries it) and in the description. No screen recordings of a private instance. MP4 files and local project bundles are not tracked in Git.

---

- `copy.md`：中文长短文案、英文发布帖及社区讨论引导。
- `storyboard.json`：逐段标题、字幕、配音和图形内容；`endFrame` 是按 30 fps 标注的独占结束帧。所有素材均为合成演示。
- `sidekick-motion.jsx`：ChatCut Motion Graphic 源码。它通过可编辑属性读取分镜 JSON、配色和字体。语音与动效分轨，字幕内嵌在图形中。

重建时将 JSX 导入支持 Remotion Motion Graphics 的 ChatCut Desktop，设置 `scenes` 文本属性为分镜 JSON、`font` 为 `Noto Sans SC`、`accent` 为 `#5de6c4`、`background` 为 `#0c1823`。参考片长 32.10 秒，工程可分别用 1080×1920 或 1920×1080；配音按各段窗口对齐。

仓库地址 `https://github.com/Cznorth/sidekick-open` 要出现在画面里（最后一段字幕带着它）和视频简介里。不录屏私人实例。MP4 与本地项目包不纳入 Git。
