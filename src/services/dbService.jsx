import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';

const calculateLevel = (xp) => {
  return Math.floor(xp / 100) + 1; // 100 XP per level
};

// ========== 📦 MEALS (Nested under user) ==========
export const addMeal = async (mealData, userId) => {
  // 1. Add meal to Firestore
  await addDoc(collection(db, 'users', userId, 'meals'), mealData);

  // 2. Update user's XP and level
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const currentXP = userData.xp || 0;
    const newXP = currentXP + 10; // 🥗 10 XP per meal
    const newLevel = calculateLevel(newXP);

    await updateDoc(userRef, {
      xp: newXP,
      level: newLevel
    });
  }
};


export const getAllMeals = async (userId) => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'meals'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateMeal = async (mealData, userId) => {
  const ref = doc(db, 'users', userId, 'meals', mealData.id);
  const { id, ...rest } = mealData;
  await updateDoc(ref, rest);
};

export const deleteMeal = async (mealId, userId) => {
  const ref = doc(db, 'users', userId, 'meals', mealId);
  await deleteDoc(ref);
};

export const deleteAllMeals = async (userId) => {
  const mealsRef = collection(db, 'users', userId, 'meals');
  const snapshot = await getDocs(mealsRef);
  const deletions = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletions);
};

export const updateUserProfile = async (userId, updatedProfile) => {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, updatedProfile);
};


// ========== 👤 AUTH ==========
export const registerUser = async ({ email, password, ...profile }) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    xp: 0,
    level: 1,
    streak: 1,
    lastLogin: new Date().toISOString().split('T')[0],
    badges: []
  });
  return { ...user, ...profile };
};

export const loginUser = async ({ email, password }) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;

  const profileRef = doc(db, 'users', user.uid);
  const profileSnap = await getDoc(profileRef);
  const profile = profileSnap.exists() ? profileSnap.data() : {};

  return { ...user, ...profile };
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (!user) return resolve(null);

      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        return resolve(user);
      }

      const profile = profileSnap.data();

      // Check and update login streak
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = profile.lastLogin || today;

      const daysSinceLastLogin = getDaysBetween(lastLogin, today);
      let updatedProfile = {};

      if (daysSinceLastLogin === 1) {
        // ✅ Continued streak
        updatedProfile.streak = (profile.streak || 0) + 1;
      } else if (daysSinceLastLogin > 1) {
        // ❌ Streak broken
        updatedProfile.streak = 1;
      } else {
        // 0 days passed — already logged in today
        updatedProfile.streak = profile.streak || 1;
      }

      updatedProfile.lastLogin = today;

      // Apply updates if needed
      if (
        updatedProfile.streak !== profile.streak ||
        updatedProfile.lastLogin !== lastLogin ||
        updatedProfile.badges
      ) {
        await updateDoc(profileRef, updatedProfile);
        Object.assign(profile, updatedProfile);
      }

      const badgeMilestones = [5, 15, 30, 60, 100];
      const earnedBadges = profile.badges || [];

      if (badgeMilestones.includes(updatedProfile.streak)) {
        const badgeName = `${updatedProfile.streak}-Day Streak`;
        if (!earnedBadges.includes(badgeName)) {
          earnedBadges.push(badgeName);
          updatedProfile.badges = earnedBadges;
        }
      }

      resolve({ ...user, ...profile });
    });
  });
};


// Helper to compute days between two YYYY-MM-DD strings
const getDaysBetween = (prevDate, currDate) => {
  const prev = new Date(prevDate);
  const curr = new Date(currDate);
  const diff = curr.getTime() - prev.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
