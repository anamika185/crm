import { Router, type Request, type Response } from 'express';
import type { Db } from './db.js';
import { STAGES } from './db.js';

function idParam(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new Error('Invalid id');
  return id;
}

function handle(route: (req: Request, res: Response) => unknown) {
  return (req: Request, res: Response) => {
    try {
      const result = route(req, res);
      if (result !== undefined && result !== null) res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Request failed' });
    }
  };
}

export function createApi(db: Db): Router {
  const api = Router();

  // ---------- Organizations ----------
  api.get('/organizations', handle((req) => db.listOrganizations((req.query.q as string) ?? '')));

  api.get('/organizations/:id', handle((req) => {
    const org = db.getOrganization(idParam(req));
    if (!org) throw new Error('Organization not found');
    return org;
  }));

  api.post('/organizations', handle((req) => db.createOrganization(req.body)));

  api.put('/organizations/:id', handle((req) => {
    const org = db.updateOrganization(idParam(req), req.body);
    if (!org) throw new Error('Organization not found');
    return org;
  }));

  api.delete('/organizations/:id', handle((req) => {
    db.deleteOrganization(idParam(req));
    return { ok: true };
  }));

  // ---------- Contacts ----------
  api.get('/contacts', handle((req) =>
    db.listContacts({ search: (req.query.q as string) ?? '', status: (req.query.status as string) ?? '' })
  ));

  api.get('/contacts/:id', handle((req) => {
    const contact = db.getContact(idParam(req));
    if (!contact) throw new Error('Contact not found');
    return contact;
  }));

  api.post('/contacts', handle((req) => db.createContact(req.body)));

  api.put('/contacts/:id', handle((req) => {
    const contact = db.updateContact(idParam(req), req.body);
    if (!contact) throw new Error('Contact not found');
    return contact;
  }));

  api.delete('/contacts/:id', handle((req) => {
    db.deleteContact(idParam(req));
    return { ok: true };
  }));

  // ---------- Deals ----------
  api.get('/deals', handle((req) => db.listDeals({ search: (req.query.q as string) ?? '' })));

  api.get('/deals/:id', handle((req) => {
    const deal = db.getDeal(idParam(req));
    if (!deal) throw new Error('Deal not found');
    return deal;
  }));

  api.post('/deals', handle((req) => db.createDeal(req.body)));

  api.put('/deals/:id', handle((req) => {
    const deal = db.updateDeal(idParam(req), req.body);
    if (!deal) throw new Error('Deal not found');
    return deal;
  }));

  api.patch('/deals/:id/stage', handle((req) => {
    const stage = req.body?.stage;
    if (!STAGES.includes(stage)) throw new Error('Invalid stage');
    const deal = db.setDealStage(idParam(req), stage);
    if (!deal) throw new Error('Deal not found');
    return deal;
  }));

  api.delete('/deals/:id', handle((req) => {
    db.deleteDeal(idParam(req));
    return { ok: true };
  }));

  api.get('/pipeline', handle(() => db.getPipeline()));

  // ---------- Activities ----------
  api.get('/activities', handle(() => db.listActivities({ limit: 50 })));

  api.post('/activities', handle((req) => db.createActivity(req.body)));

  api.patch('/activities/:id', handle((req) => {
    const activity = db.updateActivity(idParam(req), req.body);
    if (!activity) throw new Error('Activity not found');
    return activity;
  }));

  api.patch('/activities/:id/done', handle((req) => {
    const activity = db.setActivityDone(idParam(req), !!req.body?.done);
    if (!activity) throw new Error('Activity not found');
    return activity;
  }));

  api.delete('/activities/:id', handle((req) => {
    db.deleteActivity(idParam(req));
    return { ok: true };
  }));

  // ---------- Dashboard ----------
  api.get('/dashboard', handle(() => db.getDashboard()));

  return api;
}