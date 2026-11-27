# 封王卡牌 — V5.0 開發交接
更新：2026-11-27

## 基準與狀態
- V4.0.14 已由使用者實機驗收，指定目前最成功版本；灰底已消失。V5 尚未開始，正式網站仍顯示 V4.0.14。
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
