const STORAGE_KEY = 'myrank-user';

export const buildUserFromCredentials = ({ email, username, name, bio }) => ({
  email: email || '',
  username: username || name || (email ? email.split('@')[0] : 'usuario'),
  name: name || username || (email ? email.split('@')[0] : 'Usuário'),
  bio: bio || 'Apaixonado por jogos, filmes e livros.',
});

export const saveUser = (userData) => {
  const user = buildUserFromCredentials(userData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
};

export const getStoredUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const clearStoredUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};
