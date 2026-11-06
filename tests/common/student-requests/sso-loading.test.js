import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSchoolStudentService} from '../../../src/common/student-requests/services/school-student.service.js';
import {createStudentProfileService} from '../../../src/common/student-requests/services/student-profile.service.js';
import {createRequestActorResolver} from '../../../src/common/student-requests/middlewares/request-actor.js';

const claims=(sid='session-a',number='000000001')=>({sid,sub:'sso:verified',authMethod:'sso',identity:{id:'microsoft-id',microsoftId:number+'@sv1.dut.udn.vn'}});
function fixture(options={}){
  const stats={reads:0,writes:0,validations:0,actors:0};let time=1000,fail=false;
  const local={id:'sso:qa',role:'STUDENT',studentNumber:'000000001',identitySource:'SSO'};
  const repository={
    actor:async()=>({Role:'STUDENT',IdentitySource:'SSO',SchoolId:'qa',StudentNumber:'000000001'}),
    profile:async()=>({studentNumber:'000000001'}),
    syncSchoolStudent:async p=>{stats.writes++;return 'sso:'+p.MaHS;},
  };
  const school=createSchoolStudentService(repository,{now:()=>time,readProfile:async number=>{
    stats.reads++;if(fail)throw Error('unavailable');
    await options.wait?.();return [{MaHS:'qa',SoTheSV:number}];
  },...options});
  return {school,repository,stats,local,advance:ms=>time+=ms,fail:value=>fail=value};
}

test('four startup APIs share one school sync and profile display reuses that sync',async()=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  const f=fixture({wait:()=>gate});
  const resolver=createRequestActorResolver({channel:'student',school:f.school,
    auth:{verifyToken:async()=>{f.stats.validations++;return claims();}},
    service:{sessionActor:async()=>{f.stats.actors++;return f.local;}}});
  const req={headers:{authorization:'Bearer application.jwt'}};
  const pending=Array.from({length:4},()=>resolver(req));
  await new Promise(resolve=>setImmediate(resolve));assert.equal(f.stats.reads,1);release();
  await Promise.all(pending);
  const profile=createStudentProfileService(f.repository,f.school);
  await profile.get(f.local.id,{maxAgeMs:30_000});
  assert.deepEqual(f.stats,{reads:1,writes:1,validations:4,actors:4});
  await resolver(req);assert.equal(f.stats.validations,5);assert.equal(f.stats.actors,5);assert.equal(f.stats.reads,1);
  f.local.identitySource='LOCAL';await assert.rejects(()=>resolver(req),e=>e.statusCode===403);
  f.local.identitySource='SSO';f.local.studentNumber='000000002';await assert.rejects(()=>resolver(req),e=>e.statusCode===403);
});

test('cached links do not bypass revoked authentication or disabled local accounts',async()=>{
  const f=fixture();let revoked=false,disabled=false;
  const resolver=createRequestActorResolver({channel:'student',school:f.school,
    auth:{verifyToken:async()=>{if(revoked)throw Error('revoked');return claims();}},
    service:{sessionActor:async()=>{if(disabled)throw Error('disabled');return f.local;}}});
  const req={headers:{authorization:'Bearer application.jwt'}};
  await resolver(req);disabled=true;await assert.rejects(()=>resolver(req),/disabled/);
  revoked=true;await assert.rejects(()=>resolver(req),/revoked/);assert.equal(f.stats.reads,1);
});

test('new sessions and different verified student identities cannot reuse another link',async()=>{
  const f=fixture();await f.school.signIn(claims());await f.school.signIn(claims('session-b'));
  await f.school.signIn(claims('session-a','000000002'));assert.equal(f.stats.reads,3);
});

test('expired links are rechecked; school failures are evicted and can be retried',async()=>{
  const f=fixture();await f.school.signIn(claims());f.advance(300_000);f.fail(true);
  await assert.rejects(()=>f.school.signIn(claims()),e=>e.statusCode===503);
  f.fail(false);await f.school.signIn(claims());assert.equal(f.stats.reads,3);
});

test('profile display freshness is bounded and PDF/default reads always refresh',async()=>{
  const f=fixture();const profile=createStudentProfileService(f.repository,f.school);
  await f.school.signIn(claims());await profile.get(f.local.id,{maxAgeMs:30_000});assert.equal(f.stats.reads,1);
  await profile.get(f.local.id);assert.equal(f.stats.reads,2);
  f.advance(30_000);await profile.get(f.local.id,{maxAgeMs:3600_000});assert.equal(f.stats.reads,3);
  f.fail(true);await assert.rejects(()=>profile.get(f.local.id));
  await assert.rejects(()=>profile.get(f.local.id,{maxAgeMs:30_000}));
});

test('session link memory is bounded; callers without verified session IDs never reuse links',async()=>{
  const f=fixture({maxEntries:1});
  await f.school.signIn(claims());await f.school.signIn(claims('session-b'));await f.school.signIn(claims());
  const noSession=claims();delete noSession.sid;
  await f.school.signIn(noSession);await f.school.signIn(noSession);assert.equal(f.stats.reads,5);
});
