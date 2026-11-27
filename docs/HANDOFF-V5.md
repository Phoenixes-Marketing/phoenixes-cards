# 封王卡牌 — V5.0 開發交接
更新：2026-11-28

## 現行穩定基準：V5.2.5 FINAL（使用者實際操作驗收完成）
- 使用者於 2026-11-28 確認 V5.2.5 效果很好，指定為新的穩定基準。後續修改從這版延續；下方較舊版本的基準說明僅為歷史紀錄。
- 保存分支：`baseline/v5.2.5-final`，鎖定程式 commit `7e31ea1e8ef3b4e1b96466c92739aa9a8dab1d44`；`index.html` blob `13c8c497985f6ec483244e0bb7e1584d6fa9e734`。不得覆寫、刪除或移動此分支；舊 `baseline/v5.2.2-final` 亦保留。
- 鎖定已驗收煙霧上升／回拉淡出、圖鑑 650／450ms、卡牌檢視 600／450ms、原有拖曳旋轉速度、最新提示、畫質、美術、抽卡及收藏機制。之後在 main 或新開發分支修改並與本版比對。
- 本次只保存版本及更新交接，網站程式、素材與收藏資料不變。使用者已實際驗收；其裝置及瀏覽器未指定，不擴大宣稱為完整跨裝置驗證。

## 基準與狀態
- V4.0.14 已由使用者實機驗收，指定目前最成功版本；灰底已消失。V5.0.9 已提交 main，正式網站部署及使用者驗收待確認。
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

## V5.0.8（待驗收）
- 使用者確認 V5.0.5 飛入時間差改善；V5.0.6 橫掃未成功且 SR 頻繁中斷，V5.0.7 鋁箔受力不明顯，要求先撤回兩項。以 V5.0.5 index.html 為基礎恢復，保留450ms場外轉向及原開包效果。
- commit c415b0535bfe882f7c339f2c31a69cc0a3117ecf。漂浮選擇器移除 :not(.open)，翻牌前後持續 CSS translate；hover 同樣適用。桌面幅度10–14.5px、依卡寬上限8.5%響應式縮減；週期3.4–4.81秒。低品質幅度5–6.5px、5.6秒；reduced motion 停用，圖鑑開啟暫停。無新增常駐JS或素材。
- title/footer V5.0.8；V5.0.7 復原點 32dabcae23d7284006162803f1583f0fbcb42319。部署、漂浮/翻牌/SR回歸、FPS待實機驗收。V4基準不覆寫。

## V5.0.9（待驗收）
- 使用者確認 V5.0.8 卡牌漂浮效果可接受，回報定位後背景視覺斷差。保留卡牌及開包動畫。
- commit 1c220a04862b507a181f1a4ec2e48ed7aae82058：背景 WebGL 各圖層改用獨立渲染時鐘，暫停時不累積時間，恢復每次最多前進60ms；保留原更新頻率、開包/低品質圖層跳過策略。開包期間活躍圖層相位推進較慢，無新增渲染迴圈或素材。此為程式推定原因，實機斷差及FPS待驗證。
- V5.0.8 復原點 c415b0535bfe882f7c339f2c31a69cc0a3117ecf。

## V5.0.10（已部署正式站）
- 2026-11-27 從遠端 main 的交接 commit 7a77de1dbc1ad72d18d46f20e9e4385b09ab18c2 建立本機復原點 `baseline/v5.0.9-pre-optimization`，未覆寫 V4 基準；工作分支 `codex/v5.0.10-quality-calibration`。
- 程式、測試與初版交接 commit 846a1c6b5cd7667d024eaf35b6233004cba66981；正式 main 最終 commit 5f1c37ae3ab3431a359da5ba1f553e0339cfefd9，後者只補正式站重新整理時可取消背景卡面預載的 QA 判定，不改網站畫面或流程。
- 單卡預覽改依頂部品牌列、SR 標題、底部操作說明、頁尾、安全區與可用 viewport 計算；桌面 N/SR 上限 460/430px，行動裝置另受 78/74vw 限制。保留完整比例、原圖、縮放、平移、雙擊與關閉操作。SR 標題與卡面、品牌列不再重疊，操作說明移至頁尾上方。
- `foil-mask.webp` preload 補上匿名跨來源模式，消除瀏覽器因憑證模式不符而放棄預載的警告。title/footer 同步 V5.0.10。未改四抽、十包、卡池、機率、收藏、localStorage、V4 UI、開包、450ms 場外轉向、卡牌漂浮、背景渲染策略或任何特效素材。
- `tests/pack-opening.cjs` 校正至現行共用開包流程及實際拖曳距離，新增 N/SR 預覽安全區、縮放、首次/重複載入、十包後 DOM/動畫/記憶體回收量測。桌面 1366×850、觸控模擬 390×844、矮螢幕 480×568、低品質 320×568、reduced-motion 及鍵盤流程皆通過；Chrome 158 無 console、HTTP 或請求錯誤。
- 開包前後量測：桌面 p95 7ms、最慢 7ms；390×844 p95 7ms、最慢 14ms，皆 0 個 >34ms 慢幀。十包桌面與觸控模擬皆取得 40 ID／37 款並於刷新後保留收藏；暫態粒子物件歸零、Canvas 固定 9、文件固定 1。垃圾回收後 JS heap：桌面 1.41→3.19MB，刷新並顯示 40 張圖鑑後 1.96MB；手機 1.45→3.22MB，刷新後 1.99MB，未見持續累積證據。
- 有快取的本機伺服器首次載入約 0.8 秒／約 4.57MB 傳輸；同分頁重載約 0.18 秒／19 個資源全數命中快取、資源傳輸 0KB。完整 PNG 1000×1450，預覽未裁切、未拉伸；未用降解析度或隱藏特效換取數據。
- 本機證據位於工作目錄外 `C:\Users\xxian\Documents\ChatGPT\phoenixes-cards-qa-v510-final`；正式站證據位於 `C:\Users\xxian\Documents\ChatGPT\phoenixes-cards-qa-v510-production`。GitHub Pages run 45990124408、deployment 8108543463 成功；正式 title/footer 為 V5.0.10，線上 index blob 與提交一致。正式站桌面／手機模擬／矮螢幕／低品質／reduced-motion／鍵盤及各十包 40 ID／37 款回歸通過，無 console、HTTP 或請求錯誤。手機仍為 Chromium 觸控模擬及 463×574 可視瀏覽器檢查，不代表實體手機或 Safari；使用者實機驗收待確認。

## V5.0.11（待驗收）
- 以 Work 優化後 V5.0.10 blob d31cb865a4fd6e36c0f047ed3994411a864a974d 為基礎。使用者要求 Chat 微調 SR 翻面及一般預覽尺寸斷差。
- commit 442c3e0a70b80dcead8b4ad465d05dbf6f9deb5a：SR蓄力終點由104%改100%，heroTransition等待WAAPI finished後取消，單調無超越緩動，預覽250→300ms，SR返回重新測量浮動卡片位置。保留Work預覽尺寸、縮放、抽卡及其他特效。無新增常駐迴圈。部署與實機驗收待確認。

## V5.0.12（待驗收）
- 使用者確認 SR 揭曉改善，一般預覽仍有尺寸回跳。commit 4612e00580dd6bf160fb30ecb9424fe537e07f8b：一般預覽改固定最終尺寸220ms淡入，延後初始滑鼠透視至實際移動；保留 SR 揭曉、縮放與其他效果。透視為推定原因，實機待確認。V5.0.11 復原點 442c3e0a70b80dcead8b4ad465d05dbf6f9deb5a。

## V5.0.13（待驗收）
- commit d3119f6af94371e6ff9c3fc5e6e66d62779cd8d6。定位到 Work 的 syncPreviewLayout 由 class/message MutationObserver 延後重算，manual() 才填說明造成尺寸變動。改進場前填文字並同步測量，移除該 observer，保留 resize/visualViewport resize；N 不預留隱藏 SR 標題。手機 footer 左側至少24px且考慮安全區，右側至少16px。保留 V5.0.12 固定尺寸淡入及 SR 動畫。實機待確認；V5.0.12 復原點 4612e00580dd6bf160fb30ecb9424fe537e07f8b。

## V5.0.14（待驗收）
- 使用者確認 V5.0.13 預覽改善，2K 全螢幕效能暫不處理。使用者上傳 assets/ui/phoenixes-logo.webp（30268 bytes），要求替換左上文字並將 INTERNAL EDITION 移至右下。
- commit 4518371fa8546428fabec64c3ae3ae60682147ed：Logo 桌面108×48、手機88×44 CSS 容器，contain 等比例，維持按鈕與 header 高度；footer 左版本收藏、右 edition，手機左右至少24px安全邊距。無新增動畫。V5.0.13 復原點 d3119f6af94371e6ff9c3fc5e6e66d62779cd8d6。部署與實機待驗收。

## V5.0 FINAL — 使用者驗收完成
- V5.0.14 為使用者指定的最終穩定基準，保留全部現有開包、飛行、漂浮、預覽、縮放、Logo、footer、收藏與抽卡邏輯。2K 全螢幕輕微卡頓暫不處理；V5.0.10 自動化量測不等同 V5.0.14 實測。
- V5.1 先獨立模擬卡牌材質：厚度、clearcoat、N 霧面、SR 選擇性全息、文字保護；不先改正式動畫或卡池。參考 Lone3m-tech/prism-holo-pack，保留 MIT 署名如採用程式碼，不使用其專有品牌素材。

## V5.1.1（待驗收）
- 使用者實驗台 A：厚度3px、亮膜18%（N為其30%）、SR雷射66%、閃粉0%、雙軸傾斜40°、基準折射161°。保留原圖矩形輪廓，SR遮罩插畫區 x12.2% y18.4% w75.6% h51.8%，縮放時隱藏材質。僅 hero 預覽及共用 SR 大卡揭曉，無新常駐迴圈；四張手牌與抽卡不改。厚度層置於 tilt 後方。使用者要求未來實驗台文字與底色高對比。commit e898f180550ffc66f3a5bf441efc017680d5f10c；正式部署與實機待驗收。復原 baseline/v5.0.14-final。

## V5.1.1 驗收未通過，撤回至 V5.0.14 FINAL
- 使用者回報灰色外框、厚度不隨翻轉、載入頓挫；虹彩可見但整體缺點大於優點。厚度層與混合合成為可能原因，未量測確認。
- 完整還原 baseline/v5.0.14-final 的 index.html，不保留 V5.1.1 材質層或傾斜改動。還原 commit cc364739ef0dd16abb084610938b60da18d2993c。後續改自製輕量特效，先獨立測試；不再套用該開源材質方案。正式部署待使用者驗收。

## V5.1.2（待驗收）
- 從 V5.0.14 FINAL 直接開始，自製 SR 手牌正反面靜態金色 drop-shadow；解除 SR face 裁切，光暈附著圖片，隨既有翻面、飛行、漂浮。低品質單層光暈；不增加外框、厚度、動畫迴圈、粒子。N、hero、抽卡與其他流程不變。保留原有 SR 揭曉環境效果。commit 03a47a6b29439a45c071b01d94225d22d7a13fab；部署、翻面與效能待實機驗收。

## V5.1.3（待驗收）
- 使用者已上傳三個 WebP，Git tree 確認存在。SR 正反 face 附著靜態火焰圖，初始 inset -8%，白金核心 drop-shadow；移除舊 SR 手牌環境動畫，標章於 commit 後顯示並跟隨 body 漂浮，寬40% 高16%卡寬。footer 三欄同字級同色，收藏置中，手機安全邊距。無新動畫迴圈。火焰貼合與素材實際視覺比例、部署及效能待實機驗收。commit 7ceb7372b0b308814f331470f46856ca0c766a70

## V5.1.4（待驗收）
- 使用者確認 v3 四張 AI 美術素材，Git tree 確認 assets/ui/{rarity-n-v3,rarity-sr-v3,n-edge-v3,sr-flame-v3}.webp 存在。N銀紫、SR金紫 face-local 靜態圖，初始貼合比例 N121×117%、SR133×124%，移除舊 drop-shadow；SR漂浮時僅 opacity 2.8s 呼吸，低品質及 reduced-motion 停用，並非真實火焰流動。標章左下角同 CSS 高度15.5%卡寬，無副標；頁尾三欄保留，Cinzel + Noto Serif TC 以 Google Fonts 字元子集非阻塞載入，具本機 fallback。未改開包或抽卡。commit f8c3477c7faea07cecf26e5a82433b16df095cce；貼合、實際字型載入、手機與效能及部署待驗收。回退 V5.1.3 index blob 247f33f899015f9390c217821948594207fece42。

## V5.1.5（待驗收）
- 保留 v3 素材，N外光116×112%、SR126×119%，face::after 固定細光沿原始直角 face；SR 外光 SVG turbulence/displacement scale9、3.6s，僅桌面>800px正常品質、已開包、當前正/反面，低品質/手機/reduced motion不套變形。保留既有明暗動畫。標章高度20%卡寬，左下各外移3%；footer桌面32px、手機28px最低安全邊距。未改抽卡及開包。SVG實際相容性、效能及光框貼合待實機驗收，若頓挫優先移除SVG filter。commit 78128bfc1d085eee765db72b81ca0aae5a6a57c5；回退 V5.1.4 blob e3c5c428f7b2eb343753d45f22110431d1c502f6。

## V5.1.6（待驗收）
- 手牌取消 N/SR 標章；保留內部 rank、抽卡及收藏邏輯，現有 1–19 SR、20–40 N 分組作為視覺類型代理。N 移除不貼合的 WebP，改用 face 精準銀白輪廓；SR 保留外側金紫圖，縮至 inset -7% -9%，固定白金輪廓，SVG scale18/2.8s，高品質桌面才使用，其他品質以 CSS 2.8s 位移伸縮持續動態，reduced motion 停用。圖鑑及預覽稀有度標題未改。外側素材實際貼合、動畫與效能待驗收。commit 594190bd487cb7dec000b3cc22522770a23900bd；回退 V5.1.5 blob 9995d712b1d023c277f59610269ae341431b9912。

## V5.1.7（待驗收）
- 實際檢視 sr-flame-v3.webp 640×928，目視核心直線約 x77–558、y105–854，依此校正外擴 left16%、right17%、top14%、bottom9.9%，非等比例置中。能量移至 face 前景 z4，screen 混合，保留原動態及固定輪廓。素材圓角與直角仍可能有落差，實際混合、貼合及效能待驗收。其他不變。commit d481bc4ad23e48cc5d36cfaec589cb8a3f939717；回退 V5.1.6 blob 4e86ed28e46cf4d41cbb0a96ce8d2c6114024da3。

## V5.1.8（待驗收）
- 使用者要求直接更新正式站，由使用者測試回饋。取消整層 scale/skew，保留 face-local 前置 screen；根據既有素材核心 x77–558、y105–854 計算，定位 left−13.37%、right−14.37%、top−11.12%、bottom−6.59%，核心目標左右內縮2%、上2.2%、下2.8%，固定金線同位置。SVG 單 octave，baseFrequency 2.8s 與 scale 12–17 / 3.7s 無限循環；移除品質等級切斷，所有裝置在非 reduced-motion 且已就定位、未開圖鑑時只對當前人物卡面啟用。飛行中所有輪廓透明、不套 filter，等待現有 opening 的全部 flights finished → zone.spent 後漸入 0.85s（輪廓0.65s）；不改飛行或抽卡流程。原圖內嵌光線仍可能局部扭曲；實際貼合、動畫連續及多卡效能待使用者實測。commit 3f17158264ec297735d222a5f058687c0b80b003；回退 V5.1.7 blob 153e7df17cd9d40dd8908d4e2f8a790e88480e4b。

## V5.1.9（待驗收）
- 使用者確認 V5.1.8 改善，要求人物/魔法陷阱光框左右內縮1%、上下2%；沿用素材核心座標校正前置光圖 left−14.69%、right−15.71%、top−11.46%、bottom−7.48%，固定細光 inset 2% 1%。以柔邊 CSS mask 收斂火焰外擴；SVG stitchTiles/feTile/feOffset 將位移雜訊單方向向上平移一個週期(.25 bbox)，1.85s 線性無限循環，scale .023 bbox，不再來回變頻/變幅。實際瀏覽器無縫程度及效能待驗收。hero manual 就位後 aura-ready 漸入，zoom>1 隱藏並停用 filter，關閉先移除 aura-ready，手牌在預覽遮蔽時不跑 SVG。未改開包、抽卡、收藏、既有頁尾。commit d81d2ebb9fa04e48460f9436532633025b5439b2；回退 V5.1.8 blob 6fd18655cf1a12cc48aecb7f72ee54e5d52bc5ca。

## V5.1.10（待驗收）
- 使用者認可 V5.1.9 整體方向，回報人物光效磨砂感及銀線太細。SVG noise baseFrequency 7/16→3/8，displacement scale .023→.014，保留 stitchTiles、單向1.85s循環及柔邊遮罩；磨砂原因為推測。雙類型固定光框四側 inset .5%；SR 素材依既有目視核心校正 left−15.35%、right−16.37%、top−13.38%、bottom−9.28%。銀線1→2px，提亮白色及冷紫外暈，SR 固定線維持原強度。手牌與 hero 共用；飛行不顯示、就位漸入、zoom>1 隱藏皆保留。未改其他機制。commit 0a40cd22d2c20d6e497fd24678a43ec1e8dce0a1；回退 V5.1.9 blob 003da51a577090e20abc7d90defdb81cccb8c24d。實際質感、貼合、循環及效能待使用者驗收。

## V5.1.11（待驗收）
- 使用者要求固定輪廓上下內縮1%、左右0.3%，銀白與白金核心皆3px，預覽不顯示 SR/N。沿用素材核心 x77–558/y105–854 對應定位，left -15.61%、right -16.65%、top -12.74%、bottom -8.68%。
- 將噪聲位移替換為內嵌32×32週期平滑正弦雙通道 PNG（無額外請求），SVG feImage/feTile/feOffset 單向1.85s循環、GaussianBlur .009/.006、scale .016；目標減少磨砂，實際 SVG 相容性及效果未驗證。保留原圖及遮罩、飛行後漸入、zoom>1隱藏、背景手牌暫停運算。預覽標題 visibility:hidden + aria-hidden，保留原預覽幾何，圖鑑未改。commit 064c8b3aad89e6666f16c0ba341fd64be0881c32；回退 V5.1.10 blob ef60bb6660fdbc6463f5325731fedcb3007f6c2f。

## V5.1.12（待驗收）
- 使用者肯定 V5.1.11 平滑火焰效果。兩類型固定輪廓線 3→2.5px，四角 radius 0→3px，銀白泛光 3/7→4/9px，白金泛光 4/7→5/9px；既有顏色及透明度不變，內縮上下1%、左右0.3%不變。僅修改共用固定輪廓 pseudo-element；原始卡面不裁切、原始火焰素材與波形位移及漸入均不改，預覽仍無稀有度標題。commit 9cf30c65b3ca1024d1744333f32bce7d83659b66；回退 V5.1.11 blob f6848e200aea1346c08cfc7148e31e6c4a1ab8a0。實際視覺及部署待驗收。

## V5.1.13（待驗收）
- 使用者確認 V5.1.12 金框效果差不多定案；只微調魔法/陷阱卡銀框。核心2.5→2px，銀紫 rgba(222,215,239,.65)，內層泛光5px rgba(233,225,255,.48)，外層12px rgba(196,174,255,.52)。金框完整保留，兩類型 inset 1% .3%、radius3px 不變，手牌及預覽共用。無新增素材或動畫。commit 1dfdaf69ee609a46b8b163eb9d524ca99658e231；回退 V5.1.12 blob fa8fdf3ec1adff2f1933983fdcfd70da85ce3e30。實際銀框質感及部署待驗收。

## V5.1.14（待驗收）
- 使用者明確認可 V5.1.13 為截至當時最佳效果，保留為視覺基準：程式 commit 1dfdaf69ee609a46b8b163eb9d524ca99658e231 / blob 279bc9daf9262383846592c20712df1e82114dab。金框及平滑火焰已獲正面回饋，後續不動。銀框維持2px、radius3px、inset 1% .3%，核心改 rgba(242,236,255,.84)、近光3px rgba(249,245,255,.68)、外光12px rgba(194,172,255,.60)，改善灰筆刷感且不新增圖層。金框、動畫、預覽及抽卡機制完全保留。commit e956251d872bd4f589c986a0a3dd4895af6a7065；回退 V5.1.13 blob 如上。後續規劃人物卡展示背景（rays/halo/ribbon），尚未修改。實際銀框與部署待驗收。

## V5.1.15（緊急修正，待實機驗收）
- 使用者回報 V5.1.14 預覽轉動嚴重卡頓、返回手牌顯示背面。可能原因為 SVG filter/混合與雙面 3D 合成衝突，未獨立重現。settleHandFace 於 commit/summon 回程固定 open+revealed-flat；已揭曉 slot 直接顯示前面、隱藏背面，不再使用 180° 雙面合成；preview/manual 同樣固定 preview-flat，保留外層 tilt；preview finally 依 seen 恢復正面。close 清除待執行 RAF/光效計時；修正被註解吞掉的 resize listener。
- 保留 v3 紋理/輪廓與漸入，前景 aura 改正常 alpha 混合；高品質桌面已就定位才跑 SVG 波形，預覽操作期間暫停位移 280ms，手牌在預覽中暫停漂浮與 filter；手機/低中品質使用靜態紋理、手機停用舊 preview sweep/spectrum/metal，取捨流動動畫以保操作穩定。未量測 FPS。手機 header 68px/footer 42px、頁尾左右38px（窄機30px）與 safe area、按鈕/Logo垂直置中，操作按鈕上移避免 footer，保留字體及抽卡邏輯。commit d4233c0b6a8a9495aa57b18ad0c27309e2f44dce；回退 V5.1.14 blob a274024a4cf6e768190b841555915555510dffc2。手機 Safari 與桌面實際正面恢復、旋轉、畫質和部署均待驗收，V5.2 暫停。

## V5.1.16（待驗收）
- 使用者確認 V5.1.15 手機預覽卡頓/返回卡背問題與上下欄均已改善，接受手機靜態光效。新回報：手機 N 翻牌先看到背面翻轉再瞬間換正面。推測原本 ordinary 雙面3D 到 commit 固定正面的銜接與瀏覽器合成有關，未獨立重現。
- 僅修改 ordinary：coarse/no-hover/<=600px 使用單平面兩段 WAAPI scaleX 1→.025，於最窄時明確隱藏背面顯示正面，再 .025→1；45/55%分段保留總時長550/320ms，完成後 commit 固定正面，異常 fallback 亦 commit；reduced-motion 直接正面。桌面原翻面、SR、光框、手機 UI、機率與收藏不變。commit 00a3fc4287de29cec9d0987e25a78dc1de647800；回退 V5.1.15 blob b9ee77ee2d29e4784b6129301be6e4a728971a6f。手機單張/全部揭曉及返回預覽待實機驗收。

## V5.1.17（待驗收）
- 使用者確認 V5.1.16 暫無重大問題，作為穩定基準（commit 00a3fc4287de29cec9d0987e25a78dc1de647800 / blob 43596a7301d29a11abc2c0c1c53a89db1e34176b）。回報預覽鏡面反光消失或溢出。程式確認 face overflow visible、舊 spectrum/metal inset−70%，且 V5.1.15 interaction/mobile 停用舊材質。
- 僅 preview card(c,true) 換為獨立 card-reflection 裁切容器（inset0/overflow hidden/z2），單層銀白或暖白線性漸層，沿既有 track RAF 的 --fx/fy/fr 移動、tracking 時淡入 .62、停止追蹤淡出；不使用 mix-blend、SVG filter 或自動 sweep，不加動畫迴圈。手機/桌面皆可用，zoom>1 隱藏，外側光框不裁切。保留單面修正、手機 N 翻面、光效效能策略、UI 及抽卡收藏；V5.2 背景尚未修改。commit dfaab1e095514342e46550737d73002fe34c889e；回退 V5.1.16 blob 如上。反光質感、實機裁切及效能待驗收。

## V5.1.18（品質模式一致性，待驗收）
- 使用者已接受 V5.1.17 鏡面反光；回報品質降低後背景跳動、人物光框疑似回舊版。確認現有品質 CSS 隱藏 pv-c/stars/near mist，低品質 WebGL 跳過後續圖層，SR SVG 僅高品質啟用；無法確認舊火焰動畫實際復現。
- 統一所有品質使用 V5.1.17 已核可的 v3 靜態 alpha 金紫紋理與固定輪廓，移除即時位移 SVG/選擇器及互動計時，明確停用歷史 SR body/label 動畫。桌面也暫停火焰流動，保留外觀、漸入、浮動及鏡面反光。背景全部品質同一圖層構圖，停止歷史 CSS 光流動畫；WebGL 保留 drawing buffer，正常/中/低 60/90/130ms，開包次要層保留最後畫面，層時鐘連續；個別 context lost 使用同張靜態紋理而不切換整組，非正常 GPU context loss 仍可能出現畫面差異。低品質保持原浮動振幅/週期，回升判斷6→18秒；保留粒子數降級。未改抽卡/收藏、手機翻面、預覽或 V5.2 背景。commit 6adb986ae49fe16032c8f2b626bfcb14fa95a8ca；回退 V5.1.17 blob b59592363315594b3b6dd6399e9b36787854e5f5。實際強制各品質、GPU context loss、效能/視覺待驗收。

## V5.2.0（檢視背景，待驗收）
- 使用者確認簡約方案：原場景72%暗化、靜態聚焦光暈（人物金紫/魔陷銀紫），停用舊放射線、虛線圓環、ribbon/motes；不新增背景或濾鏡。人物揭曉不再切換 srworld，保留既有進出場時間及 burst。預覽尺寸/位置、金銀框、鏡面反光、單面修正及手機N翻面保留。光塵在 view-ready 才啟用，24/12桌面、12/8手機，高/中/低僅調數量，沿卡片周圍漂浮、少量柔光點；zoom>1 或關閉時停止，reduced motion 隱藏。WebGL 檢視期間停止、保留最後幀，scene class observer 恢復；圖鑑背景 CSS 動畫亦暫停。無新素材或動畫 JS 迴圈。五段 script 語法檢查通過；實機視覺、粒子分布、效能與部署待驗收。commit 6aded88a9e0dede7a0f89c17868f06f88ff31b40；回退 V5.1.18 blob debd861399e9b5e68f649625bf6a7b45e76b3317。

## V5.2.1（待驗收）
- 使用者回報光塵不明顯、圖鑑未解鎖格遮蔽背景。檢視光塵桌面40/24、手機24/16（人物/魔陷），中28/18、低16/10（手機取較低上限）；週期4.5–7.9s、位移60px、提高核心可見度與粒徑。圖鑑既有32粒改輕量單向漂浮、手機/中上限24、低16，預覽/隱藏分頁暫停、reduced motion靜態。圖鑑 grid底色 alpha .22、未解鎖 tile底色 .08、細框 .23、問號 .43；已解鎖卡片不改。保留V5.2.0暗化、聚焦、金銀框、反光、翻面、收藏與效能一致性。五段script語法通過，實機質感及效能待驗收。commit 3733597f5b10f9d51d526bfdbb09a18b0f9f879a；回退V5.2.0 blob 2d0b490fef0ce4812b01c1e0957b149bcec13352。

## V5.2.2（全站粒子風格統一，已驗收）
- 共用 particleShape/Size/Markup、CSS unifiedDust522 與快取 Canvas sprite；細星塵75%、尖星芒20%、柔光5%，4–5px光點/6px星芒/7px柔光含光暈，金白/銀紫，漂浮3.4–5.32s、向上108–168px含起點，約20–49px/s；預覽每四顆一顆低亮度跨過卡面。高品質桌面待機40、手牌48、人物60、魔陷40、圖鑑60；手機24/28/36/24/36；中低品質降低顆數。CSS粒子預建重用，Canvas使用快取小圖、不新增迴圈；開包爆發/聚能保留既有物理與節奏，只統一粒子形態並縮小尺寸。圖鑑、預覽、手牌等互斥或暫停非當前動態；保留既有背景貼圖內星光（非獨立粒子）、金銀框、反光、翻面與收藏。五段script語法通過，未實測FPS、手機卡頓、粒子實際密度與效果。commit a5a9b151a0f74aa016d873c17048f2b5e741434b；回退 V5.2.1 blob 0172db2c61e24b1dee70bebb06c3f77e5d0a47dc。

- V5.2.2 最終微修：修正粒子形態索引，20 顆完整週期確為細塵15、星芒4、柔光1；最終程式 commit d531da4f1675ceeac516d8a61dc51c483a7ddff5 / blob 4079053a593215ce1fe816167a9417f20993df48；五段 script 語法通過。

## V5.2.2 FINAL｜正式完成版（2026-11-27，使用者已驗收）
- 使用者明確確認本版為目前最完整、最佳效果版本，後續所有開發以此為基準，不回到早期版本重做。
- 正式網站：https://phoenixes-marketing.github.io/phoenixes-cards/ 。已確認 GitHub Pages workflow 46019689965 success（部署 commit 02a44616cd35ae407a862c141af5cc290a249f32）。最終程式 commit d531da4f1675ceeac516d8a61dc51c483a7ddff5；index.html blob 4079053a593215ce1fe816167a9417f20993df48。
- 完成版保存分支：baseline/v5.2.2-final。後續只在 main 或新開發分支修改，不覆寫、刪除或移動此基準分支。回歸測試應以此版比對，任何風格或功能大幅變更須先確認。
- 鎖定成果：金紫宇宙舞台及開包演出、卡片漂浮及翻面、人物/魔陷金銀光框、鏡面反光、手機單面翻牌及返回修正、檢視半透明背景與聚焦光暈、圖鑑透明未解鎖卡格、全站共用星塵/星芒/柔光粒子、效能模式一致性、既有抽卡與收藏機制及手機介面。不要恢復舊 SVG 即時火焰變形或歷史降級美術。
- 驗收依據：使用者實際檢視後明確接受；未取得量化 FPS 或完整跨裝置回歸報告，不宣稱已通過所有測試。此記錄不修改 index.html、素材或正式頁面版本。

## V5.2.5（2026-11-28 煙霧回拉與過場節奏）
- 使用者授權測試通過直接發布。WebGL 煙霧高度與透明度分離，回拉保持既有高度並上移淡出，取消後停止，重新上拉可喚醒；沿用現有紋理。圖鑑開／關 650／450ms，預覽開／關 600／450ms。拖曳旋轉縮放速度、抽卡及收藏不變。
- 操作提示與無障礙名稱移除三分之一說明，提示為「左右旋轉 · 向上滑動或點擊開包」。新增桌面／手機模擬煙霧回拉測試，驗證高度不縮、透明度下降、上移、取消清理及收藏不變。實體 Safari 尚未驗證；回退前版 `3a9945d`，基準分支不動。

## V5.2.4（2026-11-28 過場節奏微調）
- 使用者授權測試通過後直接發布。圖鑑開啟 400ms、關閉 300ms，卡牌檢視開啟 380ms、返回 280ms；同步離場計時，保留輸入隔離。reduced-motion 不播放這些過場。拖曳、旋轉、縮放、開包與收藏邏輯不變；回退前版為 `1a89ecb`，V5.2.2 FINAL 保存分支不動。

## V5.2.3（最終品質版，2026-11-28 已正式部署）
- 2026-11-28 從遠端 `main` 建立本機分支 `codex/v5.2.3-final-quality`；建立時 `main` 與 `baseline/v5.2.2-final` 都是 commit `97bc9f6b9057752e79a60c3e9bbf0bc80fa7401d`，`index.html` blob 均為 `4079053a593215ce1fe816167a9417f20993df48`。未覆寫、移動或刪除 V5.2.2 FINAL 保存分支。
- 畫質精修：高品質模式的 WebGL flow 提高至最高 1024×512、mist 最高 1024×384，2K 開包光線 1280×720、卡包出口火花最高 1920×1080、印記粒子最高約 1440px；Power-of-two 紋理啟用 mipmap，並在視窗尺寸變更時重算畫布。中低品質仍使用相同最新美術，只調整解析度與更新頻率，未恢復舊 SVG 火焰、舊光流或舊 SR 特效。
- 互動精修：圖鑑開關採 200ms 淡入淡出與 6–8px 緩動，卡牌檢視返回採 180ms 淡出；`prefers-reduced-motion` 直接完成。卡牌檢視開啟期間預先建立 tilt／鏡面反光合成圖層，避免第一次滑動才建立圖層造成單幀停頓；卡包僅拖曳期間提示合成。完整卡面先完成 decode 再進入檢視，沒有降低卡面解析度。
- 版面精修：viewport 加入 `viewport-fit=cover`；header、footer、圖鑑返回區補齊 safe-area 邊距。Logo、收藏按鈕、頁尾三欄、卡包、四張手牌、預覽與圖鑑維持 V5.2.2 的已驗收比例，未改卡面、Logo、粒子外觀、背景或玩法。
- 自動化證據（本機 Chrome 158.0.8127.38；全部是 Chromium 模擬，不代表實體 iPhone/Safari）：1920×1080、2560×1440、720×900、390×844 直式觸控、844×390 橫式觸控五種畫面通過。最終五畫面開包 p95 均 7ms、最差 7–28ms、慢幀 0；卡牌檢視 p95 7.1ms、最差 7.1–7.5ms、慢幀 0。桌面 1080p 修正前可重現單一 62.5–83.3ms 慢幀，修正後連續兩次針對性重測最差 7.2ms／13.9ms、慢幀 0。
- 操作回歸：桌面滑鼠傾斜、手機雙指縮放、touchcancel 指標清空、返回維持正面、圖鑑開關、下一包、動態視窗高度及 reduced-motion 均通過；手機 pinch 測得 zoom 2.333、取消後 pointers 0、drag false。所有版面截圖均無卡片、按鈕或頁尾裁切。
- 資源與生命週期：2K 開包後主要畫布為 flow 1024×512、mist 1024×384、opening rays 1280×720、mouth sparks 1920×1080、sigil 1440×219。桌面連續 8 次卡牌檢視＋圖鑑開關，listener 維持 131、canvas 維持 9、暫態粒子回到 0，強制回收後 JS heap 2.95→3.05MB；沒有 console、HTTP 或失敗請求。
- 十包隔離測試：桌面與手機模擬皆抽滿 10 包、40 個 ID／37 個名稱，重新整理後仍保存 40 張；桌面 heap 1.69→3.30→2.03MB，手機 1.73→3.34→2.28MB，canvas 皆維持 9、暫態物件 0，無網路或主控台錯誤。測試只使用隔離瀏覽器內容，未清除或改動使用者收藏。
- 正式部署：使用者於 2026-11-28 明確授權發布，程式 commit `cff112bd3ef3c962b6ceab7efe8d3d1a1845b6df` 已推送 `main`。GitHub Pages workflow `46031883563` 與 deployment `8114388611` 成功；正式 HTML blob `f7f0c9fe44bc26243f0645cab3ab46a69a7b6074` 與該提交完全一致。正式站桌面 1366×850 與手機觸控模擬 390×844 操作回歸通過，開包 p95 7ms、最差 28ms、慢幀 0，無 console、HTTP 或失敗請求。
- 未驗證：實體 iPhone Safari、其他實體手機／GPU及長時間背景分頁。回退應在最新 `main` 對 V5.2.3 提交使用 `git revert` 並正常推送；`baseline/v5.2.2-final` 保持原位不動。
