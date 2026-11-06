import json,re,zipfile,unicodedata,hashlib,sys
from pathlib import Path
from lxml import etree as E
import pdfplumber
base=Path(sys.argv[1])
root=Path(__file__).resolve().parent.parent/'assets/request-forms'
output=root/'layouts'
output.mkdir(parents=True,exist_ok=True)
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
def norm(t):return ''.join(c for c in unicodedata.normalize('NFC',t) if not c.isspace() and c not in '\u200b\ufeff')
def num(el,name,default=0):return float(el.get('{'+ns['w']+'}'+name,default)) if el is not None else default
for ref in (base/'references').glob('*.pdf'):
 markers=json.loads(ref.with_suffix('.markers.json').read_text())
 xml=E.fromstring(zipfile.ZipFile(root/'docx'/f'{ref.stem}.docx').read('word/document.xml'))
 styles=E.fromstring(zipfile.ZipFile(root/'docx'/f'{ref.stem}.docx').read('word/styles.xml'))
 def spacing_for(paragraph):
  props={};pr=paragraph.find('w:pPr',ns);style=pr.find('w:pStyle',ns) if pr is not None else None
  sid=style.get('{'+ns['w']+'}val') if style is not None else 'Normal';chain=[]
  while sid and sid not in [v.get('{'+ns['w']+'}styleId') for v in chain]:
   st=styles.find('w:style[@w:styleId="'+sid+'"]',ns)
   if st is None:break
   chain.append(st);based=st.find('w:basedOn',ns);sid=based.get('{'+ns['w']+'}val') if based is not None else None
  for pp in [s.find('w:pPr',ns) for s in reversed(chain)]+[pr]:
   sp=pp.find('w:spacing',ns) if pp is not None else None
   if sp is not None:props.update({E.QName(k).localname:v for k,v in sp.attrib.items()})
  return props
 sect=xml.find('.//w:sectPr',ns); margins=sect.find('w:pgMar',ns)
 left,right=num(margins,'left')/20,num(margins,'right')/20
 pages=[]; flat=[]; positions=[]
 with pdfplumber.open(ref) as pdf:
  for pn,p in enumerate(pdf.pages):
   chars=[]
   for ch in p.chars:
    # Word emits text in document order; baseline from text matrix.
    c={'t':ch['text'],'x':round(ch['x0'],3),'y':round(p.height-ch['matrix'][5],3),'w':round(ch['adv'],3),'s':round(ch['size'],3),'f':ch['fontname'].split('+')[-1]}
    chars.append(c)
    for n in norm(c['t']):flat.append(n);positions.append((pn,len(chars)-1))
   pages.append({'width':p.width,'height':p.height,'chars':chars,'lines':[[round(l[k],3) for k in ['x0','top','x1','bottom']]+[l['linewidth']] for l in p.lines],
    'rects':[[r['x0'],r['top'],r['width'],r['height'],r['linewidth']] for r in p.rects],
    'images':[[im['x0'],im['top'],im['width'],im['height']] for im in p.images]})
 text=''.join(flat); used=set(); groups=[]; missing=[]
 for paragraph in xml.findall('.//w:p',ns):
  original=''.join(paragraph.xpath('.//w:t/text()',namespaces=ns))
  if not original.strip():continue
  filled=re.sub(r'\{\{(\w+)\}\}',lambda m:markers.get(m[1],''),original)
  needle=norm(filled)
  # Static paragraphs stay exactly where Word placed them. Only compile dynamic paragraphs.
  if '{{' not in original:continue
  candidates=[m.start() for m in re.finditer(re.escape(needle),text)]
  hit=next((i for i in candidates if not any(j in used for j in range(i,i+len(needle)))),None)
  if hit is None:missing.append(original);continue
  used.update(range(hit,hit+len(needle)))
  coords=list(dict.fromkeys(positions[hit:hit+len(needle)])); pn=coords[0][0]
  cs=[pages[p]['chars'][i] for p,i in coords]
  pr=paragraph.find('w:pPr',ns); ind=pr.find('w:ind',ns) if pr is not None else None
  align=pr.find('w:jc',ns) if pr is not None else None
  table=paragraph.xpath('ancestor::w:tc',namespaces=ns)
  x=min(c['x'] for c in cs); y=min(c['y'] for c in cs); xmax=max(c['x']+c['w'] for c in cs)
  # Add spaces omitted by normalization within each matched run.
  indexes=[i for p,i in coords if p==pn]
  for i in range(min(indexes),max(indexes)+1):
   if pages[pn]['chars'][i]['t'].isspace() and i not in indexes:coords.append((pn,i))
  g={'text':original,'page':pn,'x':x,'y':y,'size':cs[0]['s'],'font':cs[0]['f'],'align':align.get('{'+ns['w']+'}val','left') if align is not None else 'left',
    'left':left+num(ind,'left')/20,'right':pages[pn]['width']-right-num(ind,'right')/20,'first':num(ind,'firstLine')/20,'table':bool(table),
    'height':max(c['y'] for c in cs)-y+cs[0]['s']*1.15,'coords':coords}
  spacing=spacing_for(paragraph)
  quantum=lambda value:round(round(value/0.12)*0.12,2)
  default_step=round(round(cs[0]['s'])*1.15+0.000001,1)
  g['lineStep']=quantum(float(spacing.get('line',240))/20 if spacing.get('lineRule')=='exact' else default_step*float(spacing.get('line',240))/240)
  # Explicit Word tab stops are fixed geometry, not concatenated text.
  if paragraph.find('.//w:tab',ns) is not None:
   fragments=[];offset=0;pending=''
   for run in paragraph.findall('w:r',ns):
    for part in run:
     if part.tag=='{'+ns['w']+'}t':pending+=part.text or ''
     elif part.tag=='{'+ns['w']+'}tab' and pending:
      count=len(norm(re.sub(r'\{\{(\w+)\}\}',lambda m:markers.get(m[1],''),pending)))
      if count:
       pos=positions[hit+offset];ch=pages[pos[0]]['chars'][pos[1]];fragments.append({'text':pending,'x':ch['x'],'font':ch['f'],'size':ch['s']});offset+=count
      pending=''
   if pending:
    pos=positions[hit+offset];ch=pages[pos[0]]['chars'][pos[1]];fragments.append({'text':pending,'x':ch['x'],'font':ch['f'],'size':ch['s']})
   if len(fragments)>1:g['fragments']=fragments
  if table:
   cell=table[0];row=cell.getparent();tbl=row.getparent()
   width=num(cell.find('w:tcPr/w:tcW',ns),'w')/20
   cm=cell.find('w:tcPr/w:tcMar',ns)
   if cm is None:cm=tbl.find('w:tblPr/w:tblCellMar',ns)
   padleft=num(cm.find('w:left',ns),'w')/20 if cm is not None else 5.4
   padright=num(cm.find('w:right',ns),'w')/20 if cm is not None else 5.4
   g['cellWidth']=max(20,width-padleft-padright-num(ind,'left')/20-num(ind,'right')/20)
   g['tableRow']=row.getroottree().getpath(row)
   g['rowMinimum']=quantum(num(row.find('w:trPr/w:trHeight',ns),'val')/20)
   g['paragraphSpace']=quantum((float(spacing.get('before',0))+float(spacing.get('after',0)))/20)
   # A cell cannot overwrite the next label on the same line.
   nextx=[c['x'] for c in pages[pn]['chars'] if abs(c['y']-y)<2 and c['x']>xmax+2 and not c['t'].isspace()]
   g['left']=x;g['right']=min(nextx)-4 if nextx else pages[pn]['width']-right
   borders=sorted(set(round(r[0],2) for r in pages[pn]['rects'] if r[2]<2 and r[3]>5 and r[1]<=y<=r[1]+r[3]))
   midpoint=(x+xmax)/2
   bounds=next(((a,b) for a,b in zip(borders,borders[1:]) if a<=midpoint<=b),None)
   if bounds:
    g['left'],g['right']=bounds[0]+3,bounds[1]-3
  if g['align']=='center' and not table:g['x']=g['left'];g['first']=0
  if g['align']=='left' and not table:g['left']=min(g['left'],x)
  groups.append(g)
 if missing:raise RuntimeError(f'{ref.stem}: missing {missing}')
 removed=set(tuple(c) for g in groups for c in g.pop('coords'))
 for pn,p in enumerate(pages):
  # footer is regenerated on every page, including overflow pages.
  p['chars']=[c for i,c in enumerate(p['chars']) if (pn,i) not in removed and c['y']<p['height']-38]
  # Group glyphs to cut PDF operators and preserve native Word spacing.
  spans=[]
  for c in p.pop('chars'):
   if spans and all(c[k]==spans[-1][k] for k in ['y','s','f']) and abs(c['x']-(spans[-1]['x']+spans[-1]['w']))<0.25:
    spans[-1]['t']+=c['t'];spans[-1]['w']+=c['w']
   else:spans.append(c.copy())
  for s in spans:
   for key,marker in markers.items():
    if marker in s['t']:s['t']=s['t'].replace(marker,'{{'+key+'}}');s.pop('w',None)
  p['spans']=spans
 result={'source':ref.stem,'sourceSha256':hashlib.sha256((root/'docx'/f'{ref.stem}.docx').read_bytes()).hexdigest(),'margins':{'left':left,'right':right,'top':num(margins,'top')/20},'pages':pages,'fields':groups}
 (output/f'{ref.stem}.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print(ref.stem,'pages',len(pages),'fields',len(groups),'spans',sum(len(p['spans']) for p in pages))
