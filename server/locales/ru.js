export default {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный емейл или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать',
          success: 'Пользователь успешно зарегистрирован',
        },
        update: {
          error: 'Не удалось изменить пользователя',
          success: 'Пользователь успешно изменён',
          notAuthErr: 'Вы не можете редактировать или удалять другого пользователя',
        },
        authError: 'Вы не можете редактировать или удалять другого пользователя',
      },
      status: {
        create: {
          success: 'Статус успешно создан',
          error: 'Не удалось создать статус',
        },
        update: {
          error: 'Не удалось изменить статус',
          success: 'Статус успешно изменён',
        },
      },
      task: {
        create: {
          success: 'Задача успешно создана',
          error: 'Не удалось создать задачу',
        },
        update: {
          success: 'Задача успешно обновлена',
          error: 'Не удалось обновить задачу',
        },
        delete: {
          success: 'Задача успешно удалена',
        },
        showError: 'Нет задачи с такими параметрами',
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
        statuses: 'Статусы',
        tasks: 'Задачи',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Вход',
          submit: 'Войти',
        },
      },
      users: {
        notAnyUsers: 'Пока еще нету пользователей',
        id: 'ID',
        fullName: 'Полное имя',
        email: 'Email',
        createdAt: 'Дата создания',
        password: 'Пароль',
        title: 'Изменение пользователя',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
      },
      welcome: {
        index: {
          hello: 'Привет от Хекслета!',
          description: 'Практические курсы по программированию',
          more: 'Узнать Больше',
        },
      },
      statuses: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        titleUpdate: 'Изменение статуса',
        new: {
          create: 'Создать статус',
          title: 'Создание статуса',
        },
      },
      tasks: {
        create: 'Создать задачу',
        createTitle: 'Создание задачи',
        editTitle: 'Изменение задачи',
        id: 'ID',
        name: 'Наименование',
        statusId: 'Статус',
        author: 'Автор',
        executorId: 'Исполнитель',
        createdAt: 'Дата создания',
      },
      manage: {
        edit: 'Изменить',
        delete: 'Удалить',
        submit: 'Создать',
      },
    },
    form: {
      firstName: 'Имя',
      lastName: 'Фамилия',
      email: 'Email',
      password: 'Пароль',
      name: 'Наименование',
      description: 'Описание',
      status: 'Статус',
    },
  },
};
