# V5.4 Audio Lab B3

## 安全邊界

- 基礎：遠端 `main` commit `38f10f07d65b789524034436f13224eb15d68d05`。
- 正式 `index.html` Git blob：`377b890b38c4e6610eb1adbe941a7108710f484b`；2026-11-28 重新下載正式站後相同。
- B3 頁面由 `scripts/build-audio-lab-b3.cjs` 從該正式 blob 產生；來源 blob 不符時會直接拒絕建立。
- B3 使用 `phoenixes-audio-lab-b3-portable`、`phoenixes-audio-lab-b3-round`、`phoenixes-audio-lab-b3-settings-v1`，不讀寫正式收藏或 B1／B2 設定。
- 本分支不修改 `index.html`、`audio-lab/`、`audio-lab-v2.html`、`baseline/v5.3.3-final-complete`。

## 視覺與測試流程

- 保留正式 V5.3.4 的 HTML、CSS、素材、`v5Flight` 2350 ms 卡牌飛行、850 ms 按鈕蓄力、翻面與 SR 流程。
- B3 的 N／SR 指定測試只在下一包抽卡池切換 `normal`／`sr`；仍呼叫 `buttonOpening()`，經過 850 ms 正式蓄力，再進入 `opening(..., true)`，不再直接呼叫 `opening(mode)`。
- 開場重播依正式 V5.3.4 時序：文字 400 ms 淡入、停留、1400–2000 ms 淡出；2050–3050 ms 黑幕淡出；3200 ms 回到主畫面。狀態不安全時面板保持開啟並顯示原因。

## 音訊功能

- 13 項音效 × A–E 五款，共 65 個獨立輸出檔；另有 5 款可循環 BGM／環境配樂。
- 每項可獨立啟閉、切換並試聽、調整音量、延後 0–1000 ms、速度 0.70–1.35。
- BGM 有獨立開關、選曲、音量、播放／繼續、暫停、停止並回到開頭。
- 設定自動保存，可顯示並複製 JSON 匯出。
- 分頁隱藏時停止 SFX、暫停 BGM；回到分頁後只恢復原本正在播放的 BGM。相同事件限制重疊聲部，總線另有動態壓縮器。
- 瀏覽器 autoplay 規則仍要求首次由使用者點擊「啟用／恢復音訊」。首次自動開場可能無聲；啟用後按「重播開場」可完整同步觀看與聆聽候選。

## 本機試玩

在 repo 根目錄啟動任何靜態伺服器，開啟 `/audio-lab-b3.html`。不要用 `file://`，否則瀏覽器可能阻擋音訊載入。
