import { Strategy } from 'fastify-passport';

export default class AuthorizeStrategy extends Strategy {
  constructor(name) { // eslint-disable-line
    super(name);
  }

  async authenticate(request) {
    if (request.user?.id !== Number(request.params.id)) {
      return this.fail();
    }
    return this.pass();
  }
}
