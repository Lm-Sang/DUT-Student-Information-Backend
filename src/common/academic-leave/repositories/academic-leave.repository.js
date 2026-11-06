import {queryLocalDatabase,transactionLocalDatabase,connectDatabase} from '../../../database.js';
import {AppError} from '../../../shared/errors/app-error.js';

const table='academic_leave.Applications';
const columns=`c.Id AS id,c.RequestCode AS requestCode,c.StudentCode AS studentCode,c.StudentSequence AS studentSequence,c.Kind AS kind,c.ParentApplicationId AS parentApplicationId,
 c.ReasonCode AS reasonCode,c.StartSemesterCode AS startSemesterCode,c.SemesterCount AS semesterCount,c.Content AS content,c.Status AS status,
 JSON_QUERY(c.SnapshotJson) AS snapshot,CONVERT(varchar(33),c.StudentConfirmedAt,126)+'Z' AS studentConfirmedAt,c.ReviewerName AS reviewerName,c.ReviewNote AS reviewNote,
 CONVERT(varchar(33),c.ReviewedAt,126)+'Z' AS reviewedAt,CONVERT(varchar(33),c.ReceivedAt,126)+'Z' AS receivedAt,
 CONVERT(varchar(33),c.PaperDeadlineAt,126)+'Z' AS paperDeadlineAt,CONVERT(varchar(33),c.PaperReceivedAt,126)+'Z' AS paperReceivedAt,
 CONVERT(varchar(33),c.CreatedAt,126)+'Z' AS createdAt,CONVERT(varchar(33),c.UpdatedAt,126)+'Z' AS updatedAt,CONVERT(varchar(16),CONVERT(binary(8),c.RowVersion),2) AS rowVersion`;
const scope=`(JSON_VALUE(@input,'$.actor.role')='reviewer' OR
 (c.StudentCode=JSON_VALUE(@input,'$.actor.studentCode') AND c.ActorSource=JSON_VALUE(@input,'$.actor.source')
 AND c.ActorReference=JSON_VALUE(@input,'$.actor.reference')))`;
const selectOne=`SELECT ${columns} FROM ${table} c WHERE c.Id=@id FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER`;
const lock=`DECLARE @id int=TRY_CONVERT(int,JSON_VALUE(@input,'$.id')),@status varchar(20),@code char(4),@count int;
 SELECT @status=c.Status,@code=c.StartSemesterCode,@count=c.SemesterCount FROM ${table} c WITH(UPDLOCK,HOLDLOCK)
 WHERE c.Id=@id AND ${scope};
 IF @status IS NULL THROW 51504,'AL_NOT_FOUND',1;
 IF NOT EXISTS(SELECT 1 FROM ${table} WHERE Id=@id AND CONVERT(varchar(16),CONVERT(binary(8),RowVersion),2)=JSON_VALUE(@input,'$.expected'))
 THROW 51509,'AL_CONFLICT',1;`;
const fields=`Kind=JSON_VALUE(@input,'$.data.kind'),ParentApplicationId=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.parentApplicationId')),
 ReasonCode=JSON_VALUE(@input,'$.data.reasonCode'),StartSemesterCode=JSON_VALUE(@input,'$.data.startSemesterCode'),
 SemesterCount=TRY_CONVERT(tinyint,JSON_VALUE(@input,'$.data.semesterCount')),Content=JSON_VALUE(@input,'$.data.content')`;
const ordinal=column=>`(CONVERT(int,LEFT(${column},2))*2+CONVERT(int,SUBSTRING(${column},3,1))-1)`;
// One live successor per approved leave: either extension or return, never both.
const parentCheck=`DECLARE @kind varchar(20)=JSON_VALUE(@input,'$.data.kind'),
  @parent int=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.parentApplicationId')),
  @start char(4)=JSON_VALUE(@input,'$.data.startSemesterCode');
  IF @kind IN('extension','return') BEGIN
    IF NOT EXISTS(SELECT 1 FROM ${table} p WITH(UPDLOCK,HOLDLOCK)
      WHERE p.Id=@parent AND p.StudentCode=JSON_VALUE(@input,'$.actor.studentCode')
      AND p.ActorSource=JSON_VALUE(@input,'$.actor.source') AND p.ActorReference=JSON_VALUE(@input,'$.actor.reference')
      AND p.Kind IN('leave','extension') AND p.Status='approved'
      AND ((@kind='extension' AND ${ordinal('@start')}=${ordinal('p.StartSemesterCode')}+p.SemesterCount)
        OR (@kind='return' AND ${ordinal('@start')}>=${ordinal('p.StartSemesterCode')}+p.SemesterCount)))
      THROW 51509,'AL_PARENT',1;
    IF EXISTS(SELECT 1 FROM ${table} WHERE ParentApplicationId=@parent AND Id<>COALESCE(@id,0)
      AND Status NOT IN('rejected','cancelled')) THROW 51509,'AL_PARENT',1;
  END;
  IF @kind='leave' AND EXISTS(SELECT 1 FROM ${table} p WITH(UPDLOCK,HOLDLOCK)
    WHERE p.StudentCode=JSON_VALUE(@input,'$.actor.studentCode') AND p.Kind IN('leave','extension')
    AND p.Status='approved' AND NOT EXISTS(SELECT 1 FROM ${table} child
      WHERE child.ParentApplicationId=p.Id AND child.Status='approved'))
    THROW 51509,'AL_ACTIVE_LEAVE',1;`;
const openCheck=`IF EXISTS(SELECT 1 FROM ${table} WITH(UPDLOCK,HOLDLOCK)
  WHERE StudentCode=JSON_VALUE(@input,'$.actor.studentCode') AND Id<>COALESCE(@id,0)
    AND Status IN('draft','submitted','needs_changes','received','processing')) THROW 51509,'AL_OPEN',1;`;

export function createAcademicLeaveRepository({query=queryLocalDatabase,transaction=query===queryLocalDatabase?transactionLocalDatabase:query,connect=connectDatabase,now=Date.now,semesterCacheTtlMs=60000}={}) {
  let semesterCode,semesterExpiresAt=0,semesterLoading;
  async function run(statement,input={},transactional=false) {
    try {
      const result=await (transactional?transaction:query)('SET NOCOUNT ON; DECLARE @input nvarchar(max)=?; '+statement,[JSON.stringify(input)]);
      return JSON.parse(result.first?.[0]?.Json??'null');
    }catch(error){
      const message=String(error.message??error);
      if(/invalid column name.*ReceivedAt/i.test(message))throw new AppError('Cần nâng cấp workflow chứng chỉ/nghỉ học trên DB local.',503,
        {code:'REVIEW_WORKFLOW_MIGRATION_REQUIRED',command:'npm run db:review-workflow:upgrade'});
      if(message.includes('AL_NOT_FOUND'))throw new AppError('Không tìm thấy đơn của tài khoản này.',404);
      if(/UX_AcademicLeave_OpenStudent|AL_OPEN/.test(message))throw new AppError('Bạn đang có một đơn chưa xử lý xong. Hãy tiếp tục đơn đó hoặc chờ chuyên viên xử lý.',409);
      if(message.includes('UX_AcademicLeave_Parent'))throw new AppError('Đơn trước đã có một đơn gia hạn đang xử lý hoặc đã được duyệt. Hãy chọn đơn mới nhất để gia hạn tiếp.',409);
      if(message.includes('AL_ACTIVE_LEAVE'))throw new AppError('Bạn còn thời gian ngừng học trong lịch sử chưa kết thúc bằng đơn trở lại học. Hãy gia hạn hoặc lập đơn trở lại học từ đơn gần nhất.',409);
      if(/AL_CONFLICT|AL_PARENT|AL_OVERLAP|AL_STATE|AL_LATE|AL_LOCK|CK_AcademicLeave|UX_AcademicLeave|2601|2627/.test(message))
        throw new AppError('Đơn đã thay đổi, bị trùng thời gian/đơn gia hạn hoặc không còn ở trạng thái phù hợp. Vui lòng tải lại.',409);
      throw new AppError('Không truy cập được dữ liệu đơn ngừng học.',503);
    }
  }
  function mutate(input,statement,action) {
    return run(`SET XACT_ABORT ON; DECLARE @now datetime2(3)=SYSUTCDATETIME();
      DECLARE @studentLock varchar(9)=COALESCE(JSON_VALUE(@input,'$.actor.studentCode'),
        (SELECT StudentCode FROM ${table} WHERE Id=TRY_CONVERT(int,JSON_VALUE(@input,'$.id'))));
      DECLARE @resource nvarchar(255)=N'academic_leave:'+COALESCE(@studentLock,''),@lockResult int;
      EXEC @lockResult=sys.sp_getapplock @Resource=@resource,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
      IF @lockResult<0 THROW 51509,'AL_LOCK',1;
      ${statement}
      DECLARE @result nvarchar(max)=(${selectOne});
      INSERT academic_leave.ApplicationHistory(ApplicationId,Action,ActorSource,ActorReference,ActorName,Status,DataJson,CreatedAt)
        SELECT @id,JSON_VALUE(@input,'$.action'),JSON_VALUE(@input,'$.actor.source'),JSON_VALUE(@input,'$.actor.reference'),
          JSON_VALUE(@input,'$.actor.name'),Status,@result,@now FROM ${table} WHERE Id=@id;
      SELECT @result AS Json;
      `,{...input,action},true);
  }
  return Object.freeze({
    async currentSemesterCode({fresh=false}={}) {
      if(!fresh&&semesterCode&&semesterExpiresAt>now())return semesterCode;
      if(semesterLoading)return semesterLoading;
      semesterLoading=(async()=>{
        try {
          const pool=await connect('secondary','DATA_GVien1');
          const rows=(await pool.request().query("SELECT VarString1 AS code FROM dbo.tmConfig WHERE VarName=N'optIDCode' ORDER BY ID")).recordset;
          const codes=[...new Set(rows.map(row=>row.code?.trim()).filter(Boolean))];
          if(codes.length!==1||!/^\d{2}[12]0$/.test(codes[0]))throw new Error('ambiguous semester');
          semesterCode=codes[0];semesterExpiresAt=now()+semesterCacheTtlMs;
          return semesterCode;
        }catch{throw new AppError('Chưa xác định được học kỳ chính hiện tại từ cấu hình của trường.',503);}
      })();
      try{return await semesterLoading;}finally{semesterLoading=undefined;}
    },
    get(actor,id){return run(`DECLARE @id int=TRY_CONVERT(int,JSON_VALUE(@input,'$.id'));
      SELECT (SELECT ${columns} FROM ${table} c WHERE c.Id=@id AND ${scope} FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER) AS Json;`,{actor,id});},
    getByRequestCode(actor,requestCode){return run(`SELECT (SELECT ${columns} FROM ${table} c
      WHERE c.RequestCode=JSON_VALUE(@input,'$.requestCode') AND ${scope}
      FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER) AS Json;`,{actor,requestCode});},
    list(actor,{page=1,status=null}={}) {
      const filter=`${scope} AND (JSON_VALUE(@input,'$.status') IS NULL OR c.Status=JSON_VALUE(@input,'$.status'))`;
      return run(`DECLARE @page int=TRY_CONVERT(int,JSON_VALUE(@input,'$.page'));
        SELECT (SELECT @page AS page,20 AS pageSize,(SELECT COUNT(*) FROM ${table} c WHERE ${filter}) AS totalRecords,
        JSON_QUERY(COALESCE((SELECT ${columns.replace('JSON_QUERY(c.SnapshotJson) AS snapshot,',"JSON_VALUE(c.SnapshotJson,'$.student.fullName') AS fullName,")}
        FROM ${table} c WHERE ${filter} ORDER BY c.CreatedAt DESC,c.Id DESC OFFSET (@page-1)*20 ROWS FETCH NEXT 20 ROWS ONLY
        FOR JSON PATH,INCLUDE_NULL_VALUES),'[]')) AS items FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS Json;`,{actor,page,status});
    },
    history(actor,{page=1,applicationId=null}={}) {
      const filter=`${scope} AND (@applicationId IS NULL OR c.Id=@applicationId)`;
      return run(`DECLARE @page int=TRY_CONVERT(int,JSON_VALUE(@input,'$.page')),
        @applicationId int=TRY_CONVERT(int,JSON_VALUE(@input,'$.applicationId'));
        SELECT (SELECT @page AS page,20 AS pageSize,
          (SELECT COUNT(*) FROM academic_leave.ApplicationHistory h JOIN ${table} c ON c.Id=h.ApplicationId WHERE ${filter}) AS totalRecords,
          JSON_QUERY(COALESCE((SELECT h.Id AS id,h.ApplicationId AS applicationId,c.RequestCode AS requestCode,
            h.Action AS action,h.Status AS status,h.ActorName AS actorName,JSON_QUERY(h.DataJson) AS data,
            CONVERT(varchar(33),h.CreatedAt,126)+'Z' AS createdAt
            FROM academic_leave.ApplicationHistory h JOIN ${table} c ON c.Id=h.ApplicationId WHERE ${filter}
            ORDER BY h.Id DESC OFFSET (@page-1)*20 ROWS FETCH NEXT 20 ROWS ONLY
            FOR JSON PATH,INCLUDE_NULL_VALUES),'[]')) AS items FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS Json;`,{actor,page,applicationId});
    },
    eligibleParents(actor) {
      return run(`SELECT COALESCE((SELECT ${columns.replace('JSON_QUERY(c.SnapshotJson) AS snapshot,','')}
        FROM ${table} c WHERE ${scope} AND c.Kind IN('leave','extension') AND c.Status='approved' AND NOT EXISTS
        (SELECT 1 FROM ${table} child WHERE child.ParentApplicationId=c.Id AND child.Status NOT IN('rejected','cancelled'))
        ORDER BY c.Id DESC FOR JSON PATH,INCLUDE_NULL_VALUES),'[]') AS Json;`,{actor});
    },
    save(actor,data,id=null,expected=null) {
      return mutate({actor,data,id,expected},id?`${lock}
        IF @status NOT IN('draft','needs_changes') THROW 51509,'AL_STATE',1;
        ${openCheck}
        ${parentCheck}
        UPDATE ${table} SET ${fields},UpdatedAt=@now WHERE Id=@id;`:
        `DECLARE @id int=NULL;
        ${openCheck}
        ${parentCheck}
        DECLARE @student varchar(9)=JSON_VALUE(@input,'$.actor.studentCode'),@sequence int;
        SELECT @sequence=COALESCE(MAX(StudentSequence),0)+1 FROM ${table} WITH(UPDLOCK,HOLDLOCK,INDEX(UX_AcademicLeave_StudentSequence))
          WHERE StudentCode=@student;
        INSERT ${table}(StudentCode,StudentSequence,ActorSource,ActorReference,Kind,ParentApplicationId,ReasonCode,StartSemesterCode,SemesterCount,Content)
        VALUES(@student,@sequence,JSON_VALUE(@input,'$.actor.source'),JSON_VALUE(@input,'$.actor.reference'),
        JSON_VALUE(@input,'$.data.kind'),TRY_CONVERT(int,JSON_VALUE(@input,'$.data.parentApplicationId')),JSON_VALUE(@input,'$.data.reasonCode'),
        JSON_VALUE(@input,'$.data.startSemesterCode'),TRY_CONVERT(tinyint,JSON_VALUE(@input,'$.data.semesterCount')),JSON_VALUE(@input,'$.data.content'));
        SET @id=CONVERT(int,SCOPE_IDENTITY());`,id?'updated':'created');
    },
    confirm(actor,id,expected,snapshot) {
      return mutate({actor,id,expected,snapshot},`${lock}
        IF @status NOT IN('draft','needs_changes') THROW 51509,'AL_STATE',1;
        ${openCheck}
        SET @input=JSON_MODIFY(@input,'$.data',JSON_QUERY((SELECT Kind AS kind,ParentApplicationId AS parentApplicationId,
          StartSemesterCode AS startSemesterCode FROM ${table} WHERE Id=@id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)));
        ${parentCheck}
        IF EXISTS(SELECT 1 FROM ${table} c WITH(UPDLOCK,HOLDLOCK) WHERE c.StudentCode=JSON_VALUE(@input,'$.actor.studentCode')
          AND @kind<>'return' AND c.Kind<>'return' AND c.Id<>@id AND c.Status IN('submitted','received','processing','approved') AND ${ordinal('c.StartSemesterCode')}<=${ordinal('@code')}+@count-1
          AND ${ordinal('c.StartSemesterCode')}+c.SemesterCount-1>=${ordinal('@code')}) THROW 51509,'AL_OVERLAP',1;
        UPDATE ${table} SET SnapshotJson=JSON_QUERY(@input,'$.snapshot'),Status='submitted',StudentConfirmedAt=@now,
          ReviewerReference=NULL,ReviewerName=NULL,ReviewNote=NULL,ReviewedAt=NULL,ReceivedAt=NULL,PaperDeadlineAt=NULL,
          PaperReceivedAt=NULL,PaperReceivedBy=NULL,UpdatedAt=@now WHERE Id=@id;`,'confirmed');
    },
    review(actor,id,expected,data) {
      return mutate({actor,id,expected,data},`${lock}
        IF NOT((@status='submitted' AND JSON_VALUE(@input,'$.data.decision') IN('received','rejected','needs_changes'))
          OR (@status='processing' AND JSON_VALUE(@input,'$.data.decision') IN('approved','rejected')))
          THROW 51509,'AL_STATE',1;
        UPDATE ${table} SET Status=JSON_VALUE(@input,'$.data.decision'),ReviewNote=JSON_VALUE(@input,'$.data.note'),
          ReviewerReference=JSON_VALUE(@input,'$.actor.reference'),ReviewerName=JSON_VALUE(@input,'$.actor.name'),ReviewedAt=@now,
          ReceivedAt=CASE WHEN JSON_VALUE(@input,'$.data.decision')='received' THEN @now ELSE ReceivedAt END,
          PaperDeadlineAt=CASE WHEN JSON_VALUE(@input,'$.data.decision')='received' THEN DATEADD(day,3,@now) ELSE PaperDeadlineAt END,
          UpdatedAt=@now WHERE Id=@id;`,'reviewed');
    },
    receivePaper(actor,id,expected) {
      return mutate({actor,id,expected},`${lock}
        IF @status<>'received' THROW 51509,'AL_STATE',1;
        UPDATE ${table} SET Status='processing',PaperReceivedAt=@now,PaperReceivedBy=JSON_VALUE(@input,'$.actor.reference'),UpdatedAt=@now WHERE Id=@id;`,'paper_received');
    },
    cancel(actor,id,expected) {
      return mutate({actor,id,expected},`${lock}
        IF @status NOT IN('draft','needs_changes') THROW 51509,'AL_STATE',1;
        UPDATE ${table} SET Status='cancelled',UpdatedAt=@now WHERE Id=@id;`,'cancelled');
    },
  });
}
