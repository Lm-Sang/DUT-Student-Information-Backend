# Compact withdrawal and second-program forms

The PDF history table uses the supplied school's notation (`1 /2023 - 2024`), two decimal places for credits/GPA and one decimal place for conduct. Formatting happens only at the document boundary; the school data and semester identifiers are unchanged. Missing results stay blank; zero remains a published numeric zero. Unrecognised semester labels remain intact rather than guessing their year or merging summer periods.

All six history cells are centred inside the compiled source borders. The original source row height, baseline and Times New Roman font are retained. Empty sample rows no longer introduce a different font or alignment when populated. The first name column in these two forms uses the available space before the next label, avoiding premature wrapping. Long names still wrap and move the table down safely.

With representative synthetic data and seven or ten semesters, the second-program form remains one page including its receipt. The withdrawal form keeps its original two-page structure (application and separate receipt). Longer histories retain every row and paginate without shrinking the text. The separate second-program `Kể từ` paragraph retains the wording of the source form.

PDF generation still runs directly through PDFKit. No runtime Word conversion or school-database write is introduced. Existing PDF tabs are snapshots: reopen the form to see the updated formatting.
