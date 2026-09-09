<#
  Converts any screenshot into the exact 640x920 PNG that App Store Connect
  wants for In-App Purchase review screenshots.

  The image is scaled to fit and centred on a solid background, so nothing is
  stretched or cropped. Background defaults to the game's harbour blue.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/make-iap-screenshot.ps1 `
      -In screenshots/shop.png -Out screenshots/iap-review.png
#>
param(
  [Parameter(Mandatory=$true)][string]$In,
  [string]$Out = "screenshots/iap-review.png",
  [int]$Width = 640,
  [int]$Height = 920,
  [string]$Background = "#2FA4C9"
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $In)) { Write-Error "Input not found: $In"; exit 1 }

$src = [System.Drawing.Image]::FromFile((Resolve-Path $In).Path)
try {
  $canvas = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  try {
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode  = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bg = [System.Drawing.ColorTranslator]::FromHtml($Background)
    $g.Clear($bg)

    # scale to fit, preserving aspect ratio
    $scale = [Math]::Min($Width / $src.Width, $Height / $src.Height)
    $w = [int][Math]::Round($src.Width * $scale)
    $h = [int][Math]::Round($src.Height * $scale)
    $x = [int](($Width - $w) / 2)
    $y = [int](($Height - $h) / 2)

    $g.DrawImage($src, $x, $y, $w, $h)
  } finally { $g.Dispose() }

  $dir = Split-Path -Parent $Out
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }

  $canvas.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("Wrote {0} ({1}x{2}, source {3}x{4} scaled to {5}x{6})" -f $Out, $Width, $Height, $src.Width, $src.Height, $w, $h)
} finally {
  $src.Dispose()
  if ($canvas) { $canvas.Dispose() }
}
