import {test} from 'node:test';import assert from 'node:assert/strict';
import {canRead} from '../../../src/common/student-requests/rules/request-rules.js';
import {createCertificationsService} from '../../../src/common/certifications/services/certifications.service.js';
import {createItCertificationsService} from '../../../src/common/certifications/services/it-certifications.service.js';
import {createAcademicLeaveService} from '../../../src/common/academic-leave/services/academic-leave.service.js';
test('each of the six petitions and eleven confirmations is independent, including previously assigned records',()=>{
 const keys=['DonSV01','DonSV03','DonSV04','DonSV05','DonSV06','DonSV07',...['01','02','03','04','05','06','08','09','10','13','18'].map(k=>'CONFIRMATION:'+k),'LMS_SUPPORT'];
 for(const key of keys){const actor={id:'specialist',role:'STAFF',permissions:['requests.view'],workPermissions:[key]};for(const other of keys){const request={typeCode:other.startsWith('CONFIRMATION:')?'CONFIRMATION':other,payload:other.startsWith('CONFIRMATION:')?{documentCode:other.split(':')[1]}:{},assignedStaffId:'specialist',status:'SUBMITTED'};assert.equal(canRead(actor,request),key===other,key+' must not inherit '+other);}}
});
test('certificate details enforce individual catalog types and academic leave/extension do not grant return access',async()=>{
 const reviewer={role:'reviewer',scopePermissions:['work:certifications:3','work:it-certifications:01','work:academic-leave:return']};
 let foreignType=3;const language=createCertificationsService({repository:{get:async()=>({Id:'fixture',CertificateTypeId:foreignType,Status:'submitted',Files:[]})},config:{}});assert.equal((await language.get(reviewer,'fixture')).certificateTypeId,3);foreignType=4;await assert.rejects(()=>language.get(reviewer,'fixture'),e=>e.statusCode===403);
 let itType='01';const it=createItCertificationsService({repository:{get:async()=>({Id:'fixture',Status:'submitted',Submissions:[{Id:'submission',Certificate:{MaCC:itType}}]})},config:{}});await it.get(reviewer,'fixture');itType='02';await assert.rejects(()=>it.get(reviewer,'fixture'),e=>e.statusCode===403);
 for(const kind of ['leave','extension']){const service=createAcademicLeaveService({repository:{get:async()=>({kind})}});await assert.rejects(()=>service.get(reviewer,1),e=>e.statusCode===403);}
});
