export default {
  translation: {
    appName: 'Task Manager',
    flash: {
      session: {
        create: {
          success: 'You are logged in',
          error: 'Invalid email or password',
        },
        delete: {
          success: 'You are logged out',
        },
      },
      users: {
        create: {
          error: 'Failed to register',
          success: 'User registered successfully',
        },
        update: {
          error: 'Failed to change user',
          success: 'The user was successfully changed',
          notAuthErr: 'You cannot edit or delete another user',
        },
        delete: {
          success: 'The user was successfully deleted',
          error: 'Failed to delete user',
        },
        authError: 'You cannot edit or delete another user',
      },
      status: {
        create: {
          success: 'Status successfully created',
          error: 'Failed to create status',
        },
        update: {
          error: 'Failed to change status',
          success: 'Status changed successfully',
        },
      },
      task: {
        create: {
          success: 'The task was successfully created',
          error: 'Failed to create task',
        },
        update: {
          success: 'The task was successfully updated',
          error: 'Failed to update task',
        },
        delete: {
          success: 'The task was successfully deleted',
        },
        showError: 'There is no task with these parameters',
      },
      labels: {
        create: {
          success: 'Label was created successfully',
          error: 'Failed to create label',
        },
        delete: {
          success: 'Label was successfully deleted',
          error: 'Failed to remove label',
        },
        update: {
          success: 'Label changed successfully',
          error: 'Failed to change label',
        },
      },
      authError: 'Access denied! Please log in. ',
    },
    layouts: {
      application: {
        users: 'Users',
        signIn: 'Sign in',
        signUp: 'Register',
        signOut: 'Sign out',
        statuses: 'Statuses',
        tasks: 'Tasks',
        labels: 'Labels',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Sign in',
          submit: 'Login',
        },
      },
      users: {
        notAnyUsers: 'There are no users yet',
        id: 'ID',
        fullName: 'Full name',
        email: 'Email',
        createdAt: 'Creation date',
        password: 'Password',
        title: 'Change user',
        new: {
          submit: 'Save',
          signUp: 'Register',
        },
      },
      welcome: {
        index: {
          hello: 'Hello from Hexlet!',
          description: 'Practical programming courses',
          more: 'Learn More',
        },
      },
      statuses: {
        id: 'ID',
        name: 'Name',
        createdAt: 'Creation date',
        titleUpdate: 'Status update',
        new: {
          create: 'Create Status',
          title: 'Create Status',
        },
      },
      tasks: {
        create: 'Create task',
        createTitle: 'Create a task',
        editTitle: 'Editing a task',
        id: 'ID',
        name: 'Name',
        statusId: 'Status',
        author: 'Author',
        executorId: 'Artist',
        createdAt: 'Creation date',
      },
      labels: {
        id: 'ID',
        name: 'Name',
        createdAt: 'Creation date',
        titleUpdate: 'Change label',
        new: {
          create: 'Create Label',
          title: 'Create Label',
        },
      },

      manage: {
        edit: 'Edit',
        delete: 'Delete',
        submit: 'Create',
      },
    },
    form: {
      firstName: 'Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      description: 'Description',
      status: 'Status',
    },
  },
};
