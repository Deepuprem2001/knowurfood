KnowUrFood – Smart Nutrition & Meal Tracking App
KnowUrFood is a Progressive Web App (PWA) and Android-ready application designed to help users log meals, track calories, monitor nutrition, manage weight goals, and build healthy habits through gamification.

----------Features-------------

----Authentication & User Management----

Secure Firebase Authentication (Signup/Login/Logout).

“Remember Me” option for persistent login.

----Meal Logging----

Auto-Fill Mode – type a food name, fetch nutrition data from OpenFoodFacts.

Barcode Scan Mode – scan product barcodes for instant nutrition details.

Manual Mode – enter custom food items with nutrients.

Dynamic Serving Sizes – adjust serving & quantity; kcal auto-calculated.

----Meal Cards----

Daily meals displayed as cards.

Swipe left ➝ delete meal.

Swipe right ➝ edit meal.

----Analytics & Visualisations----

Calories Donut Chart – daily calorie breakdown.

Weekly Bar Chart – compare calorie intake over the week.

Nutrition Donut Chart – macronutrient balance.

----History & Insights----

Browse meals by date in the History tab.

Get AI-like suggestions:

“You’re low on protein today, try adding eggs or beans.”

“You’ve already hit 80% of your calorie target, keep dinner light.”

----Weight Tracking----

Log daily weight.

Interactive line chart for progress.

BMI calculation & categorisation (Underweight, Normal, Overweight, Obese).

Set goal weight + date, app adjusts daily calorie target.

----Gamification & Rewards----

Earn XP (+10 per log).

Levels (progress bar).

Streak Tracker fire icon that grows with consecutive days.

Unlock badges for milestones (5, 15, 30, etc.).

----Profile & Preferences----

Update personal info (age, gender, height, weight, goals).

Customise meal order & measurement units.

Set meal reminders (Breakfast, Lunch, Dinner).

Export meals as CSV or JSON.

Clear all meals (with confirmation).

Update email & password securely.

Help Section – in-app guide for all features.

----Notifications----

Custom meal-time reminders.

PWA push notification support.

----Tech Stack----

Frontend: React + Vite + Bootstrap

Backend: Firebase (Auth, Firestore)

Data: OpenFoodFacts API, Barcode scanning (@zxing/library), OCR fallback (tesseract.js)

Storage: Firestore (user-specific meals, weight logs, preferences, streaks, XP, badges)

PWA: Service Workers, Manifest, Offline Support

Deployment: GitHub Pages / Vercel / Firebase Hosting