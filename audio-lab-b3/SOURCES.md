# V5.4 Audio Lab B3｜音訊來源與授權

查證日期：2026-11-28。B3 只使用允許公開再散布與修改的 CC0 1.0 素材。各輸出檔的 SHA-256、長度、取樣率、聲道、整體響度、平均音量、真峰值、頻譜中心、音頭與尾端靜音記錄在 [ANALYSIS.json](ANALYSIS.json)。

## 正式來源

| 來源 | 授權 | B3 用途 |
| --- | --- | --- |
| [Kenney Casino Audio](https://kenney.nl/assets/casino-audio) | CC0 1.0 | 卡包薄膜、卡牌飛出、翻面、檢視、下一包 |
| [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 按鈕、SR 揭曉、快速 SR |
| [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 撕開候選、圖鑑翻頁 |
| [Magic Spell SFX／JaggedStone](https://opengameart.org/content/magic-spell-sfx) | CC0 1.0 | 開場、蓄力、SR 蓄力 |
| [Various Paper Sound Effects／Luckius](https://opengameart.org/content/various-paper-sound-effects) | CC0 1.0 | 真實紙張撕裂、翻面 |
| [Card Game Sounds／HaelDB](https://opengameart.org/content/card-game-sounds) | CC0 1.0 | 蓄力、翻面、檢視、下一包 |
| [RPG Sound Pack／artisticdude](https://opengameart.org/content/rpg-sound-pack) | CC0 1.0 | 布料、魔法擴散、氣流、金屬與細珠泛音 |
| [150 Combat Sound Effects／untamedpixels](https://opengameart.org/content/150-combat-sound-effects) | CC0 1.0；封裝內 `LICENSES.txt` 逐來源列出 | 新增 F–J 使用 Healing／Plant／Water／Wind 類魔法候選；未使用爆炸與重擊分類 |
| [Dark Shrine Loop／qubodup、yd](https://opengameart.org/content/dark-shrine-loop) | CC0 1.0 | BGM A |
| [Cathedral in the Forest／congusbongus](https://opengameart.org/content/cathedral-in-the-forest-ambient-loop) | CC0 1.0 | BGM B |
| [Ancient Caverns／congusbongus](https://opengameart.org/content/ancient-caverns-horror-ambient-loop) | CC0 1.0 | BGM C |
| [Loopable Dungeon Ambience／JaggedStone](https://opengameart.org/content/loopable-dungeon-ambience) | CC0 1.0 | BGM D |
| [FREE Music Loop Bundle／Abstraction, Tallbeard Studios](https://tallbeard.itch.io/music-loop-bundle) | CC0 1.0 | BGM E 與新增 F–J |

Kenney 的[官方授權說明](https://kenney.nl/support)確認資產頁素材皆採 CC0，商用及修改均可，標示作者非必要。Tallbeard 素材的 CC0 授權允許本遊戲封裝；作者另表示不希望素材被拿去做 NFT、AI／機器學習或原檔轉售，本分支依其偏好只作遊戲內候選，不作上述用途。

## Freesound CC0 候選

以下原始頁面在 2026-11-28 逐頁重新檢查為 Creative Commons 0；B3 使用既有 B1／B2 已下載的 OGG 複本，再重新剪輯與正規化，沒有依賴外部網站即時播放。

- [Sadiquecat — Broomstick whoosh 3 - Quiet](https://freesound.org/people/Sadiquecat/sounds/816262/)：卡牌飛出 B
- [Halgrimm — swoosh](https://freesound.org/people/Halgrimm/sounds/169867/)：能量擴散 B
- [DylanTheFish — Echo Chromatic Riser](https://freesound.org/people/DylanTheFish/sounds/464250/)：SR 蓄力 B
- [syntheffects — Riser sound effect short](https://freesound.org/people/syntheffects/sounds/685256/)：SR 蓄力 A
- [LegitCheese — Soft Notifications Bell](https://freesound.org/people/LegitCheese/sounds/571513/)：快速 SR E
- [cabled_mess — Triangle open 04](https://freesound.org/people/cabled_mess/sounds/349504/)：SR 揭曉 E
- [Diim_1 — soft rise](https://freesound.org/people/Diim_1/sounds/867126/)：開包蓄力 A
- [CVLTIV8R — air pass](https://freesound.org/people/CVLTIV8R/sounds/810485/)：卡牌飛出 A
- [LilMati — sweep](https://freesound.org/people/LilMati/sounds/702773/)：能量擴散 A

## 處理方式

- SFX：移除超過門檻的前後靜音，目標 -18 LUFS、限制真峰值、Vorbis q5。
- BGM：保留原始循環長度，不裁切頭尾，目標 -24 LUFS、限制真峰值、Vorbis q5；瀏覽器以解碼後的 AudioBuffer 循環。
- 執行時另有總音量、各項音量、速度、延後與動態壓縮器，避免多張卡同時飛出或快速翻牌造成疊音過載。
- 數值分析不等於人耳主觀判斷。此環境已驗證檔案能在 Chrome 的 Web Audio 解碼及播放，但沒有把「可播放」描述成「已由真人聆聽驗收」。

CC0 法律文字：[Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)。封裝內的第三方授權原文保存在 `licenses/`。
