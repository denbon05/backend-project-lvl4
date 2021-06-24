import i18next from 'i18next';
import debug from 'debug';
import { omit } from 'lodash';

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
      const { query, user: { id } } = req;
      logApp('GET tasks req.query %O', req.query);

      const tasksQuery = app.objection.models.task.query()
        .withGraphJoined('[creator, executor, status, labels]');

      if (query.status) tasksQuery.modify('filterStatus', query.status);
      if (query.executor) tasksQuery.modify('filterExecutor', query.executor);
      if (query.label) tasksQuery.modify('filterLabel', query.label);
      if (query.isCreatorUser) tasksQuery.modify('filterCreator', id);

      const [tasks, users, statuses, labels] = await Promise.all([
        tasksQuery,
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);

      reply.render('tasks/index', {
        tasks,
        users,
        statuses,
        labels,
        query: req.query,
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
          logApp('task.$relatedQuery to labels %O', await task.$relatedQuery('labels'));
        });
        const fromDbTask = await app.objection.models.task
          .query().findOne({ name: req.body.data.name });
        logApp('task from DB =>', fromDbTask);

        req.flash('info', i18next.t('flash.task.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        logApp('post error.data %O', data);
        req.flash('error', i18next.t('flash.task.create.error'));
        const task = new app.objection.models.task().$set(req.body.data);
        const [users, statuses, labels] = await Promise.all([
          app.objection.models.user.query(),
          app.objection.models.taskStatus.query(),
          app.objection.models.label.query(),
        ]);
        task.labelIds = labelIds;

        logApp('POST in  catch task %O', task);
        logApp('POST in  catch labels %O', labels);

        reply.render(app.reverse('newTask'), {
          task, users, statuses, labels, errors: data,
        });
      }
      return reply;
    })

    .get('/tasks/:id', { name: 'showTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const task = await app.objection.models.task
          .query().findById(id).withGraphJoined('[creator, executor, status, labels]');
        logApp('show task %O', task);
        reply.render('tasks/show', { task });
      } catch ({ data }) {
        logApp('showTask error.data %O', data);
        req.flash('error', i18next.t('flash.task.showError'));
        reply.redirect(app.reverse('tasks'));
      }
      return reply;
    })

    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const [task, users, statuses, labels] = await Promise.all([
        app.objection.models.task.query().findById(req.params.id).withGraphJoined('labels'),
        app.objection.models.user.query(),
        app.objection.models.taskStatus.query(),
        app.objection.models.label.query(),
      ]);
      logApp('edit labels %O', labels);
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
      logApp('creatorId %O', creatorId);
      logApp('req.user.id %O', req.user.id);
      if (req.user.id !== creatorId) {
        logApp('User is not creator of task');
        req.flash('error', i18next.t('flash.task.authError'));
        return reply.redirect('/tasks');
      }
      await app.objection.models.task.query().deleteById(req.params.id);
      req.flash('info', i18next.t('flash.task.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    })

    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      logApp('updateTask req.params %O', req.params);
      const labelIds = req.body.data.labelIds ?? [];
      logApp('updateTask req.body.data %O', req.body.data);
      const oldTask = await app.objection.models.task.query().findById(req.params.id);
      logApp('in PATCH oldTask %O', oldTask);
      try {
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).update({
            ...(parseTaskData(omit(oldTask, ['name', 'statusId', 'description']))),
            ...(parseTaskData(req.body.data)),
            labels: [labelIds].flat().map((id) => ({ id: parseInt(id, 10) })),
          }).where('id', req.params.id);
        });
        req.flash('info', i18next.t('flash.task.update.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        logApp('updateTask error.data %O', data);
        req.flash('error', i18next.t('flash.task.update.error'));
        const tasksQuery = app.objection.models.task
          .query().findById(req.params.id).withGraphJoined('[creator, executor, status, labels]');
        const [task, users, statuses, labels] = await Promise.all([
          tasksQuery,
          app.objection.models.user.query(),
          app.objection.models.taskStatus.query(),
          app.objection.models.label.query(),
        ]);

        task.name = req.body.data.name;
        task.description = req.body.data.description;
        task.labelIds = labelIds;
        logApp('PATCH in  catch task %O', task);

        reply.render('tasks/edit', {
          task,
          users,
          statuses,
          labels,
          errors: data,
        });
      }
      return reply;
    });
};
