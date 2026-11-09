<#
.SYNOPSIS
  Safe Git workflow for this project: pull, status, commit, push.

.DESCRIPTION
  - Pull is fast-forward only (with autostash): it never merges or overwrites
    your work silently.
  - Commit and push ask for confirmation first.
  - Never force-pushes. A rejected push means "pull first".
  - Refuses to commit files that look like secrets (.env, keys, certificates).
  - Never stores credentials: authentication is handled by Git Credential
    Manager (installed with Git for Windows) or your SSH key.

.EXAMPLE
  .\scripts\git-sync.ps1 status
  .\scripts\git-sync.ps1 pull
  .\scripts\git-sync.ps1 commit -Message "Add ceramic mug hero"
  .\scripts\git-sync.ps1 push
  .\scripts\git-sync.ps1 sync -Message "Tweak hero lighting"   # pull + commit + push
  .\scripts\git-sync.ps1 remote -Url https://github.com/<you>/<repo>.git
  .\scripts\git-sync.ps1 pr -Title "Landing page"     # open a PR: current branch -> main
  .\scripts\git-sync.ps1 invite -User someone          # invite a collaborator (write access)

  pr / invite use the GitHub CLI if installed, otherwise the sign-in Git
  Credential Manager already holds for github.com. The token is only kept in
  memory for the API call; it is never printed or written to disk.
  -Yes skips the y/N prompt (for use after you have reviewed the change).
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet('status', 'pull', 'commit', 'push', 'sync', 'remote', 'pr', 'invite')]
  [string]$Action = 'status',

  [string]$Message,

  [string]$Url,

  [string]$Title,        # pr: pull request title (default: last commit subject)
  [string]$Base = 'main', # pr: target branch
  [string]$User,         # invite: GitHub username
  [ValidateSet('pull', 'triage', 'push', 'maintain', 'admin')]
  [string]$Permission = 'push', # invite: 'push' = write access
  [switch]$Yes           # skip confirmation prompts
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)   # project root

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }
function Write-Bad($text)  { Write-Host "    $text" -ForegroundColor Red }

function Invoke-Git {
  # Runs git, streams its output, throws on a non-zero exit code.
  & git @args
  if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed (exit $LASTEXITCODE)" }
}

function Confirm-Action($question) {
  if ($Yes) { Write-Host "$question [auto-yes]"; return $true }
  $answer = Read-Host "$question [y/N]"
  return ($answer -match '^(y|yes)$')
}

function Get-Branch { (git symbolic-ref --short HEAD).Trim() }  # works before the first commit too

function Test-Origin {
  $remotes = @(git remote)
  return ($remotes -contains 'origin')
}

function Test-Upstream {
  git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Test-Clean {
  return [string]::IsNullOrWhiteSpace((git status --porcelain | Out-String))
}

function Assert-Repo {
  git rev-parse --is-inside-work-tree 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'This folder is not a Git repository. Run: git init -b main' }
}

# --- Actions ------------------------------------------------------------

function Show-Status {
  Write-Step "Branch: $(Get-Branch)"
  if (Test-Origin) { Write-Host "    origin: $((git remote get-url origin).Trim())" }
  else { Write-Warn 'No origin remote configured yet (see: git-sync.ps1 remote -Url ...)' }
  Write-Step 'Changed files'
  Invoke-Git status --short --branch
  Write-Step 'Diff summary (unstaged + staged)'
  git --no-pager diff --stat
  git --no-pager diff --cached --stat
}

function Invoke-Pull {
  if (-not (Test-Origin)) { Write-Warn 'No origin remote - nothing to pull.'; return }
  Write-Step 'Fetching origin'
  Invoke-Git fetch origin --prune
  if (-not (Test-Upstream)) {
    Write-Warn "Branch '$(Get-Branch)' has no upstream yet (push once to create it). Skipping pull."
    return
  }
  # --ff-only: never creates a merge or rewrites anything.
  # --autostash: uncommitted edits are set aside and re-applied afterwards;
  #   if they can't be re-applied cleanly Git keeps them in `git stash list`.
  Write-Step 'Pulling (fast-forward only)'
  & git pull --ff-only --autostash
  if ($LASTEXITCODE -ne 0) {
    Write-Bad 'Pull stopped. Either your branch and GitHub have diverged (both have new commits),'
    Write-Bad 'or your uncommitted edits conflict with the incoming changes.'
    Write-Bad 'Your work is safe. Check: git status   and   git stash list'
    Write-Bad 'To combine diverged branches deliberately: git pull --rebase'
    throw 'Pull aborted.'
  }
}

function Invoke-Commit {
  if (Test-Clean) { Write-Warn 'Nothing to commit.'; return $false }

  Write-Step 'Files that will be committed'
  Invoke-Git status --short

  # Block anything that looks like a secret, even if .gitignore was edited.
  $secretPattern = '(^|/)(\.env(\..+)?|.+\.(pem|key|p12|pfx))$'
  $candidates = @(git status --porcelain --untracked-files=all | ForEach-Object { $_.Substring(3).Trim('"') })
  $secrets = @($candidates | Where-Object { $_ -match $secretPattern -and $_ -notmatch '\.env\.example$' })
  if ($secrets.Count -gt 0) {
    Write-Bad 'These files look like secrets and will NOT be committed:'
    $secrets | ForEach-Object { Write-Bad "  $_" }
    throw 'Commit aborted: remove the files or add them to .gitignore.'
  }

  if ([string]::IsNullOrWhiteSpace($Message)) {
    $script:Message = Read-Host 'Commit message (describe WHAT changed and WHY)'
  }
  if ([string]::IsNullOrWhiteSpace($Message) -or $Message.Trim().Length -lt 5) {
    throw 'Commit aborted: please give a meaningful message (5+ characters).'
  }

  if (-not (Confirm-Action "Commit all changes above as: `"$Message`"?")) {
    Write-Warn 'Commit cancelled. Nothing was changed.'
    return $false
  }
  Invoke-Git add --all
  Invoke-Git commit -m $Message
  return $true
}

function Invoke-Push {
  if (-not (Test-Origin)) {
    Write-Warn 'No origin remote configured. Add one first:'
    Write-Warn '  .\scripts\git-sync.ps1 remote -Url https://github.com/<you>/<repo>.git'
    return
  }
  $branch = Get-Branch
  Write-Step "Commits on '$branch' not yet on GitHub"
  if (Test-Upstream) { git --no-pager log --oneline '@{u}..HEAD' }
  else { git --no-pager log --oneline -n 10; Write-Warn '(first push for this branch)' }

  if (-not (Confirm-Action "Push '$branch' to origin?")) { Write-Warn 'Push cancelled.'; return }

  if (Test-Upstream) { & git push origin $branch }
  else { & git push --set-upstream origin $branch }

  if ($LASTEXITCODE -ne 0) {
    Write-Bad 'Push was rejected - GitHub has commits you do not have yet.'
    Write-Bad 'Run: .\scripts\git-sync.ps1 pull   then push again. (This script never force-pushes.)'
    throw 'Push failed.'
  }
  Write-Host "`nPushed '$branch' to origin." -ForegroundColor Green
}

function Set-Origin {
  if ([string]::IsNullOrWhiteSpace($Url)) { throw 'Pass the repository URL: -Url https://github.com/<you>/<repo>.git' }
  if ($Url -match '://[^/@]+:[^/@]+@' -or $Url -match 'gh[pousr]_[A-Za-z0-9]{20,}') {
    throw 'That URL contains a password or token. Use the plain URL; Git Credential Manager will ask you to sign in.'
  }
  if (Test-Origin) {
    Write-Warn "origin already set to: $((git remote get-url origin).Trim())"
    Write-Warn 'Leaving it unchanged. To change it on purpose: git remote set-url origin <url>'
    return
  }
  if (-not (Confirm-Action "Add origin -> $Url ?")) { Write-Warn 'Cancelled.'; return }
  Invoke-Git remote add origin $Url
  Write-Host 'origin added.' -ForegroundColor Green
}

# --- GitHub API (PR / collaborator) -----------------------------------

function Get-RepoSlug {
  if (-not (Test-Origin)) { throw 'No origin remote configured.' }
  $u = (git remote get-url origin).Trim()
  if ($u -notmatch 'github\.com[:/]([^/]+)/([^/]+?)(\.git)?$') { throw "origin is not a GitHub URL: $u" }
  return "$($Matches[1])/$($Matches[2])"
}

function Get-GitHubToken {
  # Ask Git Credential Manager for the github.com sign-in it already stores.
  # If none is stored, GCM shows its own sign-in window (browser / device code).
  # The request goes through a temp file: Windows PowerShell's pipe to native
  # commands mangles the line endings git expects. The file holds no secret.
  $req = Join-Path $env:TEMP "git-sync-cred-$PID.txt"
  [IO.File]::WriteAllText($req, "protocol=https`nhost=github.com`n`n", (New-Object Text.ASCIIEncoding))
  try { $out = cmd /c "git credential fill < `"$req`"" 2>$null }
  finally { Remove-Item $req -ErrorAction SilentlyContinue }
  $line = $out | Where-Object { $_ -like 'password=*' } | Select-Object -First 1
  if (-not $line) { throw 'No GitHub sign-in available. Run a git push once to sign in, then retry.' }
  return $line.Substring(9)
}

function Invoke-GitHub($Method, $Path, $Body) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $headers = @{
    Authorization          = "Bearer $(Get-GitHubToken)"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'           = 'git-sync-script'
  }
  $params = @{ Method = $Method; Uri = "https://api.github.com$Path"; Headers = $headers }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 5); $params.ContentType = 'application/json' }
  try {
    return Invoke-RestMethod @params
  }
  catch {
    $detail = $_.ErrorDetails.Message
    if ($detail) {
      try {
        $j = $detail | ConvertFrom-Json
        $detail = $j.message
        if ($j.errors) { $detail += ' - ' + (($j.errors | ForEach-Object { if ($_.message) { $_.message } else { "$($_.field) $($_.code)" } }) -join '; ') }
      } catch { }
    }
    throw "GitHub API $Method $Path failed: $($_.Exception.Message) $detail"
  }
}

function Test-Gh {
  # Use the GitHub CLI only when it is installed AND signed in.
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { return $false }
  & gh auth status *> $null
  return ($LASTEXITCODE -eq 0)
}

function New-PullRequest {
  $branch = Get-Branch
  if ($branch -eq $Base) { throw "You are on '$Base'. Switch to your feature branch first." }
  if (-not (Test-Upstream)) { throw "Push '$branch' first: .\scripts\git-sync.ps1 push" }
  $slug = Get-RepoSlug
  $owner = $slug.Split('/')[0]
  if ([string]::IsNullOrWhiteSpace($Title)) { $script:Title = (git log -1 --format=%s).Trim() }

  $existing = @(Invoke-GitHub GET "/repos/$slug/pulls?head=$($owner):$branch&base=$Base&state=open")
  if ($existing.Count -gt 0 -and $existing[0].html_url) {
    Write-Host "A pull request already exists: $($existing[0].html_url)" -ForegroundColor Green
    return
  }

  Write-Step "Commits that will be in the PR ($branch -> $Base)"
  git --no-pager log --oneline "origin/$Base..HEAD"
  if (-not (Confirm-Action "Open PR '$Title' on ${slug}?")) { Write-Warn 'Cancelled.'; return }

  $bodyFile = Join-Path (Get-Location) '.github/pull_request_template.md'
  # ReadAllText -> a plain string (Get-Content adds PS metadata that would
  # leak into the JSON body).
  $template = if (Test-Path $bodyFile) { [IO.File]::ReadAllText($bodyFile) } else { '' }
  $commits = (git log --format='- %s (%h)' "origin/$Base..HEAD") -join "`n"
  $body = "## Commits in this PR`n`n$commits`n`n$template"
  if (Test-Gh) {
    & gh pr create --repo $slug --base $Base --head $branch --title $Title --body $body
    if ($LASTEXITCODE -ne 0) { throw 'gh pr create failed.' }
    return
  }
  $pr = Invoke-GitHub POST "/repos/$slug/pulls" @{ title = $Title; head = $branch; base = $Base; body = $body }
  Write-Host "Pull request #$($pr.number) opened: $($pr.html_url)" -ForegroundColor Green
}

function Add-Collaborator {
  if ([string]::IsNullOrWhiteSpace($User)) { throw 'Pass the GitHub username: -User <name>' }
  $slug = Get-RepoSlug
  if (-not (Confirm-Action "Invite '$User' to $slug with '$Permission' access?")) { Write-Warn 'Cancelled.'; return }
  $res = Invoke-GitHub PUT "/repos/$slug/collaborators/$User" @{ permission = $Permission }
  if ($res -and $res.html_url) {
    Write-Host "Invitation sent to $User. They must accept it at https://github.com/$slug/invitations" -ForegroundColor Green
  } else {
    Write-Host "$User already has access to $slug." -ForegroundColor Green
  }
}

# --- Main ---------------------------------------------------------------

try {
  Assert-Repo
  switch ($Action) {
    'status' { Show-Status }
    'pull'   { Invoke-Pull; Show-Status }
    'commit' { [void](Invoke-Commit) }
    'push'   { Invoke-Push }
    'remote' { Set-Origin }
    'pr'     { New-PullRequest }
    'invite' { Add-Collaborator }
    'sync' {
      # Pull first (fast-forward), then commit on top, then push.
      Invoke-Pull
      [void](Invoke-Commit)
      Invoke-Push
    }
  }
}
catch {
  Write-Host "`n$($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
