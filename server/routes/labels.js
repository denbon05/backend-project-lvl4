import i18next from 'i18next';
import debug from 'debug';

const logApp = debug('app:routes:labels');

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })

    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
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
        reply.redirect(app.reverse('labels'));
      } catch ({ data }) {
        logApp('post error %O', data);
        req.flash('error', i18next.t('flash.labels.create.error'));
        const label = new app.objection.models.label().$set(req.body.data);
        reply.render(app.reverse('newLabel'), {
          label, errors: data,
        });
        reply.code(422);
      }
      return reply;
    })

    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      reply.render('labels/edit', { label });
      return reply;
    })

    .delete('/labels/:id', {
      name: 'deleteLabel', preValidation: app.authenticate,
    }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      logApp('delete label %O', label);
      const tasks = await label.$relatedQuery('tasks');
      logApp('tasks %O', tasks);
      if (tasks.length === 0) {
        await label.$query().delete();
        req.flash('info', i18next.t('flash.labels.delete.success'));
      } else {
        req.flash('error', i18next.t('flash.labels.delete.error'));
      }
      reply.redirect(app.reverse('labels'));
      return reply;
    })

    .patch('/labels/:id', {
      name: 'updateLabel', preValidation: app.authenticate,
    }, async (req, reply) => {
      logApp('updateLabel req.params %O', req.params);
      try {
        const label = await app.objection.models.label.query().findById(req.params.id);
        logApp('fetched label %O', label);
        await label.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.labels.update.success'));
        reply.redirect(app.reverse('labels'));
      } catch ({ data }) {
        logApp('updateLabel error.data %O', data);
        req.flash('error', i18next.t('flash.labels.update.error'));
        const label = new app.objection.models.label().$set(req.body.data);
        reply.render('labels/edit', { label, errors: data });
        reply.code(422);
      }
      return reply;
    });
};
