Add-Type -AssemblyName System.Drawing

$outPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'app.ico'
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$frames = New-Object System.Collections.ArrayList

foreach ($size in $sizes) {
    $bmp = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $s = [double]$size / 256.0
    $cx = $size / 2.0
    $cy = $size / 2.0

    $bg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 9, 18, 26))
    $g.FillEllipse($bg, [float](4 * $s), [float](4 * $s), [float](248 * $s), [float](248 * $s))
    $bg.Dispose()

    $halo = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 197, 161, 95))
    $g.FillEllipse($halo, [float](20 * $s), [float](20 * $s), [float](216 * $s), [float](216 * $s))
    $halo.Dispose()

    $gold = [System.Drawing.Color]::FromArgb(255, 213, 181, 120)
    $goldDim = [System.Drawing.Color]::FromArgb(150, 197, 161, 95)
    $penOuter = [System.Drawing.Pen]::new($gold, [float]([Math]::Max(1.0, 3.2 * $s)))
    $penInner = [System.Drawing.Pen]::new($goldDim, [float]([Math]::Max(0.7, 1.2 * $s)))
    $penInner.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dot

    $g.DrawEllipse($penOuter, [float](17 * $s), [float](17 * $s), [float](222 * $s), [float](222 * $s))
    $g.DrawEllipse($penInner, [float](31 * $s), [float](31 * $s), [float](194 * $s), [float](194 * $s))

    $pts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new([float](128 * $s), [float](30.7 * $s)),
        [System.Drawing.PointF]::new([float](143.6 * $s), [float](112.4 * $s)),
        [System.Drawing.PointF]::new([float](225.3 * $s), [float](128 * $s)),
        [System.Drawing.PointF]::new([float](143.6 * $s), [float](143.6 * $s)),
        [System.Drawing.PointF]::new([float](128 * $s), [float](225.3 * $s)),
        [System.Drawing.PointF]::new([float](112.4 * $s), [float](143.6 * $s)),
        [System.Drawing.PointF]::new([float](30.7 * $s), [float](128 * $s)),
        [System.Drawing.PointF]::new([float](112.4 * $s), [float](112.4 * $s))
    )
    $starBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 213, 181, 120))
    $g.FillPolygon($starBrush, $pts)
    $starPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 240, 214, 164), [float]([Math]::Max(0.7, 1.1 * $s)))
    $g.DrawPolygon($starPen, $pts)

    $coreBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 247, 228, 184))
    $g.FillEllipse($coreBrush, [float]($cx - 6 * $s), [float]($cy - 6 * $s), [float](12 * $s), [float](12 * $s))

    $penOuter.Dispose()
    $penInner.Dispose()
    $starBrush.Dispose()
    $starPen.Dispose()
    $coreBrush.Dispose()
    $g.Dispose()

    $ms = [System.IO.MemoryStream]::new()
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    [void]$frames.Add(@($size, $ms.ToArray()))
    $ms.Dispose()
    $bmp.Dispose()
}

$fs = [System.IO.File]::Create($outPath)
$bw = [System.IO.BinaryWriter]::new($fs)
$bw.Write([UInt16]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]$frames.Count)
$offset = 6 + 16 * $frames.Count
foreach ($frame in $frames) {
    $size = [int]$frame[0]
    $bytes = [byte[]]$frame[1]
    $dimension = if ($size -ge 256) { 0 } else { $size }
    $bw.Write([byte]$dimension)
    $bw.Write([byte]$dimension)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([UInt16]1)
    $bw.Write([UInt16]32)
    $bw.Write([UInt32]$bytes.Length)
    $bw.Write([UInt32]$offset)
    $offset += $bytes.Length
}
foreach ($frame in $frames) {
    $bw.Write([byte[]]$frame[1])
}
$bw.Flush()
$bw.Close()
$fs.Close()
Write-Output "Icon written: $outPath"
