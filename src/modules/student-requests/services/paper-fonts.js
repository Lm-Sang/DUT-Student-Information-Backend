import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const assets=new URL('../../../../assets/request-forms/fonts/',import.meta.url);
const directory=process.env.REQUEST_FORM_FONT_DIR||(process.platform==='win32'?join(process.env.WINDIR||'C:/Windows','Fonts'):null);
const variants={Regular:['times.ttf','arial.ttf'],Bold:['timesbd.ttf','arialbd.ttf'],Italic:['timesi.ttf','ariali.ttf'],BoldItalic:['timesbi.ttf','arialbi.ttf']};
const exact=directory&&Object.values(variants).every(([name])=>existsSync(join(directory,name)));
// Use the school's real font when installed; do not vendor proprietary system fonts.
// Non-Windows deployments can supply a licensed font directory explicitly.
export const paperFontFamily=exact?'Times New Roman':'Tinos';
export const paperFonts=Object.fromEntries(Object.entries(variants).flatMap(([style,[times,arial]])=>{
 const bytes=readFileSync(exact?join(directory,times):new URL('Tinos-'+style+'.ttf',assets));
 return [['Times'+style,bytes],['Arial'+style,directory&&existsSync(join(directory,arial))?readFileSync(join(directory,arial)):bytes]];
}));
export function paperFontName(name){
 const style=/Bold/i.test(name)?(/Italic|Oblique/i.test(name)?'BoldItalic':'Bold'):/Italic|Oblique/i.test(name)?'Italic':'Regular';
 return (/Arial/i.test(name)?'Arial':'Times')+style;
}
