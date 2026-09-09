<#
  Converts iPhone screenshots into App Store Connect's required size.

  Every iPhone screenshot has an aspect ratio within ~0.2% of the 6.9"
  requirement (1290x2796), so images are scaled to FILL and centre-cropped:
  no letterbox bars, and the crop is sub-pixel in practice.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/make-appstore-screenshots.ps1 `
      -In screenshots/iphone -Out screenshots/appstore
#>
param(
  [Parameter(Mandatory=$true)][string]$In,
  [string]$Out = "screenshots/appstore",
  [int]$Width = 1290,
  [int]$Height = 2796
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $In)) { Write-Error "Input folder not found: $In"; exit 1 }
if (-not (Test-Path $Out)) { New-Item -ItemType Directory -Force $Out | Out-Null }

$files = Get-ChildItem -Path $In -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg)$' } | Sort-Object Name
if ($files.Count -eq 0) { Write-Error "No PNG/JPG files in $In"; exit 1 }

$n = 0
foreach ($f in $files) {
  $n++
  $src = [System.Drawing.Image]::FromFile($f.FullName)
  try {
    $canvas = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode  = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.Clear([System.Drawing.Color]::Black)

      # scale to FILL, then centre the overflow off-canvas
      $scale = [Math]::Max($Width / $src.Width, $Height / $src.Height)
      $w = [int][Math]::Ceiling($src.Width * $scale)
      $h = [int][Math]::Ceiling($src.Height * $scale)
      $x = [int](($Width - $w) / 2)
      $y = [int](($Height - $h) / 2)
      $g.DrawImage($src, $x, $y, $w, $h)
    } finally { $g.Dispose() }

    $dest = Join-Path $Out ("{0:d2}.png" -f $n)
    $canvas.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output ("{0}  ->  {1}   ({2}x{3} -> {4}x{5})" -f $f.Name, (Split-Path $dest -Leaf), $src.Width, $src.Height, $Width, $Height)
  } finally {
    $src.Dispose()
    if ($canvas) { $canvas.Dispose() }
  }
}
Write-Output ""
Write-Output ("{0} screenshot(s) written to {1} at {2}x{3}" -f $n, $Out, $Width, $Height)
