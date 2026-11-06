import { validateFormSchema } from './certifications.rules.js';

// Pure transformation. School records and child names are never normalized.
export function buildSchoolCatalogImport(source, configuration) {
  if (source.sourceDatabase !== 'tmProxDUT' || !Array.isArray(source.types) || !Array.isArray(source.levels))
    throw new Error('Expected original tmProxDUT catalog snapshot.');
  const codes = new Set(), ids = new Set();
  for (const record of source.types) {
    if (!Number.isInteger(record.ID) || typeof record.MaCC !== 'string' || !record.MaCC || record.MaCC.length > 50 ||
        typeof record.TenCC !== 'string' || record.TenCC.length > 200 || codes.has(record.MaCC) || ids.has(record.ID))
      throw new Error('Invalid or duplicate school certificate identity.');
    codes.add(record.MaCC); ids.add(record.ID);
  }
  for (const level of source.levels) {
    if (!codes.has(level.MaCC)) throw new Error('School level references an unknown parent.');
  }
  const languageDefinitions = new Map(configuration.languages.map(language => [language.code,language]));
  const languageCodes = new Set(source.types.map(record => record.LoaiNN).filter(Boolean));
  const languages = [...languageCodes].map(code => {
    const definition = languageDefinitions.get(code);
    if (!definition) throw new Error('Missing language mapping: '+code);
    return {code,displayName:definition.displayName,isPublished:definition.isPublished,isSchoolProvided:true};
  });
  const types = source.types.map(record => {
    const profile = configuration.profiles[record.MaCC];
    if (!profile) throw new Error('Missing local form configuration for '+record.MaCC);
    const formSchema = profile.useSchoolLevels ? {fields:[{
      key:'level',label:'Bậc / trình độ',type:'select',required:true,
      optionsFrom:'certificateLevels',
    }]} : profile.formSchema;
    return {code:record.MaCC,displayName:record.TenCC,languageCode:record.LoaiNN || null,isSchoolProvided:true,
      isPublished:Boolean(profile.isPublished),formSchema:validateFormSchema(formSchema),baseCode:null,
      schoolId:record.ID,conversionFlag:record.QuyDoiDiem,notes:record.GhiChu,importedAt:source.readAt};
  });
  for (const addition of configuration.additions) {
    if (codes.has(addition.code)) throw new Error('Local addition would replace a school code.');
    const parent = addition.baseCode ? types.find(type => type.code === addition.baseCode) : null;
    if (addition.baseCode && !parent) throw new Error('Missing school base for local addition.');
    const languageCode = parent?.languageCode ?? addition.languageCode;
    if (!languageCodes.has(languageCode)) throw new Error('Missing language for local addition.');
    types.push({...addition,isSchoolProvided:false,schoolId:null,languageCode,
      formSchema:validateFormSchema(addition.formSchema)});
    codes.add(addition.code);
  }
  const levels = source.levels.map(level => ({schoolId:level.ID,certificateTypeCode:level.MaCC,
    code:level.MaCon,displayName:level.TenCon,weight:level.TrongSoQD,notes:level.GhiChu,
    sortOrder:source.levels.filter(item => item.MaCC === level.MaCC).toSorted((a,b) => a.ID-b.ID)
      .findIndex(item => item.ID === level.ID)+1,importedAt:source.readAt,isSchoolProvided:true}));
  const levelCodes = new Set(levels.filter(level => level.code != null).map(level => level.code));
  for (const addition of configuration.levelAdditions ?? []) {
    if (!codes.has(addition.certificateTypeCode) || !addition.code || levelCodes.has(addition.code) ||
        typeof addition.displayName !== 'string' || !addition.displayName.trim() || !Number.isInteger(addition.sortOrder))
      throw new Error('Invalid or duplicate local certificate level.');
    levels.push({...addition,schoolId:null,isSchoolProvided:false,weight:null,notes:null,importedAt:null});
    levelCodes.add(addition.code);
  }
  for (const type of types) {
    if (type.formSchema.fields.some(field => field.optionsFrom === 'certificateLevels') &&
        !levels.some(level => level.certificateTypeCode === type.code && level.code != null && level.displayName != null))
      throw new Error('No selectable levels for '+type.code);
  }
  return {languages,types,levels};
}
