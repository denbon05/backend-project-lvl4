// @ts-check

import i18next from 'i18next';
import debug from 'debug';
import { omit } from 'lodash';

const logApp = debug('app:routes:tasks');

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const { query: filterOptions, user: { id } } = req;
      logApp('GET tasks req.query %O', req.query);

      const tasksQuery = app.objection.models.task.query()
        .withGraphJoined('[creator, executor, status, labels]');

      if (filterOptions.status) tasksQuery.modify('filterStatus', filterOptions.status);
      if (filterOptions.executor) tasksQuery.modify('filterExecutor', filterOptions.executor);
      if (filterOptions.label) tasksQuery.modify('filterLabel', filterOptions.label);
      if (filterOptions.isCreatorUser) tasksQuery.modify('filterCreator', id);

      const [tasks, users, statuses, labels] = await Promise.all([
        tasksQuery,
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);

      logApp('GET tasks %O', tasks);

      reply.render('tasks/index', {
        tasks,
        users,
        statuses,
        labels,
        filterOptions,
      });
      return reply;
    })

    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
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
      logApp('POST req.body.data %O', req.body.data);
      const labelIds = req.body.data.labels || [];
      try {
        const taskData = await app.objection.models.task.fromJson({
          ...omit(req.body.data, ['labels']),
          creatorId: req.user.id,
        });
        logApp('POST createTask taskData %O', taskData);
        const labels = [labelIds].flat().map((id) => ({ id: Number(id) }));
        logApp('POST GRAPH %O', taskData);
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).allowGraph('labels').insertGraph([{
            ...taskData, labels,
          }], { relate: true });
        });
        req.flash('info', i18next.t('flash.task.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (err) {
        logApp('post error %O', err);
        req.flash('error', i18next.t('flash.task.create.error'));
        const task = new app.objection.models.task().$set(req.body.data);
        const [users, statuses, labels] = await Promise.all([
          app.objection.models.user.query(),
          app.objection.models.taskStatus.query(),
          app.objection.models.label.query(),
        ]);
        task.labelIds = labelIds;

        reply.render(app.reverse('newTask'), {
          task, users, statuses, labels, errors: err.data,
        });
      }
      return reply;
    })

    .get('/tasks/:id', { name: 'showTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const task = await app.objection.models.task
          .query().findById(id).withGraphJoined('[creator, executor, status, labels]');
        reply.render('tasks/show', { task });
      } catch (err) {
        logApp('showTask error.data %O', err);
        req.flash('error', i18next.t('flash.task.showError'));
        reply.redirect(app.reverse('tasks'));
      }
      return reply;
    })

    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const [task, users, statuses, labels] = await Promise.all([
        app.objection.models.task.query().findById(req.params.id)
          .withGraphJoined('[creator, executor, status, labels]'),
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);
      logApp('editTask %O', task);
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
      preValidation: app.authenticate,
    }, async (req, reply) => {
      const { creatorId } = await app.objection.models.task.query().findById(req.params.id);
      if (req.user.id !== creatorId) {
        req.flash('error', i18next.t('flash.task.authError'));
      } else {
        await app.objection.models.task.query().deleteById(req.params.id);
        req.flash('info', i18next.t('flash.task.delete.success'));
      }
      reply.redirect(app.reverse('tasks'));
      return reply;
    })

    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      logApp('updateTask req.params %O', req.params);
      const labelIds = req.body.data.labels ?? [];
      logApp('updateTask req.body.data %O', req.body.data);
      const oldTask = await app.objection.models.task.query()
        .findById(req.params.id);
      try {
        const labels = await app.objection.models.label.query().findByIds(labelIds);
        const taskData = await app.objection.models.task.fromJson({
          ...oldTask,
          ...req.body.data,
          labels,
        });
        logApp('in PATCH taskData %O', taskData);
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx)
            .allowGraph('labels')
            .upsertGraph(taskData, { relate: true, unrelate: true, noDelete: true });
        });
        req.flash('info', i18next.t('flash.task.update.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (err) {
        logApp('updateTask error %O', err);
        req.flash('error', i18next.t('flash.task.update.error'));
        const task = new app.objection.models.task().$set({ ...oldTask, ...req.body.data });
        const [users, statuses, labels] = await Promise.all([ // eslint-disable-line
          app.objection.models.user.query(),
          app.objection.models.taskStatus.query(),
          app.objection.models.label.query(),
        ]);

        reply.render('tasks/edit', {
          task,
          users,
          statuses,
          labels,
          errors: err.data,
        });
      }
      return reply;
    });
};
