# Student request forms: school layout and academic data

The seven compiled layouts retain the supplied school's Word page geometry. The compiler additionally records each cell's usable width, minimum row height, paragraph spacing, explicit tab positions, font style and line spacing. The PDF renderer wraps long personal fields inside their cells, grows a table row once, and moves the following content and semester history together. Historical rows retain their own alignment. Printing still uses PDFKit directly; Microsoft Word is used only for offline comparison.

On Windows the renderer embeds the installed Times New Roman font variants from the Windows Fonts directory. `REQUEST_FORM_FONT_DIR` can point to a directory of licensed `times.ttf`, `timesbd.ttf`, `timesi.ttf` and `timesbi.ttf` files on another host. Tinos remains a portable fallback when those fonts are unavailable; that fallback is not an exact typography match to the school's originals. Proprietary system fonts are not copied into the repository.

## Academic data

All school access is parameterized SELECT only. Personal fields still come from DATA_SV1 and DATA_GVien1. Academic summaries come from tmProxDUT, where the linked student's current data was verified; DATA_GVien1's corresponding academic tables were empty for that student. The academic reader verifies both the institutional student number and school profile ID before accepting results.

| Output | tmProxDUT source |
| --- | --- |
| Required credits | tmHocvuTK.SoTC |
| Earned credits | tmHocvuTK.HPTichluy |
| Cumulative GPA, scale 4 | tmHocvuTK.DiemTBTL |
| Average conduct | tmHocvuTK.DiemRL |
| Semester credits and repeat credits | tmHocvu.HPDangky, SoTCHoclai |
| Scholarship average, scale 10 | tmHocvu.DiemTBHB |
| Semester and cumulative GPA, scale 4 | tmHocvu.DiemTBHT, DiemTBTL |
| Semester conduct | tmHocvu.DiemRL |
| Course grade below 5 | tmDiemkyhoc.Diem for that exact course semester |

Ordinary academic semester codes YY1/YY2 map to the catalog's YY10/YY20 codes. Summer codes are not merged into semester 2. A scholarship request reads only its selected semester. Missing results remain null and appear as “Chưa có”; a published zero stays zero. The initial scholarship form selects the most recent available result, while users can explicitly choose another catalog semester. This does not replace a saved request's selected semester.

The school's fixed scholarship prefix ends in “do”; the student's reason follows it. Older requests already containing the full prefix do not get it twice.

Only the local sv_dut.svc_demo typed profile and semester cache is updated, inside one transaction. No school records, request workflow statuses, roles or SSO URL parameters are modified by this change.

## Validation on 2026-10-26

- 113 backend unit checks and 20 frontend checks passed; 38 HTTP workflow integration checks passed with isolated fixture cleanup.
- Seven variants were rendered using synthetic data and compared visually against PDFs exported from the source-preserving Word templates with the same values. The second page of the withdrawal form was also inspected.
- Checked personal/table/signature/receipt anchors in graduation, scholarship and second-program forms differed by at most 0.15 pt in the sampled cases. Floating-point rendering is not claimed to be byte-identical to Word.
- The linked SSO student's four summary fields and six completed semesters were verified. Actual-student PDF values were checked in memory; no actual-student PDF was saved.
- Direct synthetic PDF rendering took approximately 116–175 ms. This measurement excludes profile lookup, network transfer and browser display.
- Desktop form, native radios, selected-semester changes and missing-result messaging were checked in the local UI. Test viewport overrides were reset.

Previously opened blob PDF tabs are snapshots. Open a new PDF from the updated application to see these changes.
