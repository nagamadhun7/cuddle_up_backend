const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./config/cuddleup-21617-firebase-adminsdk-fbsvc-8a9a6a7826.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const emotionsData = [
  { emotion: "Happy", reasons: ["Had a great day", "Enjoyed a nice meal", "Spent time with family"] },
  { emotion: "Sad", reasons: ["Feeling lonely", "Missed an opportunity", "Bad weather"] },
  { emotion: "Angry", reasons: ["Traffic jam", "Argument with friend", "Work stress"] },
  { emotion: "Excited", reasons: ["New opportunity", "Upcoming trip", "Achievement unlocked"] },
  { emotion: "Worried", reasons: ["Upcoming exam", "Health concerns", "Family issues"] },
  { emotion: "Crying", reasons: ["Heartbreak", "Overwhelmed with emotions", "Lost something important"] },
];

// Function to determine time of day
const getTimeOfDay = (hour) => {
  if (hour >= 5 && hour < 8) return "earlyMorning";
  if (hour >= 8 && hour < 12) return "lateMorning";
  if (hour >= 12 && hour < 14) return "earlyAfternoon";
  if (hour >= 14 && hour < 17) return "lateAfternoon";
  if (hour >= 17 && hour < 18.5) return "earlyEvening";
  if (hour >= 18.5 && hour < 20) return "lateEvening";
  if (hour >= 20 && hour < 24) return "night";
  return "lateNight"; // Covers 0-5 AM
};

// Function to get random date within a given range
const getRandomDate = (daysAgoStart, daysAgoEnd) => {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - daysAgoEnd);
  const end = new Date();
  end.setDate(now.getDate() - daysAgoStart);

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random mood entries
const generateMoodEntries = () => {
    let entries = [];
    const dateRanges = [
      { label: "last7days", daysAgoStart: 0, daysAgoEnd: 7 },
      { label: "last30days", daysAgoStart: 8, daysAgoEnd: 30 },
      { label: "last3months", daysAgoStart: 31, daysAgoEnd: 90 },
      { label: "lastyear", daysAgoStart: 91, daysAgoEnd: 365 },
      { label: "alltime", daysAgoStart: 366, daysAgoEnd: 1000 },
    ];
  
    dateRanges.forEach((range) => {
      for (let i = 0; i < 3; i++) {
        const mood = emotionsData[Math.floor(Math.random() * emotionsData.length)];
        console.log("Selected Mood:", mood);  // Log the selected mood for debugging
  
        // Check if the mood is correctly selected
        if (!mood || !mood.emotion) {
          console.error("Error: Mood or Emotion is undefined");
          return;
        }
  
        const createdAt = getRandomDate(range.daysAgoStart, range.daysAgoEnd);
        const hour = createdAt.getHours();
        const timeOfDay = getTimeOfDay(hour);
  
        entries.push({
          mood: mood.emotion,
          reason: mood.reasons[Math.floor(Math.random() * mood.reasons.length)],
          createdAt,
          timeOfDay, // Add timeOfDay based on the hour
        });
      }
    });
  
    return entries;
  };
  

// Function to add dummy data to Firestore
const addDummyData = async () => {
  const userId = "gYo9mexWTOhgg8rX79N2QSIaTEx1"; // Replace with an actual user ID
  const moodsCollection = db.collection("users").doc(userId).collection("moods");

  const moodEntries = generateMoodEntries();

  try {
    for (const mood of moodEntries) {
      await moodsCollection.add({
        ...mood,
        createdAt: admin.firestore.Timestamp.fromDate(mood.createdAt),
      });
    }
    console.log("✅ Dummy mood data added successfully!");
  } catch (error) {
    console.error("❌ Error adding dummy data:", error);
  }
};

// Run the function
addDummyData();
