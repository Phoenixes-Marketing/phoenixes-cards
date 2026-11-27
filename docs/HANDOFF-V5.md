# 封王卡牌 — V5.0 開發交接
更新：2026-11-27

## 基準與狀態
- V4.0.14 已由使用者實機驗收，指定目前最成功版本；灰底已消失。V5.0.7 已提交 main，正式網站部署及使用者驗收待確認。
- Repo Phoenixes-Marketing/phoenixes-cards，main，核心 index.html。正式網站 https://phoenixes-marketing.github.io/phoenixes-cards/ 。
- 鎖定 commit efbafccca714d4d0353df39bdd9ece03397d2c6d；備份 baseline/v4.0.14-final-ui，不覆寫。完整歷史 docs/HANDOFF-V4.md。

## V5 範圍（使用者指定）
卡牌抽出後的文字、預覽、漂浮感、卡牌跳出動畫、卡面展示效果。具體風格、時序、文字、互動待使用者確認。建議先盤點既有四卡扇形、翻牌、全部揭曉、N/SR 展示、放大預覽與下一包銜接，再逐項設計；不是已批准的新規格。

## 不可任意改動
- V4 滿版舞台、透明橫幅、金紫按鈕（hero-glass-clean-v14.webp）、圖鑑版面與四邊框光、桌面32/手機12光粒、問號40% opacity。
- 開包前卡包高度、滑動回彈及按鈕共用開包流程、魔法陣、金紫能量、雙背景主光流及主開包解析度策略。
- 40張卡、N/SR、每包四張、每輪不重複、現有機率、localStorage phoenixes-portable / phoenixes-round。不可擅改卡池、收藏、增加音效。
- 卡圖 cards/、預覽 card-preview/；既有素材優先。保持手機與桌面體驗及效能。

## 接手流程
1. 讀本文件、HANDOFF-V4.md、main/index.html，核對版本及現有 reveal/preview/scene 相關程式。先做現況盤點，不直接改碼。
2. 與使用者確認 V5.0 第一項設計及完成標準，取得當前提交授權後才修改 GitHub。每次同步 title/footer、commit 與交接紀錄。
3. 分小版本驗收：卡牌出場、文字、漂浮、翻牌/預覽、N/SR 展示及下一包銜接；桌面/手機連續抽卡回歸測試。
4. 不將提交視為部署成功；由使用者實機驗收。FPS 未獨立量測、神殿壓縮與預載未完成，灰底根因未獨立驗證；非 V5 必做項目。

## V5.0.1（待驗收）
- 使用者同意直接更新 main，不另建測試站。修改 commit 23d04b9dd82e1ddc57232b2402451f83c37b36ff；修改前 main 與基準分支 index.html blob 均為 84afb4a80781743fa28e4ccf777a6064ce816760。
- C 方案：垂直抽離、左右螺旋式曲線、右上離場、右側回歸；CSS transform 關鍵影格 2.28 秒，125ms 列隊間隔，由右側位置先定位，依序往左補齊。未翻牌 body 浮動 5px，4.1–5.39 秒，低品質及 reduced motion 停用。
- 未新增粒子、Canvas、素材；保留開包與抽卡邏輯。title/footer 同步 V5.0.1。軌跡為分段 CSS 插值，連續性、卡牌重疊、手機/桌面與 FPS 尚未實機驗證。使用者不滿意可 revert 上述修改 commit，基準分支不覆寫。

## V5.0.2（待驗收）
- 使用者批准直接更新 main。程式 commit 4cd6e358d7a154a35487891db6b90b34009f3563；上一版復原點 23d04b9dd82e1ddc57232b2402451f83c37b36ff。
- 五段切線方向連續的 cubic Bezier，預算 97 個 transform keyframes/卡，WAAPI 播放 2380ms、145ms 間隔；卡頂追蹤切線、角度展開、最後16%轉正，縮放最遠 .42。段間速度仍需實測。
- 未翻牌 body 使用獨立 translate 漂浮，hover transform 上抬15px/1.04倍；低品質與 reduced motion 保留停止漂浮。未增加粒子、Canvas 或逐幀 JS 迴圈。title/footer V5.0.2。部署、FPS、實際視覺及回歸待驗收。

## V5.0.3（待驗收）
- 使用者批准直接更新 main。程式 commit 5c7ea6a32f3e5d3b4da270f1fc7259c8ae0a6c52；上一版復原點 4cd6e358d7a154a35487891db6b90b34009f3563。
- 簡化為右側升空、上方單一大弧、左側回歸；四段 cubic Bezier 預取樣弧長，梯形速度曲線（19%加速、51%巡航、30%減速），81個預算 transform keyframes/卡，1950ms、130ms間隔，由左至右定位。保留切線朝向、最後24%轉正、遠近縮放及 V5.0.2 hover/float。
- 未增加 Canvas、粒子或逐幀 JS；title/footer V5.0.3。正式部署、實際速度、重疊、FPS、手機/桌面回歸待驗收。V4.0.14 基準不覆寫。

## V5.0.4 H（待驗收）
- 使用者批准直接套用 H 模擬至 main。程式 commit b54bc872dd4d2e35e2abdb8538d7141ed37e832d；上一版復原點 5c7ea6a32f3e5d3b4da270f1fc7259c8ae0a6c52。
- 垂直抽離300ms、畫面外轉向140ms、右下單向景深滑翔1200ms、定位回正400ms；每張間隔150ms。初始俯仰46度、側身34度、細微側傾4度、回正1.5度上限。預算 WAAPI transform，無新增逐幀 JS、Canvas 或粒子。
- 保留既有正式扇形定位（9度間距）及 hover，依卡序懸浮3–4.5px、4.1–5.39秒；揭曉前以 CSS 強制隱藏 slot/hero 正面，open 後沿用既有翻牌。未改卡池、收藏及 SR 流程。title/footer V5.0.4。
- 正式舞台尺寸與模擬不同，採響應式座標與既有扇形；不是逐像素移植。實際部署、正面保護、手機/桌面動作、連抽及 FPS 待驗收。基準分支不覆寫。

## V5.0.5–V5.0.7（待驗收）
- 使用者批准三項修改，要求低效能負擔。V5.0.5 commit 66b1166c780a92676dc1aa93b1a23172398adf1f：場外轉向140→450ms，總單卡2350ms，其他飛行參數不變。
- V5.0.6 commit 29938c0efaa3a029077ceb4d0902f4af9b98b82b：按住未揭曉卡橫掃，12px水平門檻，事件式命中與去重佇列，N沿用 reveal，SR清空佇列並進入原揭曉流程；取消/放開/失焦處理，保留單點及全部揭曉。手機 pan-y，待實機驗證。
- V5.0.7 commit 32dabcae23d7284006162803f1583f0fbcb42319：既有兩片封口素材加入進度連動的 CSS 3D 彎折姿態及撕離中間影格；非真正多段網格物理捲曲。保留向上開包、原回彈、能量及素材。未移植 PRISM 程式碼或資產，僅參考概念；未新增常駐迴圈、Canvas、粒子或依賴。
- 各版本獨立 commit，V5.0.4 復原點 b54bc872dd4d2e35e2abdb8538d7141ed37e832d。部署、JS瀏覽器執行、手機/桌面、橫掃SR中斷、連抽、FPS均待驗收；V4基準不覆寫。
