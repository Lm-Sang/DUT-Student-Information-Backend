// Never replace bind markers inside SQL strings, identifiers or comments.
export function transformSql(statement,replace){
  let output='',plain='',i=0;
  const flush=()=>{output+=replace(plain);plain='';};
  while(i<statement.length){
    const c=statement[i],next=statement[i+1];
    if(c==="'"||c==='"'||c==='['){
      flush();const end=c==='['?']':c;output+=c;i++;
      while(i<statement.length){const q=statement[i++];output+=q;if(q===end){if(statement[i]===end){output+=statement[i++];}else break;}}
    }else if(c==='-'&&next==='-'){
      flush();const end=statement.indexOf('\n',i);if(end===-1){output+=statement.slice(i);i=statement.length;}else{output+=statement.slice(i,end+1);i=end+1;}
    }else if(c==='/'&&next==='*'){
      flush();let depth=1;output+='/*';i+=2;
      while(i<statement.length&&depth){if(statement.slice(i,i+2)==='/*'){depth++;output+='/*';i+=2;}else if(statement.slice(i,i+2)==='*/'){depth--;output+='*/';i+=2;}else output+=statement[i++];}
    }else{plain+=c;i++;}
  }
  flush();return output;
}
export function positionalSql(statement,parameters=[]){
  let index=0;const text=transformSql(statement,part=>part.replace(/\?/g,()=>`@${index++}`));
  if(index===0&&parameters.length&&/@\d+\b/.test(text))return text; // TypeORM QueryBuilder's native MSSQL parameters.
  if(index!==parameters.length)throw new TypeError('SQL parameter count does not match placeholders.');return text;
}
export function namedSql(statement,inputs){
  const positions=new Map([...inputs.keys()].map((name,index)=>[name,`@${index}`]));
  return {text:transformSql(statement,part=>part.replace(/(?<!@)@([A-Za-z_][\w]*)/g,(match,name)=>positions.get(name)??match)),values:[...inputs.values()]};
}
export function assertReadOnlySql(statement){
  let plain='';transformSql(statement,part=>{plain+=part;return part;});
  if(!/^\s*(SELECT|WITH)\b/i.test(plain)||/\b(INSERT|UPDATE|DELETE|MERGE|EXEC(?:UTE)?|INTO|CREATE|ALTER|DROP|TRUNCATE|GRANT|DENY|REVOKE|BACKUP|RESTORE|DBCC|USE)\b/i.test(plain))throw new Error('School database access is SELECT-only.');
}
