export function createStudentProfileService(repository,school){
  return{
    async get(studentId,options){
      const actor=await repository.actor(studentId);
      if(actor?.IdentitySource==='SSO')await school.refresh(studentId,options);
      return repository.profile(studentId);
    },
  };
}
