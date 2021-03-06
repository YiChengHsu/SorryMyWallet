require('dotenv').config();
const {expect, requester} = require('./set_up');

describe('sign up', () => {

  it('sign up success', async () => {
    const user = {
      provider: 'native',
      name: 'Frank',
      email: 'fish@test.com',
      password: 'kkkkkk,',
      picture: null
    }

    const res = await requester.post('/api/1.0/user/signup').send(user);

    expect(res.status).to.equal(200);
  })

  it('sign up without name or email or password', async () => {
    const user = {
      provider: 'native',
      name: 'Frank',
      password: 'kkkkkk,',
      picture: null
    }

    const res = await requester.post('/api/1.0/user/signup').send(user);

    expect(res.status).to.equal(400);
  })

  it('sign up with existed email', async () => {
    const user = {
      provider: 'native',
      name: 'Frank',
      role_id : 1,
      email: 'test@test.com',
      password: 'kkkkkk,',
      picture: null
    }

    const res = await requester.post('/api/1.0/user/signup').send(user);

    expect(res.status).to.equal(400);
  })

  it('sign in with user 1', async() => {
    const user = {
      provider: 'native',
      email: 'test@test.com',
      password: '111111',
    }

    const res = await requester.post('/api/1.0/user/signin').send(user);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('object');
    expect(res.body.data.user).to.be.an('object');
    expect(res.body.data.access_token).to.be.an('string');
  })
})
