# V5.4 Audio Lab B3｜驗證報告

驗證日期：2026-11-28（Asia/Taipei）

## 基準與保護範圍

- 遠端 `main`：`38f10f07d65b789524034436f13224eb15d68d05`
- 正式站 HTML Git blob：`377b890b38c4e6610eb1adbe941a7108710f484b`
- 成熟版基準分支：`baseline/v5.3.3-final-complete` → `d2f32bfe820d8ba9f9cc205fe60141dc51a8a683`
- `index.html`、`audio-lab/`、`audio-lab-v2.html`、`baseline/` 相對 `origin/main` 無差異。

## Chrome 真實瀏覽器測試

執行：Google Chrome，Playwright 控制；桌機 1366×850、手機觸控模擬 390×844。

- 80 個 SFX 與 10 個 BGM 全部 HTTP 成功、Web Audio 解碼成功。
- 開場、蓄力、能量擴散各有 A–J 十個候選，其餘九項維持 A–E；80 個 SFX SHA-256 全部不同。10 個 BGM SHA-256 也全部不同。
- 使用者暫定設定已成為恢復預設值：總音量 100%、BGM E／70%，其餘逐項數值與 `CURRENT-PRESET.json` 相同。
- 正式頁與 B3 的核心樣式文字雜湊相同，`v5Flight` 函式雜湊相同。
- 正式頁開包：2,982 ms、422 frames、P95 7 ms、最慢 35 ms、慢幀 1。
- B3 指定 N 包：2,981 ms、427 frames、P95 7 ms、最慢 7 ms、慢幀 0。
- 指定 N／SR 在按下後約 400 ms 均仍位於 850 ms 正式蓄力階段，之後走相同開包與卡牌飛行路徑；N 包全部 N，SR 包包含 SR。
- 桌面滑鼠與 Chrome 手機觸控模擬皆拉到中段並停住，蓄力保持循環；放手後方向切換為反向，進度與聲音跟隨 380 ms 回彈降至 0 並停止。指定 N 包自動拉到 100% 後，蓄力停止並正常銜接撕包與能量擴散。
- 開場連續重播兩次成功；文字與黑幕依正式 3.2 秒時序。非 idle 狀態按重播時，面板不關閉並顯示「請先按下一包」。
- BGM 播放、暫停、停止、選曲、音量與匯出設定通過。
- 測試 N／SR 未修改正式收藏、B1 收藏、B2 收藏或 B3 測試收藏。
- 桌機與手機模擬皆無 page error、console error／warning、HTTP 4xx／5xx 或 failed request。

自動化報告與截圖保存在工作目錄旁的 `phoenixes-cards-v5.4-audio-lab-qa-interactive-charge`，不放入公開分支資產。

## 音訊分析

- SFX：80；前端靜音最長 17 ms，尾端靜音最長 60 ms，最高真峰值 -2.1 dBFS。
- BGM：10；新增 F–J 長度 63.8–113.2 秒；解碼後使用 AudioBuffer 循環。
- 完整逐檔數據見 `ANALYSIS.json`。

## 尚未完成或不能取代的驗收

- 尚未由使用者以真人聆聽決定蓄力 A–J 的最終音色；數值與瀏覽器播放成功不能取代主觀聽感。
- 尚未測實體 iPhone／Android、Safari 或藍牙喇叭／耳機延遲；390×844 是 Chrome 觸控模擬，不是手機實機。
- 尚未建立任何公開 B3 hosting，也未修改 GitHub Pages。正式整合、合併與部署都需要使用者另行授權。
