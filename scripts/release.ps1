param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('patch','minor','major')]
  [string]$Bump
)

$ErrorActionPreference = 'Stop'

$current = (node -p "require('./package.json').version").Trim()
if (-not $current) { throw 'Unable to read package version.' }

$parts = $current.Split('.')
if ($parts.Length -ne 3) { throw "Version '$current' is not SemVer (x.y.z)." }

[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

switch ($Bump) {
  'major' { $major += 1; $minor = 0; $patch = 0 }
  'minor' { $minor += 1; $patch = 0 }
  'patch' { $patch += 1 }
}

$newVersion = "$major.$minor.$patch"

node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.version='$newVersion';fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');"

$tag = "v$newVersion"

Write-Host "Updated package.json version: $current -> $newVersion"
Write-Host "Next steps:"
Write-Host "  git add package.json"
Write-Host "  git commit -m 'release: $tag'"
Write-Host "  git tag $tag"
Write-Host "  git push origin main --tags"
