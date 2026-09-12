<#
  Builds the @capacitor/assets source images for the Android launcher icon
  from the shared app icon, so Android matches iOS.

  Android adaptive icons are a 108dp canvas with only the inner ~72dp
  guaranteed visible, so the artwork is scaled to 80% and centred on the
  foreground layer. The source's own background is the same flat colour as
  the background layer, so the overhang is invisible.
#>
param(
  [string]$In = "dock-star-2-ios-icon.png",
  [string]$OutDir = "resources",
  [string]$Background = "#C1EAF8",
  [double]$ForegroundScale = 0.80
)

Add-Type -AssemblyName System.Drawing
if (-not (Test-Path $In)) { Write-Error "Source not found: $In"; exit 1 }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force $OutDir | Out-Null }

$src = [System.Drawing.Image]::FromFile((Resolve-Path $In).Path)
$S = 1024
$bg = [System.Drawing.ColorTranslator]::FromHtml($Background)

function New-Canvas([int]$size) {
  $b = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode  = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($b, $g)
}

try {
  # 1. Legacy square icon: centre-crop the source to 1024x1024
  $r = New-Canvas $S; $icon = $r[0]; $g = $r[1]
  $g.Clear($bg)
  $scale = [Math]::Max($S / $src.Width, $S / $src.Height)
  $w = [int][Math]::Ceiling($src.Width * $scale); $h = [int][Math]::Ceiling($src.Height * $scale)
  $g.DrawImage($src, [int](($S - $w) / 2), [int](($S - $h) / 2), $w, $h)
  $g.Dispose()
  $icon.Save((Join-Path $OutDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $icon.Dispose()
  Write-Output "icon.png            1024x1024 (legacy, centre-cropped)"

  # 2. Adaptive background: flat colour
  $r = New-Canvas $S; $bgImg = $r[0]; $g = $r[1]
  $g.Clear($bg); $g.Dispose()
  $bgImg.Save((Join-Path $OutDir "icon-background.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bgImg.Dispose()
  Write-Output "icon-background.png 1024x1024 (flat $Background)"

  # 3. Adaptive foreground: artwork inside the safe zone, transparent around it
  $r = New-Canvas $S; $fg = $r[0]; $g = $r[1]
  $g.Clear([System.Drawing.Color]::Transparent)
  $target = $S * $ForegroundScale
  $scale = [Math]::Min($target / $src.Width, $target / $src.Height)
  $w = [int][Math]::Round($src.Width * $scale); $h = [int][Math]::Round($src.Height * $scale)
  $g.DrawImage($src, [int](($S - $w) / 2), [int](($S - $h) / 2), $w, $h)
  $g.Dispose()
  $fg.Save((Join-Path $OutDir "icon-foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $fg.Dispose()
  Write-Output ("icon-foreground.png 1024x1024 (artwork at {0:P0}, transparent margin)" -f $ForegroundScale)
} finally {
  $src.Dispose()
}
