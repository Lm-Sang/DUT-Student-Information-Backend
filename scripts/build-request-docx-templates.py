"""Build neutral copies of supplied forms, preserving their OOXML layout."""
import copy, hashlib, io, json, re, sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT.parent/'bieu-mau-de-nghi-in'
DEST=ROOT/'assets/request-forms/docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
REL='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
N={'w':W,'r':R,'a':'http://schemas.openxmlformats.org/drawingml/2006/main','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
FORMS=[('DonSV01-cap-lai-the-sinh-vien','Cấp thẻ.docx','CARD'),
 ('DonSV01-cap-lai-the-sinh-vien-thay-doi-thong-tin','cấp lại thẻ thay đổi thông tin.docx','CARD_CHANGE'),
 ('DonSV03-xet-cong-nhan-tot-nghiep','công nhận tốt nghiệp.docx','GRADUATION'),
 ('DonSV04-hoan-cong-nhan-tot-nghiep','hoãn công nhận tốt nghiệp.docx','DEFERRAL'),
 ('DonSV05-xet-hoc-bong','hbkk có field.docx','SCHOLARSHIP'),
 ('DonSV07-hoc-chuong-trinh-2','hoc chương trình 2.docx','SECOND_PROGRAM'),
 ('DonSV06-thoi-hoc','thôi học.docx','WITHDRAWAL')]
def tag(n):return '{'+W+'}'+n
def xml(e):return E.tostring(e,encoding='UTF-8',xml_declaration=True,standalone=True)
def text(e):return ''.join(e.xpath('.//w:t/text()',namespaces=N))
def settext(p,s):
 ts=p.findall('.//w:t',N)
 if not ts:ts=[E.SubElement(E.SubElement(p,tag('r')),tag('t'))]
 ts[0].text=s;ts[0].set('{http://www.w3.org/XML/1998/namespace}space','preserve')
 for t in ts[1:]:t.text=''
def replace(p,old,new):
 ts=p.findall('.//w:t',N);whole=''.join(t.text or '' for t in ts);start=whole.find(old)
 if start<0:raise ValueError('Missing replacement span')
 end=start+len(old);pos=0;inserted=False
 for t in ts:
  s=t.text or '';stop=pos+len(s)
  if pos<end and stop>start:
   t.text=s[:max(0,start-pos)]+('' if inserted else new)+(s[max(0,end-pos):] if stop>end else '')
   inserted=True;t.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
  pos=stop
def geom(root):
 return [{E.QName(e).localname:{E.QName(k).localname:v for k,v in e.attrib.items()} for e in s} for s in root.findall('.//w:sectPr',N)]
def canonical(node):
 if node is None:return None
 return [E.QName(node).localname,sorted((E.QName(k).localname,v) for k,v in node.attrib.items()),[canonical(child) for child in node]]
def native_footer():
 f=E.Element(tag('ftr'),nsmap={'w':W,'r':R});p=E.SubElement(f,tag('p'));pp=E.SubElement(p,tag('pPr'))
 tabs=E.SubElement(pp,tag('tabs'));tab=E.SubElement(tabs,tag('tab'));tab.set(tag('val'),'right');tab.set(tag('pos'),'10600')
 ind=E.SubElement(pp,tag('ind'));ind.set(tag('left'),'73')
 spacing=E.SubElement(pp,tag('spacing'));spacing.set(tag('before'),'0');spacing.set(tag('after'),'0')
 def run(parent,value):
  r=E.SubElement(parent,tag('r'));rp=E.SubElement(r,tag('rPr'));font=E.SubElement(rp,tag('rFonts'))
  font.set(tag('ascii'),'Times New Roman');font.set(tag('hAnsi'),'Times New Roman');E.SubElement(rp,tag('i'));E.SubElement(rp,tag('sz')).set(tag('val'),'18')
  E.SubElement(r,tag('t')).text=value;return r
 run(p,'{{footer}}');E.SubElement(E.SubElement(p,tag('r')),tag('tab'));run(p,'-')
 field=E.SubElement(p,tag('fldSimple'));field.set(tag('instr'),' PAGE ');run(field,'1');run(p,'-')
 return f
def pagefield(p):
 ts=p.findall('.//w:t',N)
 if not ts:return
 r=ts[0].getparent();parent=r.getparent();idx=parent.index(r);settext(p,'')
 left=copy.deepcopy(r);left.find('w:t',N).text='-';fld=E.Element(tag('fldSimple'));fld.set(tag('instr'),' PAGE ')
 value=copy.deepcopy(r);value.find('w:t',N).text='1';fld.append(value)
 parent.remove(r);parent.insert(idx,left);parent.insert(idx+1,fld);parent.insert(idx+2,copy.deepcopy(left))

DEST.mkdir(parents=True,exist_ok=True)
image=Image.new('RGB',(273,411),'white');draw=ImageDraw.Draw(image);draw.rectangle((0,0,272,410),outline='#777',width=2)
font=ImageFont.truetype('C:/Windows/Fonts/times.ttf',25)
for s,y in [('Ảnh sinh viên',165),('3 × 4',205)]:draw.text((136,y),s,font=font,fill='black',anchor='mm')
stream=io.BytesIO();image.save(stream,'PNG');placeholder=stream.getvalue()
with ZipFile(SOURCE/'cấp lại thẻ thay đổi thông tin.docx') as z:photo_anchor=copy.deepcopy(E.fromstring(z.read('word/document.xml')).find('.//w:drawing',N))
manifest=[];fixtures=[]
for stem,filename,kind in FORMS:
 with ZipFile(SOURCE/filename) as z:parts={n:z.read(n) for n in z.namelist()}
 original=dict(parts);root=E.fromstring(parts['word/document.xml']);body=root.find('w:body',N);geometry=geom(root)
 source_root=E.fromstring(original['word/document.xml'])
 pars=list(body.findall('w:p',N));slots=[];defaults={}
 def token(p,key):
  defaults[key]=text(p);slots.append({'part':'word/document.xml','path':root.getroottree().getpath(p),'key':key});settext(p,'{{'+key+'}}')
 table=body.find('w:tbl',N);grad=kind in ('GRADUATION','DEFERRAL')
 fields=[['name','phone'],['dateOfBirth','birthPlace' if grad else 'identityNumber']]+([['gender','ethnicity']] if grad else [])+[['studentNumber','className']]
 for row,keys in zip(table.findall('w:tr',N),fields):
  cells=row.findall('w:tc',N)
  for col,key in zip([1,3],keys):token(cells[col].find('w:p',N),key)
 for p in pars:
  s=text(p)
  if s==defaults['name']:token(p,'name')
  elif s.startswith('Đà Nẵng, ngày 24 tháng 10 năm 2026'):token(p,'writtenDate')
  elif re.search(r'^(?:DonSV\d+|SV)\d{2}:\d{2}',s) and not re.search(r'-\d+-$',s):token(p,'footer')
  elif s.startswith('Đà Nẵng, ngày ....'):replace(p,'2026','........')
  elif s.startswith('Nhà trường đã nhận'):
   match=re.search(r'sinh viên (.*?) \(Lớp: (.*?), Số thẻ SV: (.*?)\)',s)
   if match:
    for old,key in [(match[1],'name'),(match[2],'className'),(match[3],'studentNumber')]:replace(p,old,'{{'+key+'}}')
  elif kind=='WITHDRAWAL' and s.startswith('-Họ tên:'):replace(p,s[len('-Họ tên: '):],'{{name}}')
  elif kind=='WITHDRAWAL' and s.startswith('-Lớp:'):
   replace(p,defaults['className'],'{{className}}');replace(p,defaults['studentNumber'],'{{studentNumber}}')
 tables=body.findall('w:tbl',N);t2=tables[1] if len(tables)>1 else None
 if grad:
  for c,key in zip(t2.findall('w:tr',N)[1].findall('w:tc',N),['requiredCredits','earnedCredits','cumulativeGpa','conductAverage']):token(c.find('w:p',N),'academic_'+key)
 if kind=='SCHOLARSHIP':
  for c,key in zip(t2.findall('w:tr',N)[1].findall('w:tc',N),['credits','repeatedCredits','scholarshipAverage','gpa','cumulativeGpa','hasLowGrade','conductScore']):token(c.find('w:p',N),'scholarship_'+key)
 if kind in ('SECOND_PROGRAM','WITHDRAWAL'):
  rows=t2.findall('w:tr',N)
  for i,row in enumerate(rows[1:]):
   for c,key in zip(row.findall('w:tc',N),['index','termName','credits','gpa','cumulativeGpa','conductScore']):token(c.find('w:p',N),f'history_{i}_{key}')
  header=rows[0].find('w:trPr',N)
  if header is None:header=E.Element(tag('trPr'));rows[0].insert(0,header)
  E.SubElement(header,tag('tblHeader'))
 for p in pars:
  s=text(p)
  if kind=='CARD_CHANGE' and s.startswith('Thay đổi thông tin trên thẻ:'):
   old=s.split(': ',1)[1];defaults['changeDescription']=old;replace(p,old,'{{changeDescription}}')
  elif kind=='GRADUATION' and s.startswith('Tôi nhận định:'):
   old=re.search(r'cuối (.*?), tôi có',s)[1];defaults['expectedTerm']=old;replace(p,old,'{{expectedTerm}}')
  elif kind=='DEFERRAL' and s.startswith('Tôi có nhu cầu'):
   old=s.split(' Tôi làm đơn này',1)[0];defaults['reason']=old;defaults['targetTerm']='học kỳ này';replace(p,old,'{{reason}}');replace(p,'học kỳ này','{{targetTerm}}')
  elif kind=='SCHOLARSHIP' and s.startswith('Học kỳ '):token(p,'reviewTerm')
  elif kind=='SCHOLARSHIP' and s.startswith('Số tín chỉ tôi học'):token(p,'reason')
  elif kind=='SECOND_PROGRAM' and s.startswith('Chương trình đào tạo ngành 1:'):settext(p,s+' {{primaryProgram}}');defaults['primaryProgram']=''
  elif kind=='SECOND_PROGRAM' and s.startswith(('Ngành:','Kể từ:')):
   label='Ngành:' if s.startswith('Ngành:') else 'Kể từ:';key='programName' if label=='Ngành:' else 'startTerm'
   defaults[key]=s[len(label):];replace(p,s[len(label):],'{{'+key+'}}')
  elif kind=='WITHDRAWAL' and s.startswith('Tôi làm đơn này'):
   old=s.split('với lý do: ',1)[1];defaults['withdrawalReason']=old;defaults['reasonDetail']='';replace(p,old,'{{withdrawalReason}} {{reasonDetail}}')
 # Keep the existing signature paragraphs (including their exact blank spacing)
 # together. Floating photos otherwise escape the text flow at the page bottom.
 signature_start=next(i for i,p in enumerate(pars) if text(p)=='{{writtenDate}}')
 signature_end=next(i for i in range(signature_start+1,len(pars)) if text(pars[i])=='{{name}}')
 for p in pars[signature_start:signature_end]:
  pp=p.find('w:pPr',N)
  if pp is None:pp=E.Element(tag('pPr'));p.insert(0,pp)
  keep=pp.find('w:keepNext',N)
  if keep is None:keep=E.SubElement(pp,tag('keepNext'))
  keep.set(tag('val'),'1')
 rels=E.fromstring(parts['word/_rels/document.xml.rels']);content=E.fromstring(parts['[Content_Types].xml'])
 image_rels=[r for r in rels if r.get('Type','').endswith('/image')]
 if kind=='CARD':
  p=next(p for p in pars if text(p)=='{{writtenDate}}');r=E.Element(tag('r'));drawing=copy.deepcopy(photo_anchor)
  drawing.find('.//a:blip',N).set('{'+R+'}embed','rIdStudentPhoto');r.append(drawing);p.insert(1,r)
  relation=E.SubElement(rels,'{'+REL+'}Relationship');relation.set('Id','rIdStudentPhoto');relation.set('Type',R+'/image');image_rels.append(relation)
 for r in image_rels:
  old=r.get('Target');parts.pop('word/'+old,None) if old else None;r.set('Target','media/student-photo.png')
 if image_rels:
  parts['word/media/student-photo.png']=placeholder
  node=E.SubElement(content,'{'+CT+'}Default');node.set('Extension','png');node.set('ContentType','image/png')
 if kind in ('CARD_CHANGE','WITHDRAWAL'):
  # Only remove the artificial footer/padding section after the last real content.
  first_section=copy.deepcopy(root.find('.//w:sectPr',N));last=next(p for p in reversed(body.findall('w:p',N)) if text(p))
  if re.search(r'-\d+-$',text(last)):
   body.remove(last)
   while len(body)>1 and E.QName(body[-2]).localname=='p' and not text(body[-2]):body.remove(body[-2])
   for section in list(root.findall('.//w:sectPr',N)):section.getparent().remove(section)
   body.append(first_section)
  fname='footerNative.xml';parts['word/'+fname]=xml(native_footer())
  r=E.SubElement(rels,'{'+REL+'}Relationship');r.set('Id','rIdNativeFooter');r.set('Type',R+'/footer');r.set('Target',fname)
  n=E.SubElement(content,'{'+CT+'}Override');n.set('PartName','/word/'+fname);n.set('ContentType','application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml')
  for section in root.findall('.//w:sectPr',N):
   ref=E.Element(tag('footerReference'));ref.set(tag('type'),'default');ref.set('{'+R+'}id','rIdNativeFooter');section.insert(0,ref)
   margins=section.find('w:pgMar',N);margins.set(tag('footer'),'300');margins.set(tag('header'),'0')
  if kind=='WITHDRAWAL':
   receipt_header=next(p for p in pars if text(p).startswith('ĐẠI HỌC ĐÀ NẴNG'))
   pp=receipt_header.find('w:pPr',N)
   if pp is None:pp=E.Element(tag('pPr'));receipt_header.insert(0,pp)
   E.SubElement(pp,tag('pageBreakBefore'))
 for name in list(parts):
  if re.match(r'word/footer\d+\.xml$',name):
   f=E.fromstring(parts[name])
   for p in [p for p in f.findall('.//w:p',N) if not p.findall('.//w:p',N)]:
    if re.search(r'^(?:DonSV\d+|SV)\d{2}:\d{2}',text(p)):settext(p,'{{footer}}')
    elif re.fullmatch(r'-\d+-',text(p)):pagefield(p)
   # The literal placeholder is wider than the source timestamp. Widen only
   # its text container; keep the original anchor, font, baseline and number.
   for anchor in f.findall('.//wp:anchor',N):
    if '{{footer}}' in text(anchor):
     for extent in anchor.findall('wp:extent',N)+anchor.findall('.//a:xfrm/a:ext',N):extent.set('cx','3302000')
   for shape in f.findall('.//{urn:schemas-microsoft-com:vml}shape'):
    if '{{footer}}' in text(shape):shape.set('style',re.sub(r'width:[^;]+','width:260pt',shape.get('style','')))
   parts[name]=xml(f)
 if 'docProps/core.xml' in parts:
  core=E.fromstring(parts['docProps/core.xml'])
  for n in core:
   if E.QName(n).localname in ('creator','lastModifiedBy','title','subject','description','keywords'):n.text=''
  parts['docProps/core.xml']=xml(core)
 if 'word/settings.xml' in parts:
  settings=E.fromstring(parts['word/settings.xml']);compat=settings.find('w:compat',N)
  if compat is None:compat=E.SubElement(settings,tag('compat'))
  if compat.find('w:doNotExpandShiftReturn',N) is None:E.SubElement(compat,tag('doNotExpandShiftReturn'))
  parts['word/settings.xml']=xml(settings)
 for name in list(parts):
  if name.startswith('docProps/thumbnail'):parts.pop(name)
 parts['word/document.xml']=xml(root);parts['word/_rels/document.xml.rels']=xml(rels);parts['[Content_Types].xml']=xml(content)
 target=DEST/(stem+'.docx')
 with ZipFile(target,'w',ZIP_DEFLATED) as z:
  for name,data in parts.items():z.writestr(name,data)
 preserved={name:hashlib.sha256(data).hexdigest() for name,data in original.items() if parts.get(name)==data}
 unchanged=0;exceptions=[]
 for p in source_root.findall('.//w:p',N):
  path=source_root.getroottree().getpath(p)
  # Padding-only paragraphs are intentionally removed; audit all actual source paragraphs/cells.
  if not text(p):continue
  target_nodes=root.xpath(path,namespaces=source_root.nsmap)
  if target_nodes and canonical(p.find('w:pPr',N))==canonical(target_nodes[0].find('w:pPr',N)):unchanged+=1
  elif target_nodes:exceptions.append(path)
 manifest.append({'stem':stem,'source':filename,'kind':kind,'sourceSha256':hashlib.sha256((SOURCE/filename).read_bytes()).hexdigest(),
  'templateSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceGeometry':geometry,'templateGeometry':geom(root),
  'preservedParts':preserved,'editedParts':[n for n,v in parts.items() if original.get(n)!=v],'slots':slots,'photo':bool(image_rels),
  'unchangedParagraphProperties':unchanged,'paragraphPropertyExceptions':exceptions,'version':'2026-10-25.2'})
 fixtures.append({'stem':stem,'values':defaults});print(stem,'preserved',len(preserved),'parts')
(DEST.parent/'docx-layout-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
out=ROOT/'.data/research/layout-source-fixtures.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(fixtures,ensure_ascii=False,indent=2),encoding='utf8')
