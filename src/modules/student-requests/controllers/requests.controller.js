import { parseCommand, parseCreate, parseId, parsePrintCommand } from '../dto/requests.dto.js';

export function createRequestsController(service) {
  return {
    actors: async (_req, res) => res.json({ data: await service.actors() }),
    catalogs: async (_req, res) => res.json({ data: await service.catalogs() }),
    me: (req, res) => res.json({ data: req.demoActor }),
    profile: async (req, res) => { const profile = await service.profile(req.demoActor); if (profile) delete profile.photoBase64; res.json({ data: profile }); },
    download: async (req, res) => {
      const file = await service.download(req.demoActor, parseId(req.params.id));
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': String(file.bytes.length), 'X-Content-SHA256': file.sha256, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' }).send(file.bytes);
    },
    list: async (req, res) => res.json({ data: await service.list(req.demoActor) }),
    printConfirmation: async (req, res) => {
      const file = await service.printConfirmation(req.demoActor, parseId(req.params.id), parsePrintCommand(req.body));
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': String(file.bytes.length), 'X-Content-SHA256': file.sha256, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' }).send(file.bytes);
    },
    detail: async (req, res) => res.json({ data: await service.detail(req.demoActor, parseId(req.params.id)) }),
    create: async (req, res) => res.status(201).json({ data: await service.create(req.demoActor, parseCreate(req.body)) }),
    command: async (req, res) => res.json({ data: await service.command(req.demoActor, parseId(req.params.id), parseCommand(req.body)) }),
  };
}
