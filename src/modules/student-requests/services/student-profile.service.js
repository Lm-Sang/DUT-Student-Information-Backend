export function createStudentProfileService(repository,school){
  return{
    async get(studentId){
      const actor=await repository.actor(studentId);
      if(actor?.IdentitySource==='SSO')await school.refresh(studentId);
      return repository.profile(studentId);
    },
  };
}
