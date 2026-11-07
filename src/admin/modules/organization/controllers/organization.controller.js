export function createOrganizationController(service) {
  const handle = action => async (req, res, next) => {
    try { res.set('Cache-Control', 'no-store').json({ data: await action(req) }); }
    catch (error) { next(error); }
  };
  return {
    catalog: handle(req => service.catalog(req.user)),
    syncPermissionCatalog:handle(req=>service.syncPermissionCatalog(req.user)),
    accounts: handle(req => service.accounts(req.user)),
    createRole:handle(req=>service.saveRole(req.user,null,req.body)),
    updateRole:handle(req=>service.saveRole(req.user,req.params.id,req.body)),
    updatePermissionTag:handle(req=>service.updatePermissionTag(req.user,req.params.key,req.body)),
    create: handle(req => service.saveAccount(req.user, null, req.body)),
    update: handle(req => service.saveAccount(req.user, req.params.id, req.body)),
    remove: handle(req => service.removeAccount(req.user, req.params.id, req.body)),
    saveField: handle(req => service.saveField(req.user, req.params.code, req.body)),
    removeField: handle(req => service.saveField(req.user, req.params.code, null, true)),
    progress: handle(req => service.progress(req.user, req.params.taskId, req.query)),
  };
}
