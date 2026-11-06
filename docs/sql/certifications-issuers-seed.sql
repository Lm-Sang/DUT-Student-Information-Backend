-- Initial issuer catalog, sources checked on 2026-11-02.
-- This catalog does not change DUT recognition policies or certify an uploaded document.
-- Only missing codes/links are inserted. Reruns preserve administrative changes.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @vstepSource nvarchar(1000)=N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html';
  DECLARE @seed TABLE(Code varchar(50) PRIMARY KEY,DisplayName nvarchar(250),SourceUrl nvarchar(1000));
  INSERT @seed VALUES
    ('BRITISH_COUNCIL',N'British Council (Hội đồng Anh)',N'https://www.britishcouncil.vn/thi/aptis/ket-qua'),
    ('IDP',N'IDP IELTS',N'https://ielts.org/about-ielts'),
    ('ETS',N'Educational Testing Service (ETS)',N'https://www.ets.org/toeic/test-takers/scores.html'),
    ('JLPT_JF_JEES',N'The Japan Foundation / Japan Educational Exchanges and Services (JEES)',N'https://www.jlpt.jp/e/faq/'),
    ('CTI',N'Chinese Testing International (CTI)',N'https://admin.chinesetest.cn/gospquestion.do?con=HSK'),
    ('FR_MINISTRY_EDUCATION',N'Bộ Giáo dục Pháp (DELF/DALF; France Éducation international quản lý)',N'https://www.france-education-international.fr/hub/diplomes-tests?langue=fr'),
    ('FEI',N'France Éducation international',N'https://www.france-education-international.fr/hub/diplomes-tests?langue=fr'),
    ('JTEST',N'日本語検定協会・J.TEST事務局 (J.TEST)',N'https://j-test.jp/'),
    ('SC_TOP',N'Bộ Giáo dục Đài Loan (TOCFL; SC-TOP quản lý)',N'https://depart.moe.edu.tw/LA/News_Content.aspx?n=A2B4856EC48AD4BB&s=BA82EB1A6A12D2F1&sms=93C0F3C6842B8327');

  -- Official VSTEP list published 2025-03-31 (38 institutions). This records the
  -- source's names/date, rather than claiming a complete list for November 2026.
  INSERT @seed(Code,DisplayName,SourceUrl)
  SELECT Code,DisplayName,@vstepSource FROM (VALUES
    ('VSTEP_HCMUE',N'Trường Đại học Sư phạm TP. Hồ Chí Minh'),
    ('VSTEP_HUE',N'Trường Đại học Ngoại ngữ - Đại học Huế'),
    ('VSTEP_ULIS',N'Trường Đại học Ngoại ngữ - Đại học Quốc gia Hà Nội'),
    ('VSTEP_UFL',N'Trường Đại học Ngoại ngữ - Đại học Đà Nẵng'),
    ('VSTEP_TNU',N'Đại học Thái Nguyên'),
    ('VSTEP_CTU',N'Trường Đại học Cần Thơ'),
    ('VSTEP_HANU',N'Trường Đại học Hà Nội'),
    ('VSTEP_HNUE',N'Trường Đại học Sư phạm Hà Nội'),
    ('VSTEP_VINH',N'Trường Đại học Vinh'),
    ('VSTEP_SGU',N'Trường Đại học Sài Gòn'),
    ('VSTEP_HUB',N'Trường Đại học Ngân hàng TP. Hồ Chí Minh'),
    ('VSTEP_TVU',N'Trường Đại học Trà Vinh'),
    ('VSTEP_VLU',N'Trường Đại học Văn Lang'),
    ('VSTEP_QNU',N'Trường Đại học Quy Nhơn'),
    ('VSTEP_TAYNGUYEN',N'Trường Đại học Tây Nguyên'),
    ('VSTEP_ANND',N'Học viện An ninh Nhân dân'),
    ('VSTEP_AJC',N'Học viện Báo chí Tuyên truyền'),
    ('VSTEP_HUIT',N'Trường Đại học Công Thương Thành phố Hồ Chí Minh (HUIT)'),
    ('VSTEP_TMU',N'Trường Đại học Thương mại'),
    ('VSTEP_MSA',N'Học viện Khoa học Quân sự'),
    ('VSTEP_UEF',N'Trường Đại học Kinh tế - Tài chính TP.HCM'),
    ('VSTEP_USSH',N'Trường Đại học Khoa học Xã hội và Nhân văn, Đại học Quốc gia TP. HCM'),
    ('VSTEP_CSND',N'Học viện Cảnh sát Nhân dân'),
    ('VSTEP_HUST',N'Đại học Bách Khoa Hà Nội'),
    ('VSTEP_NCT',N'Trường Đại học Nam Cần Thơ'),
    ('VSTEP_FTU',N'Trường Đại học Ngoại thương'),
    ('VSTEP_IUH',N'Trường Đại học Công nghiệp TP. HCM'),
    ('VSTEP_NEU',N'Trường Đại học Kinh tế quốc dân'),
    ('VSTEP_UEH',N'Trường Đại học Kinh tế TP. HCM'),
    ('VSTEP_LHU',N'Trường Đại học Lạc Hồng'),
    ('VSTEP_DTHU',N'Trường Đại học Đồng Tháp'),
    ('VSTEP_DTU',N'Đại học Duy Tân'),
    ('VSTEP_PHENIKAA',N'Trường Đại học Phenikaa'),
    ('VSTEP_BAV',N'Học Viện Ngân hàng'),
    ('VSTEP_UFM',N'Trường ĐH Tài chính – Marketing'),
    ('VSTEP_TDU',N'Trường ĐH Thành Đông'),
    ('VSTEP_OU',N'Trường Đại học Mở thành phố Hồ Chí Minh'),
    ('VSTEP_HIU',N'Trường Đại học Quốc tế Hồng Bàng')
  ) v(Code,DisplayName);

  INSERT certification.IssuingOrganizations(Code,DisplayName,SourceUrl,VerifiedOn)
    SELECT s.Code,s.DisplayName,s.SourceUrl,CONVERT(date,'2026-11-02') FROM @seed s
    WHERE NOT EXISTS(SELECT 1 FROM certification.IssuingOrganizations o WITH(UPDLOCK,HOLDLOCK) WHERE o.Code=s.Code);
  DECLARE @links TABLE(TypeCode nvarchar(50),IssuerCode varchar(50));
  INSERT @links VALUES
    (N'IELTS','BRITISH_COUNCIL'),(N'IELTS','IDP'),
    (N'TOEIC','ETS'),(N'TOEIC_FOUR','ETS'),(N'TOEFLiBT','ETS'),(N'TOEFLITP','ETS'),
    (N'Aptis Esol','BRITISH_COUNCIL'),(N'JLPT','JLPT_JF_JEES'),
    (N'HSK','CTI'),(N'HSKK','CTI'),(N'DELF','FR_MINISTRY_EDUCATION'),(N'DALF','FR_MINISTRY_EDUCATION'),
    (N'TCF','FEI'),(N'J-TEST','JTEST'),(N'TOCFL','SC_TOP');
  INSERT @links SELECT N'VSTEP',Code FROM @seed WHERE Code LIKE 'VSTEP[_]%';
  INSERT certification.CertificateTypeIssuers(CertificateTypeId,IssuingOrganizationId)
    SELECT t.Id,o.Id FROM @links l JOIN certification.CertificateTypes t
      ON t.Code COLLATE Latin1_General_100_BIN2=l.TypeCode COLLATE Latin1_General_100_BIN2
    JOIN certification.IssuingOrganizations o ON o.Code=l.IssuerCode
    WHERE NOT EXISTS(SELECT 1 FROM certification.CertificateTypeIssuers r WITH(UPDLOCK,HOLDLOCK)
      WHERE r.CertificateTypeId=t.Id AND r.IssuingOrganizationId=o.Id);
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
