import { parseCommand, parseId, parsePrintCommand } from '../dto/requests.dto.js';

export function createRequestsController(service) {
  return {
    catalogs: async (_req, res) => res.json({ data: await service.catalogs() }),
    me: (req, res) => res.json({ data: req.requestActor }),
    profile: async (req, res) => { const profile = await service.profile(req.requestActor); if (profile) delete profile.photoBase64; res.json({ data: profile }); },
    download: async (req, res) => {
      const file = await service.download(req.requestActor, parseId(req.params.id));
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': String(file.bytes.length), 'X-Content-SHA256': file.sha256, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' }).send(file.bytes);
    },
    list: async (req, res) => res.json({ data: await service.list(req.requestActor) }),
    printConfirmation: async (req, res) => {
      const file = await service.printConfirmation(req.requestActor, parseId(req.params.id), parsePrintCommand(req.body));
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': String(file.bytes.length), 'X-Content-SHA256': file.sha256, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' }).send(file.bytes);
    },
    detail: async (req, res) => res.json({ data: await service.detail(req.requestActor, parseId(req.params.id)) }),
    command: async (req, res) => res.json({ data: await service.command(req.requestActor, parseId(req.params.id), parseCommand(req.body)) }),
  };
}
