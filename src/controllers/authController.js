import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createHttpError(400, 'Email in use'));
  }

  // Хешуємо пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  //  Створюємо нового користувача
  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  // Створюємо нову сесію
  const newSession = await createSession(newUser._id);

  // Вимикаємо, передаємо об'єкт сесії у відповідь
  setSessionCookies(res, newSession);

  // Відправляємо дані користувача у відповіді без пароля
  res.status(201).json(newUser);
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  // перевіряємо чи користувач з такою поштою існує
  const user = await User.findOne({ email });
  if (!user) {
    return next(createHttpError(401, 'User not found'));
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return next(createHttpError(401, 'Invalid credentials'));
  }

  //Видаляємо стару сесію користувача, якщо вона існує
  await Session.deleteOne({ userId: user._id });

  // Створюємо нову сесію для користувача
  const newSession = await createSession(user._id);

  // Вимикаємо, передаємо об'єкт сесії у відповідь
  setSessionCookies(res, newSession);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  // Видаляємо сесію з бази даних
  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  // Очищаємо куки сесії
  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const refreshUserSession = async (req, res, next) => {
  // Знаходимо поточну сесію за id сесії та рефреш токеном
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  // якщо сесія не знайдена, повертаємо помилку 401
  if (!session) {
    return next(createHttpError(401, 'Session not found'));
  }

  // якщо сесія існє, перевіряємо валідність рефреш токена
  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  // якщо термін дії рефреш токена минув, повертаємо помилку 401
  if (isSessionTokenExpired) {
    return next(createHttpError(401, 'Session token expired'));
  }

  // якщо всі перевірки пройшли, видаляємо стару сесію
  await Session.deleteOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  // Створюємо нову сесію для користувача та додаємо куки у відповідь
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({ message: 'Session refreshed' });
};
