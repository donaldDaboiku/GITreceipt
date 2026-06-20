Add-Type -AssemblyName System.Drawing

function Draw-Icon {
  param([int]$Size)

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(15, 23, 42))

  $margin = [int]($Size * 0.14)
  $inner = $Size - (2 * $margin)
  $rect = New-Object System.Drawing.Rectangle $margin, $margin, $inner, $inner
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255))
  $g.FillRectangle($white, $rect)

  $green = [System.Drawing.Color]::FromArgb(22, 163, 74)
  $pen = New-Object System.Drawing.Pen $green, ([Math]::Max(2, [int]($Size * 0.02)))

  $x1 = [int]($Size * 0.28)
  $x2 = [int]($Size * 0.72)
  $g.DrawLine($pen, $x1, [int]($Size * 0.34), $x2, [int]($Size * 0.34))
  $g.DrawLine($pen, $x1, [int]($Size * 0.48), $x2, [int]($Size * 0.48))
  $g.DrawLine($pen, $x1, [int]($Size * 0.62), [int]($Size * 0.58), [int]($Size * 0.62))

  $fontSize = [Math]::Max(10, [int]($Size * 0.11))
  $font = New-Object System.Drawing.Font @("Arial", [single]$fontSize, [System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush $green
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textRect = New-Object System.Drawing.RectangleF ([int]($Size * 0.1), [int]($Size * 0.72), [int]($Size * 0.8), [int]($Size * 0.18))
  $g.DrawString("RCP", $font, $textBrush, $textRect, $sf)

  $g.Dispose()
  return $bmp
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconDir = Join-Path $root "icons"
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

$img192 = Draw-Icon -Size 192
$img512 = Draw-Icon -Size 512
$img192.Save((Join-Path $iconDir "icon-192.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$img512.Save((Join-Path $iconDir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$img192.Dispose()
$img512.Dispose()

Write-Output "Icons saved to $iconDir"
