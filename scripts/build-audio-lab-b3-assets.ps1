param(
  [string]$SourceRoot = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'phoenixes-audio-sources'),
  [string]$Ffmpeg = '',
  [switch]$RebuildExisting
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$Ffmpeg = if ($Ffmpeg) { $Ffmpeg } else { (Get-ChildItem -LiteralPath (Join-Path $SourceRoot 'tools\ffmpeg') -Filter ffmpeg.exe -Recurse | Select-Object -First 1).FullName }
if (!$Ffmpeg -or !(Test-Path -LiteralPath $Ffmpeg)) { throw 'ffmpeg not found; pass -Ffmpeg with the executable path' }
$out = Join-Path $repo 'audio-lab-b3'
$sfxOut = Join-Path $out 'sfx'
$bgmOut = Join-Path $out 'bgm'
New-Item -ItemType Directory -Force -Path $sfxOut,$bgmOut | Out-Null

$kenney = Join-Path $SourceRoot 'open-game-sfx-index\audio'
$oga = Join-Path $SourceRoot 'oga'
$oldLab = Join-Path $repo 'audio-lab\sfx'
$ambient = Join-Path $SourceRoot 'moonshard-warden-public\src\assets\ambient'
$combat = Join-Path $oga 'combat150\04_magic_spells'

$items = @(
  @{cue='intro'; n='a'; src=Join-Path $oga 'magical-1.ogg'},
  @{cue='intro'; n='b'; src=Join-Path $oga 'magical-2.ogg'},
  @{cue='intro'; n='c'; src=Join-Path $oga 'magical-3.ogg'},
  @{cue='intro'; n='d'; src=Join-Path $oga 'magical-4.ogg'},
  @{cue='intro'; n='e'; src=Join-Path $oga 'magical-5.ogg'},
  @{cue='intro'; n='f'; src=Join-Path $combat 'Healing Spell Impact 1_s08.wav'},
  @{cue='intro'; n='g'; src=Join-Path $combat 'Plant Spell Impact 4_s07.wav'},
  @{cue='intro'; n='h'; src=Join-Path $combat 'Water Spell Impact 3_s06.wav'},
  @{cue='intro'; n='i'; src=Join-Path $combat 'Wind Spell Impact 1_s07.wav'},
  @{cue='intro'; n='j'; src=Join-Path $combat 'Healing Spell Impact 6_s08.wav'},

  @{cue='click'; n='a'; src=Join-Path $kenney 'interface-sounds\select_002.ogg'},
  @{cue='click'; n='b'; src=Join-Path $kenney 'interface-sounds\click_001.ogg'},
  @{cue='click'; n='c'; src=Join-Path $kenney 'interface-sounds\tick_002.ogg'},
  @{cue='click'; n='d'; src=Join-Path $kenney 'interface-sounds\pluck_001.ogg'},
  @{cue='click'; n='e'; src=Join-Path $kenney 'interface-sounds\switch_003.ogg'},

  @{cue='charge'; n='a'; src=Join-Path $oldLab 'soft-rise.ogg'},
  @{cue='charge'; n='b'; src=Join-Path $kenney 'interface-sounds\open_003.ogg'},
  @{cue='charge'; n='c'; src=Join-Path $oga 'magical-6.ogg'},
  @{cue='charge'; n='d'; src=Join-Path $combat 'Healing Spell Impact 3_s08.wav'},
  @{cue='charge'; n='e'; src=Join-Path $combat 'Plant Spell Impact 1_s07.wav'},
  @{cue='charge'; n='f'; src=Join-Path $combat 'Healing Spell Impact 2_s08.wav'},
  @{cue='charge'; n='g'; src=Join-Path $combat 'Plant Spell Impact 2_s07.wav'},
  @{cue='charge'; n='h'; src=Join-Path $combat 'Water Spell Impact 2_s06.wav'},
  @{cue='charge'; n='i'; src=Join-Path $combat 'Wind Spell Impact 2_s07.wav'},
  @{cue='charge'; n='j'; src=Join-Path $combat 'Healing Spell Impact 14_s08.wav'},

  @{cue='tear'; n='a'; src=Join-Path $oga 'paper\WAV\Paper Ripped - 1.wav'},
  @{cue='tear'; n='b'; src=Join-Path $kenney 'casino-audio\cards-pack-open-1.ogg'},
  @{cue='tear'; n='c'; src=Join-Path $kenney 'casino-audio\cards-pack-open-2.ogg'},
  @{cue='tear'; n='d'; src=Join-Path $kenney 'rpg-audio\knifeSlice.ogg'},
  @{cue='tear'; n='e'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\inventory\cloth.wav'},

  @{cue='burst'; n='a'; src=Join-Path $oldLab 'sweep.ogg'},
  @{cue='burst'; n='b'; src=Join-Path $oldLab 'swoosh.ogg'},
  @{cue='burst'; n='c'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\battle\magic1.wav'},
  @{cue='burst'; n='d'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\battle\spell.wav'},
  @{cue='burst'; n='e'; src=Join-Path $combat 'Wind Spell Impact 3_s07.wav'},
  @{cue='burst'; n='f'; src=Join-Path $combat 'Healing Spell Impact 5_s08.wav'},
  @{cue='burst'; n='g'; src=Join-Path $combat 'Plant Spell Impact 5_s07.wav'},
  @{cue='burst'; n='h'; src=Join-Path $combat 'Water Spell Impact 5_s06.wav'},
  @{cue='burst'; n='i'; src=Join-Path $combat 'Wind Spell Impact 5_s07.wav'},
  @{cue='burst'; n='j'; src=Join-Path $combat 'Healing Spell Impact 15_s08.wav'},

  @{cue='fly'; n='a'; src=Join-Path $oldLab 'air-pass.ogg'},
  @{cue='fly'; n='b'; src=Join-Path $oldLab 'quiet-whoosh.ogg'},
  @{cue='fly'; n='c'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\battle\swing.wav'},
  @{cue='fly'; n='d'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\battle\swing2.wav'},
  @{cue='fly'; n='e'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\battle\swing3.wav'},

  @{cue='flip'; n='a'; src=Join-Path $kenney 'casino-audio\card-slide-2.ogg'},
  @{cue='flip'; n='b'; src=Join-Path $kenney 'casino-audio\card-place-2.ogg'},
  @{cue='flip'; n='c'; src=Join-Path $oga 'paper\WAV\Paper Sound - 1.wav'},
  @{cue='flip'; n='d'; src=Join-Path $oga 'cards\cockatrice\draw.wav'},
  @{cue='flip'; n='e'; src=Join-Path $oga 'cards\cockatrice\tap.wav'},

  @{cue='srcharge'; n='a'; src=Join-Path $oldLab 'riser.ogg'},
  @{cue='srcharge'; n='b'; src=Join-Path $oldLab 'echo.ogg'},
  @{cue='srcharge'; n='c'; src=Join-Path $combat 'Healing Spell Impact 11_s08.wav'},
  @{cue='srcharge'; n='d'; src=Join-Path $combat 'Wind Spell Impact 4_s07.wav'},
  @{cue='srcharge'; n='e'; src=Join-Path $oga 'magical-7.ogg'},

  @{cue='sr'; n='a'; src=Join-Path $kenney 'interface-sounds\confirmation_002.ogg'},
  @{cue='sr'; n='b'; src=Join-Path $kenney 'interface-sounds\glass_004.ogg'},
  @{cue='sr'; n='c'; src=Join-Path $kenney 'interface-sounds\question_001.ogg'},
  @{cue='sr'; n='d'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\inventory\metal-ringing.wav'},
  @{cue='sr'; n='e'; src=Join-Path $oldLab 'triangle.ogg'},

  @{cue='srfast'; n='a'; src=Join-Path $kenney 'interface-sounds\glass_001.ogg'},
  @{cue='srfast'; n='b'; src=Join-Path $kenney 'interface-sounds\pluck_002.ogg'},
  @{cue='srfast'; n='c'; src=Join-Path $kenney 'interface-sounds\confirmation_001.ogg'},
  @{cue='srfast'; n='d'; src=Join-Path $kenney 'oga-rpg-pack\RPG Sound Pack\inventory\beads.wav'},
  @{cue='srfast'; n='e'; src=Join-Path $oldLab 'bell.ogg'},

  @{cue='inspect'; n='a'; src=Join-Path $kenney 'casino-audio\card-shove-2.ogg'},
  @{cue='inspect'; n='b'; src=Join-Path $kenney 'casino-audio\card-slide-5.ogg'},
  @{cue='inspect'; n='c'; src=Join-Path $kenney 'casino-audio\cards-pack-take-out-1.ogg'},
  @{cue='inspect'; n='d'; src=Join-Path $oga 'cards\cockatrice\playcard.wav'},
  @{cue='inspect'; n='e'; src=Join-Path $kenney 'interface-sounds\scroll_003.ogg'},

  @{cue='book'; n='a'; src=Join-Path $kenney 'rpg-audio\bookOpen.ogg'},
  @{cue='book'; n='b'; src=Join-Path $kenney 'rpg-audio\bookClose.ogg'},
  @{cue='book'; n='c'; src=Join-Path $kenney 'rpg-audio\bookFlip1.ogg'},
  @{cue='book'; n='d'; src=Join-Path $kenney 'rpg-audio\bookFlip2.ogg'},
  @{cue='book'; n='e'; src=Join-Path $kenney 'rpg-audio\bookFlip3.ogg'},

  @{cue='next'; n='a'; src=Join-Path $kenney 'casino-audio\card-fan-1.ogg'},
  @{cue='next'; n='b'; src=Join-Path $kenney 'casino-audio\card-fan-2.ogg'},
  @{cue='next'; n='c'; src=Join-Path $kenney 'casino-audio\card-shuffle.ogg'},
  @{cue='next'; n='d'; src=Join-Path $kenney 'casino-audio\cards-pack-take-out-2.ogg'},
  @{cue='next'; n='e'; src=Join-Path $oga 'cards\cockatrice\shuffle.wav'}
)

if ($items.Count -ne 80) { throw "Expected 80 SFX candidates, got $($items.Count)" }
if (($items | ForEach-Object { "$($_.cue)-$($_.n)" } | Sort-Object -Unique).Count -ne 80) { throw 'Duplicate SFX output id' }

$sfxFilter = 'silenceremove=start_periods=1:start_silence=0.015:start_threshold=-55dB:stop_periods=-1:stop_silence=0.045:stop_threshold=-55dB,loudnorm=I=-18:TP=-2:LRA=11,alimiter=limit=0.75:level=false'
foreach ($item in $items) {
  if (!(Test-Path -LiteralPath $item.src)) { throw "Missing source: $($item.src)" }
  $dest = Join-Path $sfxOut "$($item.cue)-$($item.n).ogg"
  if (!$RebuildExisting -and (Test-Path -LiteralPath $dest)) { continue }
  & $Ffmpeg -hide_banner -loglevel error -y -i $item.src -vn -af $sfxFilter -c:a libvorbis -q:a 5 $dest
  if ($LASTEXITCODE) { throw "ffmpeg failed: $($item.cue)-$($item.n)" }
}

$bgm = @(
  @{n='a'; src=Join-Path $ambient 'oga-dark-shrine.ogg'},
  @{n='b'; src=Join-Path $ambient 'oga-cathedral-forest.ogg'},
  @{n='c'; src=Join-Path $ambient 'oga-caverns.ogg'},
  @{n='d'; src=Join-Path $ambient 'oga-dungeon-ambience.ogg'},
  @{n='e'; src=Join-Path $ambient 'ludum-dare-38-10.ogg'},
  @{n='f'; src=Join-Path $ambient 'ludum-dare-30-02.ogg'},
  @{n='g'; src=Join-Path $ambient 'ludum-dare-30-03.ogg'},
  @{n='h'; src=Join-Path $ambient 'ludum-dare-32-05.ogg'},
  @{n='i'; src=Join-Path $ambient 'ludum-dare-38-08.ogg'},
  @{n='j'; src=Join-Path $ambient 'patreon-challenge-04.ogg'}
)
$bgmFilter = 'loudnorm=I=-24:TP=-2:LRA=11,alimiter=limit=0.794:level=false'
foreach ($item in $bgm) {
  if (!(Test-Path -LiteralPath $item.src)) { throw "Missing source: $($item.src)" }
  $dest = Join-Path $bgmOut "bgm-$($item.n).ogg"
  if (!$RebuildExisting -and (Test-Path -LiteralPath $dest)) { continue }
  & $Ffmpeg -hide_banner -loglevel error -y -i $item.src -vn -af $bgmFilter -c:a libvorbis -q:a 5 $dest
  if ($LASTEXITCODE) { throw "ffmpeg failed: bgm-$($item.n)" }
}

Write-Output "Built $($items.Count) SFX candidates and $($bgm.Count) BGM candidates in $out"
