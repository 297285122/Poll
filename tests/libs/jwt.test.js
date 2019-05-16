import test from 'ava';
import tokenProxy from '../../src/common/jwt';

test('create and verify token', (t) => {
  const user = { email: '9999999@163.com', name: 'cindy' };
  const token = tokenProxy.createToken(user);
  const { err, user: decodeUser } = tokenProxy.getUserInfo(token);
  t.is(decodeUser.email, user.email);
  t.is(decodeUser.name, user.name);
});
