// @ts-check

import i18next from 'i18next';
import debug from 'debug';
import { ValidationError } from 'objection';

const logApp = debug('app:routes:labels');

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })

    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label(); // eslint-disable-line
      reply.render('labels/new', { label });
      return reply;
    })

    .post('/labels', { name: 'labelCreate', preValidation: app.authenticate }, async (req, reply) => {
      logApp('post data %O', req.body.data);
      try {
        const label = await app.objection.models.label.fromJson(req.body.data);
        logApp('label %O', label);

        await app.objection.models.label.query().insert(label);

        req.flash('info', i18next.t('flash.labels.create.success'));
        return reply.redirect(app.reverse('labels'));
      } catch (err) {
        logApp('post error %O', err);
        if (err instanceof ValidationError) {
          req.flash('error', i18next.t('flash.labels.create.error'));
          const label = new app.objection.models.label().$set(req.body.data); // eslint-disable-line
          reply.render(app.reverse('newLabel'), {
            label, errors: err.data,
          });
          return reply.code(422);
        }
        throw Error;
      }
    })

    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      reply.render('labels/edit', { label });
      return reply;
    })

    .delete('/labels/:id', {
      name: 'deleteLabel', preValidation: app.authenticate,
    }, async (req, reply) => {
      await app.objection.models.label.query().deleteById(req.params.id);
      req.flash('info', i18next.t('flash.labels.delete.success'));
      reply.redirect(app.reverse('labels'));
      return reply;
    })

    .patch('/labels/:id', {
      name: 'updateLabel', preValidation: app.authenticate,
    }, async (req, reply) => {
      logApp('updateLabel req.params %O', req.params);
      const label = await app.objection.models.label.query().findById(req.params.id);
      logApp('fetched label %O', label);
      try {
        await label.$query().update({ ...req.body.data, creatorId: parseInt(req.params.id, 10) });
        req.flash('info', i18next.t('flash.labels.update.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch (err) {
        logApp('updateLabel error %O', err);
        if (!(err instanceof ValidationError)) throw err;
        req.flash('error', i18next.t('flash.labels.update.error'));
        reply.render('tasks/edit', { label, errors: err.data });
        return reply.code(422);
      }
    });
};
