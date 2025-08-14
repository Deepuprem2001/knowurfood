import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";


export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

// Add a meal
export const saveMeal = async (mealData, userId) => {
  return await addDoc(collection(db, "meals"), {
    ...mealData,
    userId,
    timestamp: new Date()
  });
};

// Get meals for user
export const getMeals = async (userId) => {
  const q = query(collection(db, "meals"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update a meal
export const updateMeal = async (mealId, updatedData) => {
  await updateDoc(doc(db, "meals", mealId), updatedData);
};

// Delete a meal
export const deleteMeal = async (mealId) => {
  await deleteDoc(doc(db, "meals", mealId));
};
