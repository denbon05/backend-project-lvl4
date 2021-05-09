// @ts-check

import i18next from 'i18next';
import debug from 'debug';
import { ValidationError } from 'objection';

const logApp = debug('app:routes:tasks');

const parseTaskData = (data) => Object.entries(data)
  .reduce((acc, [key, value]) => {
    if ((key.match('executorId') && !value) || key.match('labelIds')) return acc;
    if (key.match(/id/gi)) return { ...acc, ...(value && { [key]: parseInt(value, 10) }) };
    return { ...acc, [key]: value };
  }, {});

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const tasksQwery = app.objection.models.task.query()
        .withGraphJoined('[creator, executor, status]');

      const [tasks, users, statuses, labels] = await Promise.all([
        tasksQwery,
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);

      reply.render('tasks/index', {
        tasks,
        users,
        statuses,
        labels,
      });
      return reply;
    })

    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task(); // eslint-disable-line
      const [users, statuses, labels] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('tasks/new', {
        task,
        users,
        statuses,
        labels,
      });
      return reply;
    })

    .post('/tasks', { name: 'createTask', preValidation: app.authenticate }, async (req, reply) => {
      logApp('req.body.data %O', req.body.data);
      const labelIds = req.body.data.labelIds || [];
      try {
        const task = await app.objection.models.task.fromJson({
          ...(parseTaskData(req.body.data)),
          creatorId: req.user.id,
        });
        logApp('task %O', task);

        const labels = [labelIds].flat().map((id) => ({ id: parseInt(id, 10) }));
        logApp('labels %O', labels);
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).insertGraph([{
            ...task, labels,
          }], { relate: ['labels'] });
        });

        req.flash('info', i18next.t('flash.task.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        logApp('post error %O', err);
        if (!(err instanceof ValidationError)) throw Error(err);
        req.flash('error', i18next.t('flash.task.create.error'));
        const task = new app.objection.models.task().$set(req.body.data); // eslint-disable-line
        const [users, statuses, labels] = await Promise.all([
          app.objection.models.user.query(),
          app.objection.models.taskStatus.query(),
          app.objection.models.label.query(),
        ]);
        reply.render(app.reverse('newTask'), {
          task, users, statuses, labels, errors: err.data,
        });
        return reply.code(422);
      }
    })

    .get('/tasks/:id', { name: 'showTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const task = await app.objection.models.task
          .query().findById(id).withGraphJoined('[creator, executor, status, labels]');
        logApp('show task %O', task);
        reply.render('tasks/show', { task });
        return reply;
      } catch (err) {
        logApp('showTask error %O', err);
        req.flash('error', i18next.t('flash.task.showError'));
        return reply.redirect(app.reverse('tasks'));
      }
    })

    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const [task, users, statuses, labels] = await Promise.all([
        app.objection.models.task.query().findById(req.params.id),
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('tasks/edit', {
        task,
        users,
        statuses,
        labels,
      });
      return reply;
    })

    .delete('/tasks/:id', {
      name: 'deleteTask',
      preValidation: app.auth([app.checkIfUserCreatedTask, app.authenticate]),
    }, async (req, reply) => {
      await app.objection.models.task.query().deleteById(req.params.id);
      req.flash('info', i18next.t('flash.task.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    })

    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      logApp('updateTask req.params %O', req.params);
      const labelIds = req.body.data.labelIds ?? [];
      logApp('updateTask req.body.data %O', req.body.data);
      try {
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).upsertGraph({
            id: Number(req.params.id),
            ...(parseTaskData(req.body.data)),
            labels: [labelIds].flat().map((id) => ({ id: parseInt(id, 10) })),
          }, { relate: true, unrelate: true });
        });
        req.flash('info', i18next.t('flash.task.update.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        logApp('updateTask error %O', err);
        if (!(err instanceof ValidationError)) throw err;
        req.flash('error', i18next.t('flash.task.update.error'));
        const [task, users, statuses, labels] = await Promise.all([
          app.objection.models.task.query().findById(req.params.id),
          app.objection.models.user.query(),
          app.objection.models.status.query(),
          app.objection.models.label.query()]);
        reply.render('tasks/edit', {
          task,
          users,
          statuses,
          labels,
          errors: err.data,
        });
        return reply.code(422);
      }
    });
};
