# dsh 分享插件安装脚本（Windows PowerShell）
# 用法：powershell -ExecutionPolicy Bypass -File .\install.ps1 [-AiDir <@deepseek-ai 目录>] [-Profile <profile名>]
# 幂等：可重复执行；已安装的包与 patch 行会被跳过。
param(
    [string]$AiDir = '',
    [string]$Profile = 'web'
)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$homeDir = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }

Write-Host ''
Write-Host '== dsh 分享插件安装 ==' -ForegroundColor Cyan

# ── 1. 定位 dsh 安装树的 @deepseek-ai 目录 ──────────────────────────────
function Find-AiDir {
    # 1) 显式参数
    if ($AiDir -and (Test-Path (Join-Path $AiDir 'dsh-base'))) { return $AiDir }
    # 2) 从脚本目录/当前目录向祖先链找 apps/cli/node_modules/@deepseek-ai
    foreach ($start in @($scriptDir, (Get-Location).Path)) {
        $cur = $start
        while ($cur) {
            $cand = Join-Path $cur 'apps/cli/node_modules/@deepseek-ai'
            if (Test-Path (Join-Path $cand 'dsh-base')) { return $cand }
            $parent = Split-Path -Parent $cur
            if ($parent -eq $cur) { break }
            $cur = $parent
        }
    }
    # 3) npm 全局安装位置
    try {
        $g = npm root -g 2>$null
        if ($g) {
            $cand = Join-Path $g '@deepseek-ai'
            if (Test-Path (Join-Path $cand 'dsh-base')) { return $cand }
        }
    } catch {}
    return $null
}

$aiDir = Find-AiDir
if (-not $aiDir) {
    Write-Host '无法自动定位 dsh 安装树的 node_modules/@deepseek-ai。' -ForegroundColor Yellow
    Write-Host '请用 -AiDir 指定（例如：./install.ps1 -AiDir <你的dsh安装目录>\apps\cli\node_modules\@deepseek-ai）'
    exit 1
}
Write-Host "[1/5] @deepseek-ai 目录: $aiDir" -ForegroundColor Green

# ── 2. 复制两个插件包 ───────────────────────────────────────────────────
$plugins = @('dsh-client-ui-model-tag', 'dsh-subagent-effort-in-process')
foreach ($p in $plugins) {
    $src = Join-Path $scriptDir "plugins\$p"
    $dst = Join-Path $aiDir $p
    if (-not (Test-Path $src)) { Write-Host "缺少 $src，跳过" -ForegroundColor Yellow; continue }
    if (Test-Path $dst) { Remove-Item $dst -Recurse -Force -ErrorAction SilentlyContinue }
    Copy-Item $src $dst -Recurse -Force
    Write-Host "[2/5] 已安装插件包: $p" -ForegroundColor Green
}

# ── 3. browser 插件: 确保 ~/.dsh/profiles/node_modules 链接树可见 ──────
$profilesLinkDir = Join-Path $homeDir 'profiles\node_modules\@deepseek-ai'
$uiTarget = Join-Path $aiDir 'dsh-client-ui-model-tag'
$uiLink = Join-Path $profilesLinkDir 'dsh-client-ui-model-tag'
if (-not (Test-Path $uiTarget)) {
    Write-Host '警告: 未找到 dsh-client-ui-model-tag 安装副本，跳过第 3 步' -ForegroundColor Yellow
} elseif (-not (Test-Path $uiLink)) {
    New-Item -ItemType Directory -Path $profilesLinkDir -Force | Out-Null
    try {
        # Junction 优先（无需管理员权限）
        New-Item -ItemType Junction -Path $uiLink -Target $uiTarget | Out-Null
        Write-Host '[3/5] 已建立 profiles 树 junction: dsh-client-ui-model-tag' -ForegroundColor Green
    } catch {
        # 失败则退化为目录副本
        Copy-Item $uiTarget $uiLink -Recurse -Force
        Write-Host '[3/5] junction 失败，已复制目录副本: dsh-client-ui-model-tag' -ForegroundColor Green
    }
} else {
    Write-Host '[3/5] profiles 树已存在 dsh-client-ui-model-tag，跳过' -ForegroundColor Green
}

# ── 4. 追加 cordis.patch.yml 挂载行（幂等） ─────────────────────────────
$patchPath = Join-Path $homeDir "profiles\$Profile\cordis.patch.yml"
$block = @'

# 分享插件：Per-message model/effort 标签 + 子代理 reasoning-effort 透传（install.ps1 安装）
- insert:
    - id: ui-model-effort-tag
      name: '@deepseek-ai/dsh-client-ui-model-tag'
    - id: subagent-effort-in-process
      name: '@deepseek-ai/dsh-subagent-effort-in-process'
'@
$content = if (Test-Path $patchPath) { Get-Content $patchPath -Raw -Encoding UTF8 } else { '' }
if ($content -match 'ui-model-effort-tag' -and $content -match 'subagent-effort-in-process') {
    Write-Host '[4/5] patch 已包含两个插件行，跳过' -ForegroundColor Green
} else {
    $dir = Split-Path -Parent $patchPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Add-Content -Path $patchPath -Value $block -Encoding UTF8
    Write-Host "[4/5] 已追加挂载行: $patchPath" -ForegroundColor Green
}

# ── 5. ui-conversation 客户端补丁（turn-status 模型标签） ────────────
# turnStatus 槽位需要打过补丁的 dsh-client-ui-conversation client bundle。
# 覆盖前把原文件备份为 .dshbak；重复执行只在备份缺失时重新备份。
$convPkg = Join-Path $aiDir 'dsh-client-ui-conversation'
$convLib = Join-Path $convPkg 'lib'
$convPatch = Join-Path $scriptDir 'patches\dsh-client-ui-conversation\lib'
if (Test-Path $convLib) {
    foreach ($f in @('client.js', 'client.js.map')) {
        $target = Join-Path $convLib $f
        $backup = $target + '.dshbak'
        if (Test-Path $target) {
            if (-not (Test-Path $backup)) { Copy-Item $target $backup -Force }
            Copy-Item (Join-Path $convPatch $f) $target -Force
        }
    }
    Write-Host '[5/5] 已应用 dsh-client-ui-conversation 补丁（原文件备份为 .dshbak）' -ForegroundColor Green
} else {
    Write-Host '警告: 未找到 dsh-client-ui-conversation，跳过补丁（需 dsh 0.1.1-rc.2+）' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '安装完成。请退出当前运行的 dsh 实例后重新启动（dsh --profile web）生效。' -ForegroundColor Cyan
