import { openDB } from 'idb';

const DB_NAME = 'knowurfood-db';
const DB_VERSION = 2;
export const USER_STORE = 'users';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('meals')) {
      db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true });
    }

    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: 'username'});
    }

    if (!db.objectStoreNames.contains('session')) {
      db.createObjectStore('session');
    }
  },
});

// =========================
// 📦 MEALS
// =========================

export const addMeal = async (mealData) => {
  const db = await dbPromise;
  await db.add('meals', mealData);
};

export const getAllMeals = async () => {
  const db = await dbPromise;
  const user = await getCurrentUser();
  if (!user) return [];
  const all = await db.getAll('meals');
  return all.filter((m) => m.userId === user.id);
};

export const clearMeals = async () => {
  const db = await dbPromise;
  await db.clear('meals');
};

export const deleteMeal = async (id) => {
  const db = await dbPromise;
  await db.delete('meals', id);
};

export const updateMeal = async (mealData) => {
  const db = await dbPromise;
  await db.put('meals', mealData);
};

// =========================
// 👤 USERS
// =========================

export const registerUser = async ({ username, password }) => {
  const db = await dbPromise;

  const existingUsers = await db.getAll(USER_STORE);
  const userExists = existingUsers.some((u) => u.username === username);

  if (userExists) {
    throw new Error("Username already exists!");
  }

  const passwordHash = btoa(password); // ✅ Encode password
  const user = { username, passwordHash };

  await db.add(USER_STORE, user);
  return user;
};



export const loginUser = async ({ username, password }) => {
  const db = await dbPromise;
  const users = await db.getAll(USER_STORE);

  const user = users.find(
    (u) => u.username === username && u.passwordHash === btoa(password)
  );

  if (!user) throw new Error('Invalid credentials');
  return user;
};

// =========================
// 🔐 SESSION
// =========================

export const setCurrentUser = async (user) => {
  const db = await dbPromise;
  await db.put('session', user, 'currentUser');
};

export const getCurrentUser = async () => {
  const db = await dbPromise;
  return await db.get('session', 'currentUser');
};

export const logoutUser = async () => {
  const db = await dbPromise;
  await db.delete('session', 'currentUser');
};
