# 全量验证脚本: 结构校验 + 代码编译运行
# 用法: powershell -ExecutionPolicy Bypass -File scripts\qa_all.ps1
$ErrorActionPreference = 'Continue'
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUTF8 = '1'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host "=== 1) 章节结构校验 ==="
python scripts\validate_chapters.py
if ($LASTEXITCODE -ne 0) { Write-Host "结构校验存在错误!" -ForegroundColor Red }

Write-Host ""
Write-Host "=== 2) 章节代码编译运行 ==="
$inputs = @{
  'ch01' = '1-1:30 12;1-2:35;1-4:2 2 1;1-5:5 3 8 1 9 2'
  'ch02' = '2-1:2 10 1000;2-2:6 4|1 2 2 4 4 5;2-3:5|2 4 1 3 5;2-4:6|3 6 3 2 6 3 1;2-5:9|-2 1 -3 4 -1 2 1 -5 4;2-6:123456789 987654321;2-7:5|0 0|1 1|3 4|5 6|10 2'
  'ch03' = '3-1:10;3-2:7 1 5 8 9 10 17 17;3-3:5 30 35 15 5 10 20;3-4:ABCBDAB BDCABA;3-5:8 3 1 4 1 5 9 2 6;3-6:4 5 2 3 1 2 3 4 2 2;3-7:1 3 5 2 3 3 4 1 2;3-8:kitten sitting;3-9c:4 1 2 3 4;3-9p:3 0 10 15 10 0 20 15 20 0'
  'ch04' = '4-1:3 6 1 3 4;4-2:5 1 3 2 5 4 7 1 8 5 9;4-3:6 5 9 12 13 16 45;4-4:5 1 4 2 3 3 5 6 8 5 7;4-5:5 6 0|0 1 2|0 2 4|1 2 1|1 3 7|2 4 3|3 4 1;4-6:3 50 10 60 20 100 30 120'
  'ch05' = '5-1:4 5|0 1 2|1 2 3|2 3 1|3 0 4|0 2 5;5-2:6 7 0|0 1|0 2|1 3|2 3|3 4|4 5|2 5;5-3:6 6|5 2|5 0|4 0|4 1|2 3|3 1;5-4:5 5|0 1|1 2|2 0|1 3|3 4'
  'ch06' = '6-1:5 7|0 1 2|0 3 6|1 2 3|1 3 8|1 4 5|2 4 7|3 4 9;6-2:4 5 0|0 1 4|0 2 5|1 2 -3|2 3 2|1 3 6;6-3:4 5|0 1 1|0 2 4|1 2 2|1 3 5|2 3 1|1|0 3;6-4:4 5 0 3|0 1 3|0 2 2|1 2 1|1 3 2|2 3 3;6-5:3 3 5|0 0|0 1|1 0|1 2|2 1'
  'ch07' = '7-1:5 4|1 1 2|2 1 2|1 2 3|2 1 3;7-2c:10|3 2 1 4 5 6 7 10 9 8;7-2p:7|1 2 3 4 5 6 7;7-3c:6|5 3 8 1 9 2;7-3p:6 3|5 3 8 1 9 2;7-4c:5 3|1 2 3 4 5|1 1 3 5|2 2 4|2 1 5;7-4p:5 2|-2 1 -3 4 -1|1 3|1 5;7-5c:5 6|1 2 5|2 1 5|3 1 5 2|4 3|2 1 5|3 2 4 1;7-5p:6|3 1 4 1 5 9;7-6c:3 4|5 10 15|i 7|f 5|f 6|f 20;7-6p:50 200 3;7-7c:7|5 3 7 1 4 6 8|3|1 4 9;7-7p:8|5 3 7 1 4 6 8 2|3 7'
  'ch08' = '8-1:ababcabab|abab;8-2:ababcabab|abab;8-3:ababcabab|abab;8-4:abracadabra|abra;8-5:4|apple|app|apply|apricot|4|1 apple|2 app|1 banana|2 ap'
  'ch09' = '9-1:3;9-2:8;9-3:5 10|1 2 3 4 5;9-4:4 10|2 1|3 3|4 5|7 9;9-5:1 2 3 4 5 6 7 0 8'
  'ch10' = '10-1c:100000;10-1p:200000;10-2c:8|5 3 8 1 9 2 7 4;10-2p:8 3|5 3 8 1 9 2 7 4;10-3:561;10-4c:100000'
  'ch11' = '11-1:17 43;11-2:3 50 7;11-3:1000000 100 200;11-4:3|2 3|3 5|2 7;11-5:61 53 17 65'
  'ch12' = '12-1c:100000;12-1p:100000;12-2:P P P m3 p P;12-3:P P P m3 p P;12-4:I I I I I D D D'
  'ch13' = '13-1c:5 10|2 3 5 7 11;13-1p:2 3 5 7 11|10;13-2:3 2|2 1 -2|2 2 3|1 0 1;13-3:3 2|3 1 2 -3|4 -1 -2 3 1;13-4:4 9|2 3 5 7;13-5:6 5|1 2|2 3|3 4|4 5|5 6'
}
$fail = 0
Get-ChildItem web\chapters\ch*.json | Sort-Object Name | ForEach-Object {
  $name = $_.BaseName
  $arg = @()
  if ($inputs.ContainsKey($name)) { $arg = @('--inputs', $inputs[$name]) }
  Write-Host "--- $name ---"
  $out = python scripts\qa_codes.py "web\chapters\$name.json" @arg 2>&1
  $out | ForEach-Object { Write-Host $_ }
  if ($LASTEXITCODE -ne 0) { $fail++ }
}
Write-Host ""
if ($fail -eq 0) { Write-Host "全量 QA 通过!" -ForegroundColor Green }
else { Write-Host "有 $fail 个章节存在失败项" -ForegroundColor Red }
exit $fail
