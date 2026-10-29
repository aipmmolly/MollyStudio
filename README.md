# MollyStudio

本地运行的中文 AI 内容生产工作台：输入选题 → 生成口播稿 → 编辑、保存 → Wordmotion 配音视频 → 预览、下载。

## 启动

下载仓库并进入项目目录后运行（首次使用先执行 `npm ci`）：

```sh
cd MollyStudio
npm start
```

打开 <http://localhost:3210>。开发时可以用 `npm run dev` 自动重启后端；重启会中断正在导出的视频，渲染时建议使用 `npm start`。

现有环境已经具备全部依赖，本次没有新增第三方依赖。Node.js 22 或更新版本、Python 3、`edge-tts`、`ffmpeg`、`ffprobe` 需要能通过 PATH 找到。已有的 Remotion 包及 Chrome Headless Shell 继续复用。重新安装项目时运行 `npm ci`；更换机器后首次渲染可能需要 Remotion 下载浏览器。

## 配置模型

有两种方式：

1. 网页右上角「模型设置」：填写 API 地址、模型 ID 和 API Key。临时 Key 仅保存在页面内存中，刷新后清除。地址和模型 ID 会保存到浏览器。
2. 将 `.env.example` 复制为 `.env`，填写下列内容后重启服务：

```dotenv
PORT=3210
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=qwen/qwen3.5-35b-a3b
LLM_API_KEY=填写你的Key
```

OpenRouter 也支持读取进程环境里的 `OPENROUTER_API_KEY`。服务端 Key 不会返回给网页、写入文稿或进入任务文件；若在网页更换了 API 地址，需同时提供新地址对应的 Key。

支持兼容 `POST /chat/completions` 的服务，API 地址应是带 `/v1` 的根地址，不要填完整的 `/chat/completions` 路径。本地兼容模型可以使用 `http://localhost:端口/v1`。

没有 Key 时，点击「已有文稿？直接粘贴」，写入文字后即可生成视频。视频配音使用 Edge TTS，不需要模型 Key，但仍需要网络。大模型生成同样需要网络和可用额度。

## 已实现

- 4 种中文内容风格、4 个平台、30 / 60 / 90 / 180 秒目标时长。
- 真实模型请求、重新生成、取消、手动编辑、复制。
- 浏览器草稿缓存；显式保存到本机文稿库，可重新打开。
- 真实晓晓女声 / 云希男声配音；正常、稍慢、稍快三档语速。
- Wordmotion 1080×1920、30fps 动态画面、逐句音频及高亮字幕。
- 生成阶段、进度、错误详情、任务取消、任务历史和重启后的中断提示。
- 真实封面、网页视频播放、MP4 和 SRT 下载，支持 Range 请求与拖动进度条。
- 桌面和手机响应式页面。服务仅监听 `127.0.0.1`，无需账号、数据库或云服务部署。

目标时长用于引导模型写作，最终时长取决于实际文稿与配音。发布平台目前只影响写作提示，视频统一为竖版。分镜采用原文短句提取并复用既有动态版式，暂不包含 AI 生图、素材搜索、配乐或复杂时间线编辑。生成的观点和事实仍需创作者审阅。

## 如何复用 Wordmotion

项目根目录就是已有的 Wordmotion 项目。原有 `article.md`、`out/final.mp4` 和示例数据保留。

1. `server/content.mjs` 将任意文稿适配为原引擎的 manifest 和分镜计划。
2. 每次任务在 `.mollystudio/jobs/<id>/` 建立独立工作目录。
3. 在任务工作目录调用**原有** `scripts/generate-audio.mjs`、`scripts/build-data.py`，生成配音及时间轴。
4. `src/Root.tsx` 增加 props 入口与动态时长；原有 `Slide` 和 `Subtitles` 接收新任务数据，默认仍使用旧示例。
5. 本地后端调用现有 Remotion CLI，通过 `--props`、`--public-dir` 指向任务目录。保持原有绝对帧 Sequence 与字幕同步方式。
6. FFprobe 校验视频、音轨和分辨率，FFmpeg 提取真实封面，成功后才提供预览与下载。

原有命令保持可用：

```sh
npm run studio     # 原 Wordmotion 编辑器
npm run render     # 原示例视频 → out/final.mp4
```

文稿保存在 `.mollystudio/drafts/`，生成的配音、分镜、MP4、SRT 和状态保存在 `.mollystudio/jobs/`。这些目录及 `.env` 已加入 Git 忽略。可以使用 `MOLLY_DATA_DIR` 环境变量更改数据目录；自动测试使用独立临时目录。

## 测试

```sh
npm test                 # 内容适配、API 验证、无 Key 提示、跨站限制
npm run typecheck        # 原 Wordmotion 及参数化入口类型检查
npm run test:e2e         # 真实模型 → 保存 → 配音 → MP4 → 下载 → 全片解码
npm run test:manual      # 清除所有模型 Key 后，真实手动文稿导出与取消测试
```

真实端到端测试要求先启动工作台且配置可用模型 Key，会调用模型和 Edge TTS。`test:manual` 会启动自己的临时服务，无需模型 Key，但仍会调用 Edge TTS。测试成片和报告位于 `out/mollystudio/`。

已验证：真实 Qwen 中文口播生成、约 31 秒的 1080×1920 MP4 导出、音轨、SRT、Range 分段读取、下载和 FFmpeg 全片解码；网页内编辑保存后，也导出了约 25 秒的另一支视频。

接口实现参照 [OpenRouter Chat Completions 文档](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion)。OpenRouter 请求关闭可选推理，避免思考消耗全部输出额度。

## 第三方声明

Wordmotion 技能提供的模板及音频脚本使用 MIT 许可，原许可声明见 `THIRD_PARTY_NOTICES.md`。
