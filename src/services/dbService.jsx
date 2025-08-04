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
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';

const calculateLevel = (xp) => Math.floor(xp / 100) + 1;

// ========== 📦 MEALS ==========
export const addMeal = async (mealData, userId) => {
  await addDoc(collection(db, 'users', userId, 'meals'), mealData);

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const newXP = (userData.xp || 0) + 10;
    const newLevel = calculateLevel(newXP);

    await updateDoc(userRef, { xp: newXP, level: newLevel });
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

// ========== ⚖️ WEIGHT TRACKING ==========
export const addWeightLog = async (userId, date, weight) => {
  const ref = doc(db, 'users', userId, 'weightLogs', date);
  await setDoc(ref, { date, weight });
};

export const getWeightLogs = async (userId) => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'weightLogs'));
  return snapshot.docs.map(doc => doc.data());
};

// ========== 👤 AUTH ==========
export const registerUser = async ({ email, password, ...profile }) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;

  const {
    firstName,
    lastName,
    mealOrder,
    unit,
    currentWeight,
    goalWeight,
    height,
    goalDate,
    breakfastTime,
    lunchTime,
    dinnerTime,
    calorieGoal: userDefinedGoal,
    age = 25,
    gender = 'male'
  } = profile;

  const daysToGoal = Math.max(1, Math.ceil((new Date(goalDate) - new Date()) / (1000 * 60 * 60 * 24)));

  const bmr =
    gender === 'male'
      ? 10 * currentWeight + 6.25 * height - 5 * age + 5
      : 10 * currentWeight + 6.25 * height - 5 * age - 161;

  const adjustment = ((goalWeight - currentWeight) * 7700) / daysToGoal;
  const calculatedGoal = Math.round(bmr + adjustment);

  const finalCalorieGoal = isNaN(userDefinedGoal) ? calculatedGoal : Number(userDefinedGoal);

  await setDoc(doc(db, 'users', user.uid), {
    firstName,
    lastName,
    mealOrder,
    unit,
    currentWeight,
    goalWeight,
    goalDate,
    height,
    breakfastTime,
    lunchTime,
    dinnerTime,
    xp: 0,
    level: 1,
    streak: 1,
    lastLogin: new Date().toISOString().split('T')[0],
    badges: [],
    calorieGoal: finalCalorieGoal,
    age,
    gender
  });

  return { ...user, ...profile, calorieGoal: finalCalorieGoal };
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
      if (!profileSnap.exists()) return resolve(user);

      const profile = profileSnap.data();
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = profile.lastLogin || today;
      const daysSinceLastLogin = getDaysBetween(lastLogin, today);
      let updatedProfile = {};

      updatedProfile.streak =
        daysSinceLastLogin === 1
          ? (profile.streak || 0) + 1
          : daysSinceLastLogin > 1
          ? 1
          : profile.streak || 1;

      updatedProfile.lastLogin = today;

      const badgeMilestones = [5, 15, 30, 60, 100];
      const earnedBadges = profile.badges || [];

      if (badgeMilestones.includes(updatedProfile.streak)) {
        const badgeName = `${updatedProfile.streak}-Day Streak`;
        if (!earnedBadges.includes(badgeName)) {
          earnedBadges.push(badgeName);
          updatedProfile.badges = earnedBadges;
        }
      }

      try {
        const weightLogsSnap = await getDocs(collection(db, 'users', user.uid, 'weightLogs'));
        const weightLogs = weightLogsSnap.docs.map(doc => doc.data());

        if (
          weightLogs.length > 0 &&
          profile.goalWeight &&
          profile.goalDate &&
          !earnedBadges.includes('🎯 Goal Achieved')
        ) {
          const latest = weightLogs.reduce((a, b) => (a.date > b.date ? a : b));
          const achieved =
            (profile.goalWeight >= profile.currentWeight && latest.weight >= profile.goalWeight) ||
            (profile.goalWeight < profile.currentWeight && latest.weight <= profile.goalWeight);
          const beforeDeadline = new Date(latest.date) <= new Date(profile.goalDate);

          if (achieved && beforeDeadline) {
            earnedBadges.push('🎯 Goal Achieved');
            const newXP = (profile.xp || 0) + 50;
            const newLevel = calculateLevel(newXP);

            updatedProfile.badges = earnedBadges;
            updatedProfile.xp = newXP;
            updatedProfile.level = newLevel;
          }
        }
      } catch (err) {
        console.error("Error checking goal badge:", err);
      }

      if (
        updatedProfile.streak !== profile.streak ||
        updatedProfile.lastLogin !== lastLogin ||
        updatedProfile.badges ||
        updatedProfile.xp
      ) {
        await updateDoc(profileRef, updatedProfile);
        Object.assign(profile, updatedProfile);
      }

      resolve({ ...user, ...profile });
    });
  });
};

const getDaysBetween = (prevDate, currDate) => {
  const prev = new Date(prevDate);
  const curr = new Date(currDate);
  return Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
};
