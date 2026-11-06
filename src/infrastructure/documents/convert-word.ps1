param([Parameter(Mandatory=$true)][string]$JobPath)
$ErrorActionPreference='Stop'
$job=Get-Content -LiteralPath $JobPath -Encoding UTF8 -Raw | ConvertFrom-Json
$wordApp=$null
$document=$null
$ownedMutex=$false
$mutex=[System.Threading.Mutex]::new($false,'Local\DutDocumentPdfExport')
try {
 $ownedMutex=$mutex.WaitOne(60000)
 if(-not $ownedMutex){throw 'PDF renderer is busy'}
 $wordApp=New-Object -ComObject Word.Application
 $previousVisible=$wordApp.Visible
 $previousAlerts=$wordApp.DisplayAlerts
 $previousSecurity=$wordApp.AutomationSecurity
 $previousLinks=$wordApp.Options.UpdateLinksAtOpen
 $wordApp.Visible=$false
 $wordApp.DisplayAlerts=0
 $wordApp.AutomationSecurity=3
 $wordApp.Options.UpdateLinksAtOpen=$false
 $document=$wordApp.Documents.Open([string]$job.input,$false,$true,$false)
 $document.Repaginate()
 # A floating 3x4 photo can extend below its signature paragraph even when
 # all text fits. Reserve the real photo height against the native footer.
 foreach($photo in $document.Shapes) {
  if($photo.Type -ne 13){continue}
  $setup=$photo.Anchor.Sections.Item(1).PageSetup
  $safeBottom=[double]$setup.PageHeight-[Math]::Max([double]$setup.BottomMargin,([double]$setup.FooterDistance+12))
  for($attempt=0;$attempt -lt 2;$attempt++) {
   $anchorY=[double]$photo.Anchor.Information(6)
   if($anchorY -lt 0){$photo.Anchor.Select();$anchorY=[double]$photo.Anchor.Information(6)}
   if($anchorY -lt 0){throw 'Cannot measure the student photo position'}
   if($photo.RelativeVerticalPosition -ne 2){throw 'Unexpected student photo anchor'}
   if($anchorY+[double]$photo.Top+[double]$photo.Height -le $safeBottom){break}
   if($attempt -eq 1){throw 'Student photo does not fit above the footer'}
   $photo.Anchor.ParagraphFormat.PageBreakBefore=-1
   $document.Repaginate()
  }
 }
 [void]$document.Fields.Update()
 foreach($section in $document.Sections) {
  foreach($footer in $section.Footers) {
   [void]$footer.Range.Fields.Update()
   foreach($shape in $footer.Shapes) { if($shape.TextFrame.HasText){[void]$shape.TextFrame.TextRange.Fields.Update()} }
  }
 }
 $document.Repaginate()
 $document.ExportAsFixedFormat([string]$job.output,17,$false,0,0,1,1,0,$false,$false,0,$false,$true,$false)
 @{pageCount=[int]$document.ComputeStatistics(2)} | ConvertTo-Json -Compress | Set-Content -LiteralPath ([string]$job.result) -Encoding UTF8
} finally {
 if($document){$document.Close(0);[void][Runtime.InteropServices.Marshal]::ReleaseComObject($document)}
 if($wordApp){
  $wordApp.Options.UpdateLinksAtOpen=$previousLinks
  $wordApp.AutomationSecurity=$previousSecurity
  $wordApp.DisplayAlerts=$previousAlerts
  if($wordApp.Documents.Count -eq 0){$quitMode=0;$wordApp.Quit([ref]$quitMode)}else{$wordApp.Visible=$previousVisible}
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wordApp)
 }
 if($ownedMutex){$mutex.ReleaseMutex()};$mutex.Dispose()
 [GC]::Collect();[GC]::WaitForPendingFinalizers()
}
