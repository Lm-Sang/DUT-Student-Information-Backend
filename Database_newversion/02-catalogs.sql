SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET CONCAT_NULL_YIELDS_NULL ON; SET ARITHABORT ON; SET NUMERIC_ROUNDABORT OFF;
GO
SET XACT_ABORT ON;
GO
BEGIN TRANSACTION;
GO
ALTER TABLE [academic_leave].[ApplicationHistory] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [academic_leave].[Applications] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountPermissions] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountProfiles] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountRoles] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountSecurityEvents] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountTasks] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Fields] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[LocalAccounts] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[PermissionDefinitions] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Permissions] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[RoleDefinitions] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[RolePermissions] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Roles] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[TaskPermissions] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Tasks] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[CertificateLevels] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[CertificateTypeIssuers] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[CertificateTypes] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[EvidenceFiles] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[IssuingOrganizations] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[Languages] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[RecognitionPolicies] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[StudentCertificates] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[tmCNTTChungChi] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[tmCNTTChungChi_SV] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[CauHinh] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[ChongGuiTrung] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DangNhapChuyenVien] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DeNghiEmail] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DeNghiVanBan] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DonDeNghi] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[His_InDon] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[KetQuaHocTapHocKy] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuRBAC] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuTruongDuLieu] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LoaiDon] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[NhanThan] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[PhienBanVaiTroQuyen] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[QuyenRBAC] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[QuyenXuLy] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[Sys_Email] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[Sys_VanBan] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TaiKhoan] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[tmKehoach] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[tmNganhTQ] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TruongCanBoSung] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TruongLoaiDon] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[VaiTroQuyen] NOCHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] NOCHECK CONSTRAINT ALL;
GO
SET IDENTITY_INSERT [certification].[Languages] ON
GO
INSERT [certification].[Languages] ([Id], [Code], [DisplayName], [IsPublished], [IsSchoolProvided], [Revision], [CreatedAt], [UpdatedAt]) VALUES (1, N'LN001', N'Tiếng Anh', 1, 1, 1, CAST(N'2026-10-24T18:21:34.7460000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7460000' AS DateTime2))
GO
INSERT [certification].[Languages] ([Id], [Code], [DisplayName], [IsPublished], [IsSchoolProvided], [Revision], [CreatedAt], [UpdatedAt]) VALUES (2, N'LN002', N'Tiếng Pháp', 1, 1, 1, CAST(N'2026-10-24T18:21:34.7470000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7470000' AS DateTime2))
GO
INSERT [certification].[Languages] ([Id], [Code], [DisplayName], [IsPublished], [IsSchoolProvided], [Revision], [CreatedAt], [UpdatedAt]) VALUES (3, N'LN003', N'Tiếng Nhật', 1, 1, 1, CAST(N'2026-10-24T18:21:34.7470000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7470000' AS DateTime2))
GO
INSERT [certification].[Languages] ([Id], [Code], [DisplayName], [IsPublished], [IsSchoolProvided], [Revision], [CreatedAt], [UpdatedAt]) VALUES (4, N'LN004', N'Tiếng Trung', 1, 1, 1, CAST(N'2026-10-24T18:21:34.7470000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7470000' AS DateTime2))
GO
SET IDENTITY_INSERT [certification].[Languages] OFF
GO
SET IDENTITY_INSERT [certification].[CertificateTypes] ON
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (1, 1, N'TOEFLiBT', N'Anh ngữ - TOEFL iBT', N'{"fields":[{"key":"overall","label":"Điểm tổng","type":"number","required":true,"min":0,"max":9999999.99,"step":0.01}]}', 0, 1, 1, 1, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (2, 1, N'VSTEP', N'VSTEP và tương đương', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 1, 2, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (3, 1, N'IELTS', N'Anh ngữ - IELTS', N'{"fields":[{"key":"overall","label":"Điểm tổng","type":"number","required":true,"min":0,"max":9,"step":0.5}]}', 1, 1, 3, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7530000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7530000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (4, 1, N'TOEFLCBT', N'Anh ngữ - TOEFL CBT', N'{"fields":[{"key":"overall","label":"Điểm tổng","type":"number","required":true,"min":0,"max":9999999.99,"step":0.01}]}', 0, 1, 4, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (5, 3, N'JLPT', N'Nhật ngữ - JLPT', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 1, 5, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (6, 1, N'TOEIC', N'Anh ngữ - TOEIC', N'{"fields":[{"key":"lrTotal","label":"Tổng Nghe - Đọc","type":"number","required":true,"min":10,"max":990,"step":5}]}', 1, 1, 6, 1, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (7, 4, N'HSK', N'Tiếng Trung - HSK', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 1, 7, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 2, CAST(N'2026-10-24T18:21:34.7530000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4240000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (8, 2, N'DELF', N'Tiếng Pháp', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 1, 8, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 2, CAST(N'2026-10-24T18:21:34.7530000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4240000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (9, 1, N'TOEFLITP', N'Anh ngữ - TOEFL_ITP', N'{"fields":[{"key":"overall","label":"Điểm tổng","type":"number","required":true,"min":0,"max":9999999.99,"step":0.01}]}', 0, 1, 9, 1, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (10, 1, N'Aptis Esol', N'Anh ngữ - Aptis Esol', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 1, 10, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7530000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7530000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (11, 3, N'NAT', N'Nhật ngữ - NAT-test', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 0, 1, 12, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 2, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4370000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (12, 3, N'TOPJ', N'Nhật ngữ - TOPJ', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 0, 1, 14, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 2, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4370000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (13, NULL, N'XXX', N'', N'{"fields":[{"key":"overall","label":"Kết quả chưa cấu hình","type":"number","required":true,"min":0,"max":9999999.99,"step":0.01}]}', 0, 1, 15, 0, N'', CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset), NULL, 1, CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7540000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (14, 1, N'TOEIC_FOUR', N'Anh ngữ - TOEIC 4 kỹ năng', N'{"fields":[{"key":"listening","label":"Nghe","type":"number","required":true,"min":5,"max":495,"step":5},{"key":"reading","label":"Đọc","type":"number","required":true,"min":5,"max":495,"step":5},{"key":"speaking","label":"Nói","type":"number","required":true,"min":0,"max":200,"step":10},{"key":"writing","label":"Viết","type":"number","required":true,"min":0,"max":200,"step":10}]}', 1, 0, NULL, NULL, NULL, NULL, 6, 1, CAST(N'2026-10-24T18:21:34.7550000' AS DateTime2), CAST(N'2026-10-24T18:21:34.7550000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (15, 2, N'DALF', N'Tiếng Pháp - DALF', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 0, NULL, NULL, NULL, NULL, NULL, 1, CAST(N'2026-10-25T04:30:41.4110000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4110000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (16, 4, N'HSKK', N'Tiếng Trung - HSKK', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 0, NULL, NULL, NULL, NULL, NULL, 1, CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (17, 3, N'J-TEST', N'Nhật ngữ - J-TEST', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 0, NULL, NULL, NULL, NULL, NULL, 1, CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (18, 2, N'TCF', N'Tiếng Pháp - TCF', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 0, NULL, NULL, NULL, NULL, NULL, 1, CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2))
GO
INSERT [certification].[CertificateTypes] ([Id], [LanguageId], [Code], [DisplayName], [FormSchemaJson], [IsPublished], [IsSchoolProvided], [SchoolId], [ConversionFlag], [Notes], [ImportedAt], [BaseCertificateTypeId], [Revision], [CreatedAt], [UpdatedAt]) VALUES (19, 4, N'TOCFL', N'Tiếng Trung - TOCFL', N'{"fields":[{"key":"level","label":"Bậc / trình độ","type":"select","required":true,"optionsFrom":"certificateLevels"}]}', 1, 0, NULL, NULL, NULL, NULL, NULL, 1, CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2), CAST(N'2026-10-25T04:30:41.4120000' AS DateTime2))
GO
SET IDENTITY_INSERT [certification].[CertificateTypes] OFF
GO
SET IDENTITY_INSERT [certification].[RecognitionPolicies] ON
GO
INSERT [certification].[RecognitionPolicies] ([Id], [LanguageId], [CertificateTypeId], [CohortFrom], [CohortTo], [IsRecognized], [Reason], [DocumentReference], [Revision], [CreatedAt], [UpdatedAt]) VALUES (1, 1, NULL, 1900, NULL, 1, NULL, N'Điều kiện tiếp nhận do người dùng xác nhận ngày 25/10/2026', 2, CAST(N'2026-10-25T03:39:07.0010000' AS DateTime2), CAST(N'2026-10-25T04:45:51.3720000' AS DateTime2))
GO
INSERT [certification].[RecognitionPolicies] ([Id], [LanguageId], [CertificateTypeId], [CohortFrom], [CohortTo], [IsRecognized], [Reason], [DocumentReference], [Revision], [CreatedAt], [UpdatedAt]) VALUES (2, 2, NULL, 1900, NULL, 1, NULL, N'Điều kiện tiếp nhận do người dùng xác nhận ngày 25/10/2026', 1, CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2), CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2))
GO
INSERT [certification].[RecognitionPolicies] ([Id], [LanguageId], [CertificateTypeId], [CohortFrom], [CohortTo], [IsRecognized], [Reason], [DocumentReference], [Revision], [CreatedAt], [UpdatedAt]) VALUES (3, 3, NULL, 1900, NULL, 1, NULL, N'Điều kiện tiếp nhận do người dùng xác nhận ngày 25/10/2026', 1, CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2), CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2))
GO
INSERT [certification].[RecognitionPolicies] ([Id], [LanguageId], [CertificateTypeId], [CohortFrom], [CohortTo], [IsRecognized], [Reason], [DocumentReference], [Revision], [CreatedAt], [UpdatedAt]) VALUES (4, 4, NULL, 1900, NULL, 1, NULL, N'Điều kiện tiếp nhận do người dùng xác nhận ngày 25/10/2026', 1, CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2), CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2))
GO
INSERT [certification].[RecognitionPolicies] ([Id], [LanguageId], [CertificateTypeId], [CohortFrom], [CohortTo], [IsRecognized], [Reason], [DocumentReference], [Revision], [CreatedAt], [UpdatedAt]) VALUES (5, NULL, 6, 1900, 2023, 1, NULL, N'Điều kiện tiếp nhận do người dùng xác nhận ngày 25/10/2026', 1, CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2), CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2))
GO
INSERT [certification].[RecognitionPolicies] ([Id], [LanguageId], [CertificateTypeId], [CohortFrom], [CohortTo], [IsRecognized], [Reason], [DocumentReference], [Revision], [CreatedAt], [UpdatedAt]) VALUES (6, NULL, 6, 2024, NULL, 0, N'Từ khóa 2024 trở đi không tiếp nhận TOEIC 2 kỹ năng. Vui lòng nộp TOEIC 4 kỹ năng hoặc loại chứng chỉ khác.', N'Điều kiện tiếp nhận do người dùng xác nhận ngày 25/10/2026', 1, CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2), CAST(N'2026-10-25T04:45:51.3740000' AS DateTime2))
GO
SET IDENTITY_INSERT [certification].[RecognitionPolicies] OFF
GO
SET IDENTITY_INSERT [certification].[CertificateLevels] ON
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (1, 2, N'VSTEP1', N'VSTEP A1', 1, N'', 1, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (2, 2, N'VSTEP2', N'VSTEP A2', 2, N'', 2, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (3, 2, N'VSTEP3', N'VSTEP B1', 3, N'', 3, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (4, 2, N'VSTEP4', N'VSTEP B2', 4, N'', 4, 1, 4, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (5, 2, N'VSTEP5', N'VSTEP C1', 5, N'', 5, 1, 5, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (6, 2, N'VSTEP6', N'VSTEP C2', 6, N'', 6, 1, 6, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (7, 5, N'JLPT1', N'Nhật ngữ - JLPT N5', 1, N'', 7, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (8, 5, N'JLPT2', N'Nhật ngữ - JLPT N4', 2, N'', 8, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (9, 5, N'JLPT3', N'Nhật ngữ - JLPT N3', 3, N'', 9, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (10, 5, N'JLPT4', N'Nhật ngữ - JLPT N2', 4, N'', 10, 1, 4, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (11, 5, N'JLPT5', N'Nhật ngữ - JLPT N1', 5, N'', 11, 1, 5, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (12, 3, N'IELTS1', N'IELTS 4.0', 1, N'', 12, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (13, 3, N'IELTS2', N'IELTS 4.5', 2, N'', 13, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (14, 3, N'IELTS3', N'IELTS 5.0', 3, N'', 14, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (15, 3, N'IELTS4', N'IELTS 5.5', 4, N'', 15, 1, 4, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (16, 3, N'IELTS5', N'IELTS 6.0', 5, N'', 16, 1, 5, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (17, 3, N'IELTS6', N'IELTS 6.5', 6, N'', 17, 1, 6, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (18, 3, N'IELTS7', N'IELTS 7.0', 7, N'', 18, 1, 7, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (19, 3, N'IELTS8', N'IELTS 7.5', 8, N'', 19, 1, 8, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (20, 3, N'IELTS9', N'IELTS 8.0', 9, N'', 20, 1, 9, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (21, 7, N'HSK1', N'Tiếng Trung HSK 1', 1, N'', 25, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (22, 7, N'HSK2', N'Tiếng Trung HSK 2', 2, N'', 26, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (23, 7, N'HSK3', N'Tiếng Trung HSK 3', 3, N'', 27, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (24, 7, N'HSK4', N'Tiếng Trung HSK 4', 4, N'', 28, 1, 4, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (25, 8, N'DELF1', N'DELF A2', 1, N'', 29, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (26, 8, N'DELF2', N'DELF B1', 2, N'', 30, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (27, 8, N'DELF3', N'DELF B2', 3, N'', 31, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (28, 7, N'HSK5', N'Tiếng Trung HSK 5', 5, N'', 32, 1, 5, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (29, 1, NULL, NULL, NULL, NULL, 33, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (30, 10, N'Aptis3', N'Aptis Esol B1', 1, N'', 34, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (31, 10, N'Aptis4', N'Aptis Esol B2', 2, N'', 35, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (32, 10, N'Aptis5', N'Aptis Esol C1', 3, N'', 36, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (33, 10, N'Aptis6', N'Aptis Esol C2', 4, N'', 37, 1, 4, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (34, 11, N'NAT01', N'Nhật ngữ- 3Kyu-B1-N4', 1, N'', 38, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (35, 11, N'NAT02', N'Nhật ngữ- 2Kyu(B)-B2-N3', 2, N'', 39, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (36, 11, N'NAT03', N'Nhật ngữ- 2Kyu(A)-C1-N2', 3, N'', 40, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (37, 12, N'TOPJ3', N'TopJ-N4', 1, N'', 41, 1, 1, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (38, 12, N'TOPJ4', N'TopJ-N3', 2, N'', 42, 1, 2, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (39, 12, N'TOPJ5', N'TopJ-N2', 3, N'', 43, 1, 3, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (40, 12, N'TOPJ6', N'TopJ-N1', 4, N'', 44, 1, 4, CAST(N'2026-10-24T18:12:19.4630000+00:00' AS DateTimeOffset))
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (41, 15, N'DALF_C1', N'DALF C1', NULL, NULL, NULL, 0, 1, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (42, 15, N'DALF_C2', N'DALF C2', NULL, NULL, NULL, 0, 2, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (43, 8, N'DELF_A1', N'DELF A1', NULL, NULL, NULL, 0, 0, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (44, 7, N'HSK6', N'Tiếng Trung HSK 6', NULL, NULL, NULL, 0, 6, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (45, 7, N'HSK7', N'Tiếng Trung HSK 7', NULL, NULL, NULL, 0, 7, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (46, 7, N'HSK8', N'Tiếng Trung HSK 8', NULL, NULL, NULL, 0, 8, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (47, 7, N'HSK9', N'Tiếng Trung HSK 9', NULL, NULL, NULL, 0, 9, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (48, 16, N'HSKK_BASIC', N'HSKK Sơ cấp', NULL, NULL, NULL, 0, 1, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (49, 16, N'HSKK_INTERMEDIATE', N'HSKK Trung cấp', NULL, NULL, NULL, 0, 2, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (50, 16, N'HSKK_ADVANCED', N'HSKK Cao cấp', NULL, NULL, NULL, 0, 3, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (51, 17, N'JTEST_G', N'J-TEST cấp G', NULL, NULL, NULL, 0, 1, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (52, 17, N'JTEST_F', N'J-TEST cấp F', NULL, NULL, NULL, 0, 2, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (53, 17, N'JTEST_E', N'J-TEST cấp E', NULL, NULL, NULL, 0, 3, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (54, 17, N'JTEST_D', N'J-TEST cấp D', NULL, NULL, NULL, 0, 4, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (55, 17, N'JTEST_C', N'J-TEST cấp C', NULL, NULL, NULL, 0, 5, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (56, 17, N'JTEST_PRE_B', N'J-TEST cấp Pre-B', NULL, NULL, NULL, 0, 6, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (57, 17, N'JTEST_B', N'J-TEST cấp B', NULL, NULL, NULL, 0, 7, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (58, 17, N'JTEST_PRE_A', N'J-TEST cấp Pre-A', NULL, NULL, NULL, 0, 8, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (59, 17, N'JTEST_A', N'J-TEST cấp A', NULL, NULL, NULL, 0, 9, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (60, 17, N'JTEST_SPECIAL_A', N'J-TEST cấp Đặc biệt A', NULL, NULL, NULL, 0, 10, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (61, 18, N'TCF_A1', N'TCF A1', NULL, NULL, NULL, 0, 1, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (62, 18, N'TCF_A2', N'TCF A2', NULL, NULL, NULL, 0, 2, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (63, 18, N'TCF_B1', N'TCF B1', NULL, NULL, NULL, 0, 3, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (64, 18, N'TCF_B2', N'TCF B2', NULL, NULL, NULL, 0, 4, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (65, 18, N'TCF_C1', N'TCF C1', NULL, NULL, NULL, 0, 5, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (66, 18, N'TCF_C2', N'TCF C2', NULL, NULL, NULL, 0, 6, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (67, 19, N'TOCFL_NOVICE_1', N'TOCFL Novice 1', NULL, NULL, NULL, 0, 1, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (68, 19, N'TOCFL_NOVICE_2', N'TOCFL Novice 2', NULL, NULL, NULL, 0, 2, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (69, 19, N'TOCFL1', N'TOCFL Level 1', NULL, NULL, NULL, 0, 3, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (70, 19, N'TOCFL2', N'TOCFL Level 2', NULL, NULL, NULL, 0, 4, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (71, 19, N'TOCFL3', N'TOCFL Level 3', NULL, NULL, NULL, 0, 5, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (72, 19, N'TOCFL4', N'TOCFL Level 4', NULL, NULL, NULL, 0, 6, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (73, 19, N'TOCFL5', N'TOCFL Level 5', NULL, NULL, NULL, 0, 7, NULL)
GO
INSERT [certification].[CertificateLevels] ([Id], [CertificateTypeId], [Code], [DisplayName], [Weight], [Notes], [SchoolId], [IsSchoolProvided], [SortOrder], [ImportedAt]) VALUES (74, 19, N'TOCFL6', N'TOCFL Level 6', NULL, NULL, NULL, 0, 8, NULL)
GO
SET IDENTITY_INSERT [certification].[CertificateLevels] OFF
GO
SET IDENTITY_INSERT [certification].[IssuingOrganizations] ON
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (1, N'BRITISH_COUNCIL', N'British Council (Hội đồng Anh)', 1, N'https://www.britishcouncil.vn/thi/aptis/ket-qua', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (2, N'CTI', N'Chinese Testing International (CTI)', 1, N'https://admin.chinesetest.cn/gospquestion.do?con=HSK', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (3, N'ETS', N'Educational Testing Service (ETS)', 1, N'https://www.ets.org/toeic/test-takers/scores.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (4, N'FEI', N'France Éducation international', 1, N'https://www.france-education-international.fr/hub/diplomes-tests?langue=fr', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (5, N'FR_MINISTRY_EDUCATION', N'Bộ Giáo dục Pháp (DELF/DALF; France Éducation international quản lý)', 1, N'https://www.france-education-international.fr/hub/diplomes-tests?langue=fr', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (6, N'IDP', N'IDP IELTS', 1, N'https://ielts.org/about-ielts', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (7, N'JLPT_JF_JEES', N'The Japan Foundation / Japan Educational Exchanges and Services (JEES)', 1, N'https://www.jlpt.jp/e/faq/', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (8, N'JTEST', N'日本語検定協会・J.TEST事務局 (J.TEST)', 1, N'https://j-test.jp/', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (9, N'SC_TOP', N'B? Gi?o d?c ??i Loan (TOCFL; SC-TOP qu?n l?)', 1, N'https://depart.moe.edu.tw/LA/News_Content.aspx?n=A2B4856EC48AD4BB&s=BA82EB1A6A12D2F1&sms=93C0F3C6842B8327', CAST(N'2026-11-02' AS Date), 2, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:49:48.2010000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (10, N'VSTEP_AJC', N'Học viện Báo chí Tuyên truyền', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (11, N'VSTEP_ANND', N'Học viện An ninh Nhân dân', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (12, N'VSTEP_BAV', N'Học Viện Ngân hàng', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (13, N'VSTEP_CSND', N'Học viện Cảnh sát Nhân dân', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (14, N'VSTEP_CTU', N'Trường Đại học Cần Thơ', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (15, N'VSTEP_DTHU', N'Trường Đại học Đồng Tháp', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (16, N'VSTEP_DTU', N'Đại học Duy Tân', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (17, N'VSTEP_FTU', N'Trường Đại học Ngoại thương', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (18, N'VSTEP_HANU', N'Trường Đại học Hà Nội', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (19, N'VSTEP_HCMUE', N'Trường Đại học Sư phạm TP. Hồ Chí Minh', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (20, N'VSTEP_HIU', N'Trường Đại học Quốc tế Hồng Bàng', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (21, N'VSTEP_HNUE', N'Trường Đại học Sư phạm Hà Nội', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (22, N'VSTEP_HUB', N'Trường Đại học Ngân hàng TP. Hồ Chí Minh', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (23, N'VSTEP_HUE', N'Trường Đại học Ngoại ngữ - Đại học Huế', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (24, N'VSTEP_HUIT', N'Trường Đại học Công Thương Thành phố Hồ Chí Minh (HUIT)', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (25, N'VSTEP_HUST', N'Đại học Bách Khoa Hà Nội', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (26, N'VSTEP_IUH', N'Trường Đại học Công nghiệp TP. HCM', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (27, N'VSTEP_LHU', N'Trường Đại học Lạc Hồng', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (28, N'VSTEP_MSA', N'Học viện Khoa học Quân sự', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (29, N'VSTEP_NCT', N'Trường Đại học Nam Cần Thơ', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (30, N'VSTEP_NEU', N'Trường Đại học Kinh tế quốc dân', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (31, N'VSTEP_OU', N'Trường Đại học Mở thành phố Hồ Chí Minh', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (32, N'VSTEP_PHENIKAA', N'Trường Đại học Phenikaa', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (33, N'VSTEP_QNU', N'Trường Đại học Quy Nhơn', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (34, N'VSTEP_SGU', N'Trường Đại học Sài Gòn', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (35, N'VSTEP_TAYNGUYEN', N'Trường Đại học Tây Nguyên', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (36, N'VSTEP_TDU', N'Trường ĐH Thành Đông', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (37, N'VSTEP_TMU', N'Trường Đại học Thương mại', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (38, N'VSTEP_TNU', N'Đại học Thái Nguyên', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (39, N'VSTEP_TVU', N'Trường Đại học Trà Vinh', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (40, N'VSTEP_UEF', N'Trường Đại học Kinh tế - Tài chính TP.HCM', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (41, N'VSTEP_UEH', N'Trường Đại học Kinh tế TP. HCM', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (42, N'VSTEP_UFL', N'Trường Đại học Ngoại ngữ - Đại học Đà Nẵng', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (43, N'VSTEP_UFM', N'Trường ĐH Tài chính – Marketing', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (44, N'VSTEP_ULIS', N'Trường Đại học Ngoại ngữ - Đại học Quốc gia Hà Nội', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (45, N'VSTEP_USSH', N'Trường Đại học Khoa học Xã hội và Nhân văn, Đại học Quốc gia TP. HCM', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (46, N'VSTEP_VINH', N'Trường Đại học Vinh', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
INSERT [certification].[IssuingOrganizations] ([Id], [Code], [DisplayName], [IsActive], [SourceUrl], [VerifiedOn], [Revision], [CreatedAt], [UpdatedAt]) VALUES (47, N'VSTEP_VLU', N'Trường Đại học Văn Lang', 1, N'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html', CAST(N'2026-11-02' AS Date), 1, CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2), CAST(N'2026-11-02T09:45:57.4880000' AS DateTime2))
GO
SET IDENTITY_INSERT [certification].[IssuingOrganizations] OFF
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (1, 3, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 10, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 11, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 12, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 13, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 14, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 15, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 16, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 17, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 18, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 19, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 20, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 21, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 22, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 23, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 24, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 25, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 26, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 27, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 28, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 29, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 30, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 31, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 32, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 33, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 34, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 35, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 36, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 37, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 38, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 39, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 40, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 41, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 42, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 43, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 44, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 45, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 46, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (2, 47, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (3, 1, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (3, 6, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (5, 7, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (6, 3, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (7, 2, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (8, 5, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (9, 3, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (10, 1, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (14, 3, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (15, 5, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (16, 2, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (17, 8, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (18, 4, 1)
GO
INSERT [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId], [IsActive]) VALUES (19, 9, 1)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'CONFIRMATION', N'Cấp văn bản xác nhận', N'CONFIRMATION', N'BY_DOCUMENT', N'WEB', N'CONFIRMATION', NULL, N'file', N'Bảng điểm, xác nhận sinh viên, vay vốn, hoãn NVQS và kết quả rèn luyện.', 1, 6)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'DonSV01', N'Cấp lại thẻ sinh viên', N'PETITION', N'115', N'PAPER_FORM', N'DonSV01', N'DonSV01', N'card', N'Mất, hỏng thẻ hoặc cần thay đổi thông tin.', 1, 0)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'DonSV03', N'Xét công nhận tốt nghiệp', N'PETITION', N'115', N'PAPER_FORM', N'DonSV03', N'DonSV03', N'graduation', N'Đăng ký học kỳ dự kiến tốt nghiệp.', 1, 1)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'DonSV04', N'Hoãn công nhận tốt nghiệp', N'PETITION', N'115', N'PAPER_FORM', N'DonSV04', N'DonSV04', N'calendar', N'Đơn theo mẫu cố định để học cải thiện; tự động điền hồ sơ sinh viên.', 1, 2)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'DonSV05', N'Xét học bổng khuyến học', N'PETITION', N'115', N'PAPER_FORM', N'DonSV05', N'DonSV05', N'award', N'Đề nghị xét học bổng theo học kỳ, kèm lý do.', 1, 3)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'DonSV06', N'Giải quyết thủ tục thôi học', N'PETITION', N'115', N'PAPER_FORM', N'DonSV06', N'DonSV06', N'file', N'Đề nghị thôi học theo nguyện vọng hoặc chuyển trường.', 1, 5)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'DonSV07', N'Đăng ký chương trình 2', N'PETITION', N'115', N'PAPER_FORM', N'DonSV07', N'DonSV07', N'books', N'Chọn chương trình đào tạo và kỳ bắt đầu.', 1, 4)
GO
INSERT [svc_demo].[LoaiDon] ([MaLoaiDon], [TenLoaiDon], [Nhom], [MaDV], [CachNop], [MaMauDuLieu], [MaMauIn], [BieuTuong], [MoTa], [HieuLuc], [ThuTu]) VALUES (N'LMS_SUPPORT', N'Cấp lại mật khẩu DUT-LMS', N'LMS', N'115', N'WEB', N'LMS_SUPPORT', NULL, N'card', N'Bấm gửi yêu cầu. Chuyên viên sẽ phản hồi mật khẩu trong chi tiết yêu cầu.', 1, 7)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'academicYear', 0, 6)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'additionalInfo', 0, 1)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'documentCode', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'feeMode', 0, 3)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'periodTerm', 0, 5)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'quantity', 0, 2)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'CONFIRMATION', N'serviceSpeed', 0, 4)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV01', N'changeDescription', 0, 1)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV01', N'reasonCode', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV03', N'expectedTerm', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV04', N'reason', 0, 1)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV04', N'targetTerm', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV05', N'reason', 0, 1)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV05', N'reviewTerm', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV06', N'reasonCode', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV06', N'reasonDetail', 0, 1)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV07', N'programCode', 0, 0)
GO
INSERT [svc_demo].[TruongLoaiDon] ([MaLoaiDon], [TenTruong], [BatBuoc], [ThuTu]) VALUES (N'DonSV07', N'startTerm', 0, 1)
GO
INSERT [auth].[Roles] ([RoleName]) VALUES (N'reviewer')
GO
INSERT [auth].[Roles] ([RoleName]) VALUES (N'role:07460fdf-68b2-48d7-bcc9-9a5205cd64c0')
GO
INSERT [auth].[Roles] ([RoleName]) VALUES (N'role:277c2fcd-5604-40c2-8d7c-320011b5615e')
GO
INSERT [auth].[Roles] ([RoleName]) VALUES (N'role:6231cd8b-b00a-4938-a489-03f47a68db7b')
GO
INSERT [auth].[Roles] ([RoleName]) VALUES (N'role:8e594441-b6fd-4cce-bac5-b682904e6575')
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'DT', N'Đào tạo', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'KT', N'Khảo thí', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'PC', N'Pháp chế', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'QC', N'Quy chế - Quy định', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'SSERC', N'TTHTSV & QHDN', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'SV', N'Công tác sinh viên', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'TC', N'Kế hoạch - Tài chính', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'TTHL', N'Trung tâm học liệu', 1)
GO
INSERT [auth].[Fields] ([FieldCode], [FieldName], [IsActive]) VALUES (N'TTTH', N'Trung Tâm Tin học', 1)
GO
INSERT [auth].[RoleDefinitions] ([RoleName], [DisplayName], [Description], [FieldCode], [IsActive], [Revision]) VALUES (N'role:07460fdf-68b2-48d7-bcc9-9a5205cd64c0', N'Chuyên viên Anh ngữ - IELTS', N'Role mẫu chỉ cấp đúng loại hồ sơ và Excel tương ứng.', N'DT', 1, 1)
GO
INSERT [auth].[RoleDefinitions] ([RoleName], [DisplayName], [Description], [FieldCode], [IsActive], [Revision]) VALUES (N'role:277c2fcd-5604-40c2-8d7c-320011b5615e', N'Chuyên viên xác nhận hoãn NVQS', N'Role mẫu chỉ cấp đúng loại hồ sơ và Excel tương ứng.', N'DT', 1, 1)
GO
INSERT [auth].[RoleDefinitions] ([RoleName], [DisplayName], [Description], [FieldCode], [IsActive], [Revision]) VALUES (N'role:6231cd8b-b00a-4938-a489-03f47a68db7b', N'Chuyên viên trở lại học', N'Role mẫu chỉ cấp đúng loại hồ sơ và Excel tương ứng.', N'DT', 1, 1)
GO
INSERT [auth].[RoleDefinitions] ([RoleName], [DisplayName], [Description], [FieldCode], [IsActive], [Revision]) VALUES (N'role:8e594441-b6fd-4cce-bac5-b682904e6575', N'Chuyên viên ngừng học / gia hạn', N'Role mẫu chỉ cấp đúng loại hồ sơ và Excel tương ứng.', N'DT', 1, 1)
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'academic-leave:review')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'academic-leave:workbook:export')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'academic-leave:workbook:import')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'certifications:catalog:manage')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'certifications:review')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'certifications:workbook:export')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'certifications:workbook:import')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'it-certifications:workbook:export')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'it-certifications:workbook:import')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:academic-leave:leave')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:academic-leave:return')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:1')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:10')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:11')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:12')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:13')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:14')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:15')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:16')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:17')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:18')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:19')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:2')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:3')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:4')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:5')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:6')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:7')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:8')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:certifications:9')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:01')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:02')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:03')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:04')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:05')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:06')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:08')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:09')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:10')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:13')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:CONFIRMATION:18')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:DonSV01')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:DonSV03')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:DonSV04')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:DonSV05')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:DonSV06')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:DonSV07')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:it-certifications:CNTT01')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:it-certifications:CNTT02')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'work:LMS_SUPPORT')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'workbook.export')
GO
INSERT [auth].[Permissions] ([PermissionName]) VALUES (N'workbook.import')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:07460fdf-68b2-48d7-bcc9-9a5205cd64c0', N'certifications:workbook:export')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:07460fdf-68b2-48d7-bcc9-9a5205cd64c0', N'certifications:workbook:import')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:07460fdf-68b2-48d7-bcc9-9a5205cd64c0', N'work:certifications:3')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:277c2fcd-5604-40c2-8d7c-320011b5615e', N'work:CONFIRMATION:13')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:277c2fcd-5604-40c2-8d7c-320011b5615e', N'workbook.export')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:277c2fcd-5604-40c2-8d7c-320011b5615e', N'workbook.import')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:6231cd8b-b00a-4938-a489-03f47a68db7b', N'academic-leave:workbook:export')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:6231cd8b-b00a-4938-a489-03f47a68db7b', N'academic-leave:workbook:import')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:6231cd8b-b00a-4938-a489-03f47a68db7b', N'work:academic-leave:return')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:8e594441-b6fd-4cce-bac5-b682904e6575', N'academic-leave:workbook:export')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:8e594441-b6fd-4cce-bac5-b682904e6575', N'academic-leave:workbook:import')
GO
INSERT [auth].[RolePermissions] ([RoleName], [PermissionName]) VALUES (N'role:8e594441-b6fd-4cce-bac5-b682904e6575', N'work:academic-leave:leave')
GO
INSERT [auth].[Tasks] ([TaskId], [TaskCode], [TaskName], [FieldCode], [IsActive]) VALUES (1, N'certifications', N'Chứng chỉ ngoại ngữ', N'DT', 1)
GO
INSERT [auth].[Tasks] ([TaskId], [TaskCode], [TaskName], [FieldCode], [IsActive]) VALUES (2, N'it-certifications', N'Chứng chỉ tin học', N'DT', 1)
GO
INSERT [auth].[Tasks] ([TaskId], [TaskCode], [TaskName], [FieldCode], [IsActive]) VALUES (3, N'academic-leave', N'Ngừng học / tiếp tục học', N'DT', 1)
GO
INSERT [auth].[Tasks] ([TaskId], [TaskCode], [TaskName], [FieldCode], [IsActive]) VALUES (4, N'student-requests', N'Lập và xử lý đơn', N'DT', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'academic-leave:workbook:export', N'Xuất Excel học vụ', N'Excel', N'DT', 3, N'academic-leave', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'academic-leave:workbook:import', N'Nhập Excel học vụ', N'Excel', N'DT', 3, N'academic-leave', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'certifications:catalog:manage', N'Quản lý danh mục chứng chỉ', N'Danh mục', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'certifications:workbook:export', N'Xuất Excel chứng chỉ ngoại ngữ', N'Excel', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'certifications:workbook:import', N'Nhập Excel chứng chỉ ngoại ngữ', N'Excel', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'it-certifications:workbook:export', N'Xuất Excel chứng chỉ tin học', N'Excel', N'DT', 2, N'it-certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'it-certifications:workbook:import', N'Nhập Excel chứng chỉ tin học', N'Excel', N'DT', 2, N'it-certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:academic-leave:leave', N'Xử lý ngừng học và gia hạn ngừng học', N'Học vụ', N'DT', 3, N'academic-leave', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:academic-leave:return', N'Xử lý trở lại học', N'Học vụ', N'DT', 3, N'academic-leave', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:1', N'Xử lý: Anh ngữ - TOEFL iBT', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:10', N'Xử lý: Anh ngữ - Aptis Esol', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:11', N'Xử lý: Nhật ngữ - NAT-test', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:12', N'Xử lý: Nhật ngữ - TOPJ', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:13', N'Xử lý: XXX', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:14', N'Xử lý: Anh ngữ - TOEIC 4 kỹ năng', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:15', N'Xử lý: Tiếng Pháp - DALF', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:16', N'Xử lý: Tiếng Trung - HSKK', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:17', N'Xử lý: Nhật ngữ - J-TEST', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:18', N'Xử lý: Tiếng Pháp - TCF', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:19', N'Xử lý: Tiếng Trung - TOCFL', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:2', N'Xử lý: VSTEP và tương đương', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:3', N'Xử lý: Anh ngữ - IELTS', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:4', N'Xử lý: Anh ngữ - TOEFL CBT', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:5', N'Xử lý: Nhật ngữ - JLPT', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:6', N'Xử lý: Anh ngữ - TOEIC', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:7', N'Xử lý: Tiếng Trung - HSK', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:8', N'Xử lý: Tiếng Pháp', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:certifications:9', N'Xử lý: Anh ngữ - TOEFL_ITP', N'Chứng chỉ ngoại ngữ', N'DT', 1, N'certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:01', N'Xử lý: Xác nhận sinh viên', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:02', N'Xử lý: Xác nhận SV vay tiền', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:03', N'Xử lý: Kết quả rèn luyện', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:04', N'Xử lý: Bảng điểm học kỳ', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:05', N'Xử lý: Bảng điểm năm học', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:06', N'Xử lý: Bảng điểm quá trình', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:08', N'Xử lý: Bảng điểm học kỳ (tiếng Anh)', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:09', N'Xử lý: Bảng điểm năm học (tiếng Anh)', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:10', N'Xử lý: Bảng điểm quá trình (tiếng Anh)', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:13', N'Xử lý: Xác nhận hoãn NVQS', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:CONFIRMATION:18', N'Xử lý: SV học quá KHĐT chuẩn - Xác nhận hoãn NVQS', N'Đơn xác nhận', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:DonSV01', N'Xử lý: Cấp lại thẻ sinh viên', N'Đơn đề nghị', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:DonSV03', N'Xử lý: Xét công nhận tốt nghiệp', N'Đơn đề nghị', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:DonSV04', N'Xử lý: Hoãn công nhận tốt nghiệp', N'Đơn đề nghị', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:DonSV05', N'Xử lý: Xét học bổng khuyến học', N'Đơn đề nghị', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:DonSV06', N'Xử lý: Giải quyết thủ tục thôi học', N'Đơn đề nghị', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:DonSV07', N'Xử lý: Đăng ký chương trình 2', N'Đơn đề nghị', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:it-certifications:CNTT01', N'Xử lý: Chứng chỉ CNTT cơ bản', N'Chứng chỉ tin học', N'DT', 2, N'it-certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:it-certifications:CNTT02', N'Xử lý: Chứng chỉ CNTT nâng cao', N'Chứng chỉ tin học', N'DT', 2, N'it-certifications', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'work:LMS_SUPPORT', N'Xử lý yêu cầu cấp lại mật khẩu LMS', N'Hỗ trợ LMS', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'workbook.export', N'Xuất Excel đơn đề nghị / xác nhận', N'Excel', N'DT', 4, N'student-requests', 1)
GO
INSERT [auth].[PermissionDefinitions] ([PermissionName], [DisplayName], [GroupName], [FieldCode], [TaskId], [ModuleCode], [IsActive]) VALUES (N'workbook.import', N'Nhập Excel xử lý đơn đề nghị / xác nhận', N'Excel', N'DT', 4, N'student-requests', 1)
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0610', N'Học kỳ 1 năm học 2006 - 2007  ', 61, 0, CAST(N'2026-10-25T05:04:21.8910000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0620', N'Học kỳ 2 năm học 2006 - 2007', 62, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0621', N'Học kỳ hè năm học 2006 - 2007 ', 63, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0710', N'Học kỳ 1 năm học 2007 - 2008 ', 71, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0720', N'Học kỳ 2 năm học 2007 - 2008 ', 72, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0721', N'Học kỳ hè năm học 2007 - 2008 ', 73, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0810', N'Học kỳ 1 năm học 2008 - 2009 ', 81, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0820', N'Học kỳ 2 năm học 2008 - 2009 ', 82, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0821', N'Học kỳ hè năm học 2008 - 2009 ', 83, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0910', N'Học kỳ 1 năm học 2009 - 2010 ', 91, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0920', N'Học kỳ 2 năm học 2009 - 2010 ', 92, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'0921', N'Học kỳ hè năm học 2009 - 2010 ', 93, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1010', N'Học kỳ 1 năm học 2010 - 2011', 101, 0, CAST(N'2026-10-25T05:04:21.8920000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1020', N'Học kỳ 2 năm học 2010 - 2011', 102, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1021', N'Học kỳ hè năm học 2010 - 2011', 103, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1110', N'Học kỳ 1 năm học 2011-2012', 111, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1111', N'Học kỳ phụ kỳ 1 năm học 2011-2012', 111, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1120', N'Học kỳ 2 năm học 2011-2012', 112, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1121', N'Học kỳ hè năm học 2011-2012', 113, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1210', N'Học kỳ 1 năm học 2012-2013', 121, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1220', N'Học kỳ 2 năm học 2012-2013', 122, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1221', N'Học kỳ hè năm học 2012-2013', 123, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1310', N'Học kỳ 1 năm học 2013-2014', 131, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1320', N'Học kỳ 2 năm học 2013-2014', 132, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1321', N'Học kỳ hè năm học 2013-2014', 133, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1410', N'Học kỳ 1 năm học 2014-2015', 141, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1420', N'Học kỳ 2 năm học 2014-2015', 142, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1421', N'Học kỳ hè năm học 2014-2015', 143, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1510', N'Học kỳ 1 năm học 2015-2016', 151, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1520', N'Học kỳ 2 năm học 2015-2016', 152, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1521', N'Học kỳ hè năm học 2015-2016', 153, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1610', N'Học kỳ 1 năm học 2016-2017', 161, 0, CAST(N'2026-10-25T05:04:21.8930000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1620', N'Học kỳ 2 năm học 2016-2017', 162, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1621', N'Học kỳ hè năm học 2016-2017', 163, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1630', N'Học kỳ 3 năm học 2016-2017', 163, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1710', N'Học kỳ 1 năm học 2017-2018', 171, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1720', N'Học kỳ 2 năm học 2017-2018', 172, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1721', N'Học kỳ hè năm học 2017-2018', 173, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1810', N'Học kỳ 1 năm học 2018-2019', 181, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1820', N'Học kỳ 2 năm học 2018-2019', 182, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1821', N'Học kỳ hè năm học 2018-2019', 183, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1830', N'Học kỳ 3 năm học 2018-2019', 183, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1910', N'Học kỳ 1 năm học 2019-2020', 191, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1920', N'Học kỳ 2 năm học 2019-2020', 192, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'1921', N'Học kỳ hè năm học 2019-2020', 193, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2010', N'Học kỳ 1 năm học 2020-2021', 201, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2020', N'Học kỳ 2 năm học 2020-2021', 202, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2021', N'Học kỳ hè năm học 2020-2021', 203, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2110', N'Học kỳ 1 năm học 2021-2022', 211, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2120', N'Học kỳ 2 năm học 2021-2022', 212, 1, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2121', N'Học kỳ hè năm học 2021-2022', 213, 0, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2210', N'Học kỳ 1 năm học 2022-2023', 221, 1, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2220', N'Học kỳ 2 năm học 2022-2023', 222, 1, CAST(N'2026-10-25T05:04:21.8960000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2221', N'Học kỳ hè năm học 2022-2023', 223, 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2310', N'Học kỳ 1 năm học 2023-2024', 231, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2320', N'Học kỳ 2 năm học 2023-2024', 232, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2321', N'Học kỳ hè năm học 2023-2024', 233, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2410', N'Học kỳ 1 năm học 2024-2025', 241, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2420', N'Học kỳ 2 năm học 2024-2025', 242, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2421', N'Học kỳ Hè năm học 2024-2025', 243, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2510', N'Học kỳ 1 năm học 2025-2026', 251, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2520', N'Học kỳ 2 năm học 2025-2026', 252, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2521', N'Học kỳ Hè năm học 2025-2026', 253, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2610', N'Học kỳ 1 năm học 2026-2027', 261, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmKehoach] ([IDCode], [TenKH], [ThuTu], [Hientai], [NgayDongBo]) VALUES (N'2620', N'Học kỳ 2 năm học 2026-2027', 262, 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'01', 387, N'Xác nhận sinh viên', N'115', N'Cần nhập lý do đề nghị giấy xác nhận', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'02', 389, N'Xác nhận SV vay tiền', N'115', N'', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'03', 385, N'Kết quả rèn luyện', N'115', N'', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'04', 390, N'Bảng điểm học kỳ', N'115', N'Ghi rõ Học kỳ xin cấp bảng điểm, VD: HK 1/20224-2025', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'05', 388, N'Bảng điểm năm học', N'115', N'Ghi rõ năm học nào, ví dụ: năm học 2024-2025', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'06', 391, N'Bảng điểm quá trình', N'115', N'Bảng điểm tất cả các kỳ', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'08', 393, N'Bảng điểm học kỳ (tiếng Anh)', N'115', N'Cần ghi rõ học kỳ cần xin cấp bảng điểm', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'09', 394, N'Bảng điểm năm học (tiếng Anh)', N'115', N'Ghi rõ năm học nào', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'10', 395, N'Bảng điểm quá trình (tiếng Anh)', N'115', N'tất cả các kỳ', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 0, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'13', 386, N'Xác nhận hoãn NVQS', N'115', N'Chỉ cấp nếu sinh viên đã đăng ký học, nhập lý do đăng ký', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), 0, 1000, 1, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan], [ID], [TenVanBan], [MaDVcap], [ThongTinDinhKem], [LePhiThuong], [LePhiNhanh], [KhongMienPhi], [SoLuongMien_Ngay], [KhongCapNeuKhongHoc], [HieuLuc], [NgayDongBo]) VALUES (N'2610', N'18', 398, N'SV học quá KHĐT chuẩn - Xác nhận hoãn NVQS', N'115', N'VD: kế hoạch ĐT chuẩn 8 học kỳ, SV đang học HK thứ 9', CAST(0.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), NULL, 1000, 1, 1, CAST(N'2026-10-25T05:04:21.9010000' AS DateTime2))
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (1, N'certifications:catalog:manage')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (1, N'certifications:review')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (2, N'certifications:catalog:manage')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (2, N'certifications:review')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (3, N'academic-leave:review')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'requests.cancel')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'requests.complete')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'requests.print')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'requests.receive')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'requests.view')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:01')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:02')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:03')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:04')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:05')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:06')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:08')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:09')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:10')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:13')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:CONFIRMATION:18')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:DonSV01')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:DonSV03')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:DonSV04')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:DonSV05')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:DonSV06')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:DonSV07')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'work:LMS_SUPPORT')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'workbook.export')
GO
INSERT [auth].[TaskPermissions] ([TaskId], [PermissionName]) VALUES (4, N'workbook.import')
GO
SET IDENTITY_INSERT [certification].[tmCNTTChungChi] ON
GO
INSERT [certification].[tmCNTTChungChi] ([ID], [MaCC], [TenCC]) VALUES (1, N'CNTT01', N'Chứng chỉ CNTT cơ bản')
GO
INSERT [certification].[tmCNTTChungChi] ([ID], [MaCC], [TenCC]) VALUES (2, N'CNTT02', N'Chứng chỉ CNTT nâng cao')
GO
SET IDENTITY_INSERT [certification].[tmCNTTChungChi] OFF
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'rbac.permissions.delegate', N'Cấp quyền khác phạm vi xử lý của mình', N'Quản trị')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'rbac.roles.manage', N'Tạo và chỉnh sửa role', N'Quản trị')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'rbac.staff.manage', N'Tạo tài khoản và gán role', N'Quản trị')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'requests.cancel', N'Hủy đơn và phản hồi', N'Hồ sơ')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'requests.complete', N'Đánh dấu đã xử lý / phản hồi LMS', N'Hồ sơ')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'requests.print', N'In đơn', N'Hồ sơ')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'requests.reassign', N'Bàn giao người phụ trách', N'Quản trị')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'requests.receive', N'Tiếp nhận đơn', N'Hồ sơ')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'requests.view', N'Xem hồ sơ', N'Hồ sơ')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:01', N'Xác nhận sinh viên', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:02', N'Xác nhận SV vay tiền', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:03', N'Kết quả rèn luyện', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:04', N'Bảng điểm học kỳ', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:05', N'Bảng điểm năm học', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:06', N'Bảng điểm quá trình', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:08', N'Bảng điểm học kỳ (tiếng Anh)', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:09', N'Bảng điểm năm học (tiếng Anh)', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:10', N'Bảng điểm quá trình (tiếng Anh)', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:13', N'Xác nhận hoãn NVQS', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:CONFIRMATION:18', N'SV học quá KHĐT chuẩn - Xác nhận hoãn NVQS', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:DonSV01', N'Cấp lại thẻ sinh viên', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:DonSV03', N'Xét công nhận tốt nghiệp', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:DonSV04', N'Hoãn công nhận tốt nghiệp', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:DonSV05', N'Xét học bổng khuyến học', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:DonSV06', N'Giải quyết thủ tục thôi học', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:DonSV07', N'Đăng ký chương trình 2', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'work:LMS_SUPPORT', N'Cấp lại mật khẩu DUT-LMS', N'Phạm vi loại đơn')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'workbook.export', N'Xuất Excel', N'Excel')
GO
INSERT [svc_demo].[QuyenRBAC] ([MaQuyen], [TenQuyen], [Nhom]) VALUES (N'workbook.import', N'Nhập Excel và lưu xử lý', N'Excel')
GO
INSERT [svc_demo].[Sys_Email] ([MaEmail], [TenDenghi], [HieuLuc], [NgayDongBo]) VALUES (N'1', N'Tài khoản Office365 Trường cấp', 1, CAST(N'2026-10-25T05:04:21.9020000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_Email] ([MaEmail], [TenDenghi], [HieuLuc], [NgayDongBo]) VALUES (N'2', N'Tài khoản email Trường cấp (*)', 0, CAST(N'2026-10-25T05:04:21.9020000' AS DateTime2))
GO
INSERT [svc_demo].[Sys_Email] ([MaEmail], [TenDenghi], [HieuLuc], [NgayDongBo]) VALUES (N'3', N'Tài khoản DUT-LMS', 1, CAST(N'2026-10-25T05:04:21.9020000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_2_CODIENTU', N'CH_Kỹ thuật cơ điện tử', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_2_COKHI', N'CH_Kỹ thuật cơ khí', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_3_KTCOKHI', N'TS_Kỹ thuật cơ khí', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_CHETAOMAY', N'ĐH_Công nghệ Chế tạo máy', 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_CKHK', N'ĐH_Kỹ thuật Cơ khí - CKHK', 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_CODIENTU', N'ĐH_Kỹ thuật Cơ điện tử', 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'101_CODIENTU_CLC', N'ĐH_Kỹ thuật Cơ điện tử - CLC', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_2_KHMAYTINH', N'CH_Khoa học máy tính', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_3_KHMAYTINH', N'TS_Khoa học máy tính', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_CNTT_CLC-A', N'ĐH_Công nghệ Thông tin - CLC Anh', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_CNTT_CLC-DACTHU', N'ĐH_Công nghệ Thông tin - CLC Đặc thù', 0, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_CNTT_CLC-N', N'ĐH_Công nghệ Thông tin - CLC Nhật', 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_CNTT_DAITRA', N'ĐH_Công nghệ Thông tin', 1, CAST(N'2026-10-25T05:04:21.8970000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'102_CNTT_KHDL', N'ĐH_Công nghệ Thông tin - KHDL', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_2_COKHIDONGLUC', N'CH_Kỹ thuật cơ khí động lực', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_3_CKDONGLUC', N'TS_Kỹ thuật cơ khí động lực', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_3_COKYTHUAT', N'TS_Cơ kỹ thuật', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_KTCOKHI_CLC', N'ĐH_Kỹ thuật Cơ khí động lực - CLC', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_KTCOKHI_DAITRA', N'ĐH_Kỹ thuật Cơ khí động lực', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_KTHTCNGHIEP', N'ĐH_Kỹ thuật Hệ thống công nghiệp', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_KTOTO', N'ĐH_Kỹ thuật Ô TÔ', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_SPKTCN', N'ĐH_Sư phạm kỹ thuật công nghiệp', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'103_TAUTHUY', N'ĐH_Kỹ thuật Tàu thủy', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'104_2_KTNHIET', N'CH_Kỹ thuật nhiệt', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'104_3_KTNHIET', N'TS_Kỹ thuật nhiệt', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'104_KTNHIET', N'ĐH_Kỹ thuật Nhiệt', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'104_KTNHIET_CLC', N'ĐH_Kỹ thuật Nhiệt - CLC', 1, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_2_KYTHUATDIEN', N'CH_Kỹ thuật điện', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_2_TUDONGHOA', N'CH_Kỹ thuật điều khiển & tự động hóa', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_3_KTDIEN', N'TS_Kỹ thuật điện', 0, CAST(N'2026-10-25T05:04:21.8980000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_3_TUDONGHOA', N'TS_Kỹ thuật điều khiển và tự động hóa', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_KTDIEN', N'ĐH_Kỹ thuật Điện', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_KTDIEN_CLC', N'ĐH_Kỹ thuật Điện - CLC', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_TUDONGHOA', N'ĐH_Kỹ thuật Điều khiển & Tự động hóa', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'105_TUDONGHOA_CLC', N'ĐH_Kỹ thuật Điều khiển & Tự động hóa - CLC', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'106_2_DIENTU', N'CH_Kỹ thuật điện tử', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'106_3_KTDIENTU', N'TS_Kỹ thuật điện tử', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'106_3_KTVIENTHONG', N'TS_Kỹ thuật viễn thông', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'106_KTDIENTUVT', N'ĐH_Kỹ thuật Điện tử Viễn thông', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'106_KTDIENTUVT_CLC', N'ĐH_Kỹ thuật Điện tử Viễn thông - CLC', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'106_KTMT', N'ĐH_Kỹ thuật Máy tính', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_2_CNTHUCPHAM', N'CH_Công nghệ thực phẩm', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_2_KTHOAHOC', N'CH_Kỹ thuật hoá học', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_2_SINHHOC', N'CH_Công nghệ sinh học', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_3_CNTHUCPHAM', N'TS_Công nghệ thực phẩm', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_3_SINHHOC', N'TS_Công nghệ sinh học', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_CNSINHHOC', N'ĐH_Công nghệ Sinh học', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_CNTHUCPHAM', N'ĐH_Công nghệ Thực phẩm', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_CNTHUCPHAM_CLC', N'ĐH_Công nghệ Thực phẩm - CLC', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_DAUKHI', N'ĐH_Công nghệ Dầu khí & khai thác dầu', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_KTHOAHOC', N'ĐH_Kỹ thuật Hóa học', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'107_SHYDUOC', N'ĐH_Công nghệ sinh học - CN Công nghệ sinh học Y dược', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_2_XDUNGCAUDUONG', N'CH_Kỹ thuật xây dựng công trình giao thông', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_3_CTRINHGTHONG', N'TS_Kỹ thuật xây dựng công trình giao thông', 0, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_CNKTVATLIEUXD', N'ĐH_Công nghệ Kỹ thuật Vật liệu xây dựng', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_DSTDCAO', N'XD đường sắt tốc độ cao và đường sắt đô thị', 1, CAST(N'2026-10-25T05:04:21.8990000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_KTCSHATANG', N'ĐH_Kỹ thuật Cơ sở hạ tầng', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_KTXDUNGCTGT', N'ĐH_Kỹ thuật Xây dựng Công trình giao thông', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_KTXDUNGCTGT_CLC', N'ĐH_Kỹ thuật Xây dựng Công trình giao thông - CLC', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'109_MHTT', N'ĐH_Mô hìnhTTtrongXD_BIM', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'110_2_XAYDUNGDDCN', N'CH_Kỹ thuật xây dựng dân dụng và công nghiệp', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'110_KTXAYDUNG', N'ĐH_Kỹ thuật Xây dựng - CN. Dân dụng & Công nghiệp', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'110_KTXAYDUNG_CLC', N'ĐH_Kỹ thuật Xây dựng - CN. Dân dụng & Công nghiệp', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'111_2_CONGTRINHTHUY', N'CH_Kỹ thuật xây dựng công trình thủy', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'111_3_CTRINHTHUY', N'TS_Kỹ thuật xây dựng công trình thuỷ', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'111_CONGTRINHTHUY', N'ĐH_Kỹ thuật Xây dựng Công trình thủy', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'111_TINHOCXAYDUNG', N'ĐH_Kỹ thuật Xây dựng - CN.Tin học xây dựng', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'111_XDDOTHI', N'ĐH_Kỹ thuật xây dựng – CN Kỹ thuật và Quản lý xây dựng đô thị thông minh', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'117_2_MOITRUONG', N'CH_Kỹ thuật môi trường', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'117_3_MOITRUONG', N'TS_Kỹ thuật môi trường', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'117_KTMOITRUONG', N'ĐH_Kỹ thuật Môi trường', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'117_QLYTAINGUYENMTRUONG', N'ĐH_Quản lý Tài nguyên & Môi trường', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'118_2_QLCNGHIEP', N'CH_Quản lý công nghiệp', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'118_2_QUANLYXAYDUNG', N'CH_Quản lý Xây dựng', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'118_KINHTEXAYDUNG', N'ĐH_Kinh tế Xây dựng', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'118_QLYCONGNGHIEP', N'ĐH_Quản lý Công nghiệp', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'121_2_KIENTRUC', N'CH_Kiến trúc', 0, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'121_KIENTRUC', N'ĐH_Kiến trúc', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'123_DIENTUVIENTHONG', N'ĐH_Chương trình tiên tiến Việt-Mỹ - Kỹ thuật Điện tử Viễn thông', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'123_HETHONGNHUNG', N'ĐH_Chương trình tiên tiến Việt-Mỹ - Hệ thống nhúng', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'123_PFIEV1', N'ĐH_PFIEV - Công nghệ phần mềm', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'123_PFIEV2', N'ĐH_PFIEV - Tin học công nghiệp', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT [svc_demo].[tmNganhTQ] ([MaNganhTQ], [TenNganhTQ], [HieuLuc], [NgayDongBo]) VALUES (N'123_PFIEV3', N'ĐH_PFIEV - Sản xuất tự động', 1, CAST(N'2026-10-25T05:04:21.9000000' AS DateTime2))
GO
INSERT svc_demo.CauHinh(MaCauHinh,GiaTri,NgayDongBo) VALUES(N'catalogSource',N'School SELECT: DATA_GVien1.tmKehoach, tmNganhTQ, Sys_VanBan, Sys_Email; DATA_SV1.KSoat_Sys',CONVERT(datetime2,N'2026-10-25T05:04:21.9020000',126));
GO
INSERT svc_demo.CauHinh(MaCauHinh,GiaTri,NgayDongBo) VALUES(N'currentTerm',N'2610',CONVERT(datetime2,N'2026-10-25T05:04:21.9020000',126));
GO
INSERT svc_demo.CauHinh(MaCauHinh,GiaTri,NgayDongBo) VALUES(N'rbacInitialized',N'1',CONVERT(datetime2,N'2026-10-26T11:10:56.8050000',126));
GO
INSERT svc_demo.CauHinh(MaCauHinh,GiaTri,NgayDongBo) VALUES(N'workflowPermissionsInitialized',N'1',CONVERT(datetime2,N'2026-10-26T08:28:12.5140000',126));
GO
INSERT svc_demo.CauHinh(MaCauHinh,GiaTri) VALUES('workbookSigningKey',CONVERT(varchar(64),CRYPT_GEN_RANDOM(32),2));
GO
ALTER TABLE [academic_leave].[ApplicationHistory] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [academic_leave].[Applications] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountPermissions] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountProfiles] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountRoles] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountSecurityEvents] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[AccountTasks] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Fields] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[LocalAccounts] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[PermissionDefinitions] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Permissions] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[RoleDefinitions] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[RolePermissions] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Roles] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[TaskPermissions] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [auth].[Tasks] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[CertificateLevels] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[CertificateTypeIssuers] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[CertificateTypes] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[EvidenceFiles] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[IssuingOrganizations] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[Languages] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[RecognitionPolicies] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[StudentCertificates] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[tmCNTTChungChi] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [certification].[tmCNTTChungChi_SV] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[CauHinh] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[ChongGuiTrung] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DangNhapChuyenVien] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DeNghiEmail] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DeNghiVanBan] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[DonDeNghi] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[His_InDon] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[KetQuaHocTapHocKy] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuRBAC] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuTruongDuLieu] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[LoaiDon] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[NhanThan] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[PhienBanVaiTroQuyen] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[QuyenRBAC] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[QuyenXuLy] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[Sys_Email] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[Sys_VanBan] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TaiKhoan] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[tmKehoach] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[tmNganhTQ] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TruongCanBoSung] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[TruongLoaiDon] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[VaiTroQuyen] WITH CHECK CHECK CONSTRAINT ALL;
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] WITH CHECK CHECK CONSTRAINT ALL;
GO
COMMIT;
GO
