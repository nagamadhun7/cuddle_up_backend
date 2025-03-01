const { db } = require("../config/firebase");

const registerUser = async (req, res) => {
  try {
    const { name, age, gender, city, country } = req.body;
    const uid = req.user?.uid; // Extract uid from verified token (DO NOT trust req.body)

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized: No valid user ID." });
    }

    if (!name || !age || !gender || !city || !country) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const currentDate = new Date();

    const monthName = currentDate.toLocaleString("default", { month: "long" });

    const formattedDate = `${monthName} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

    await db.collection("users").doc(uid).set(
      {
        name,
        age,
        gender,
        city,
        country,
        createdAt: formattedDate,
      },
      { merge: true } // Prevents overwriting existing data
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



// const getUser = async (req, res) => {
//   const userId = req.user.uid;

//   try {
//     const userDoc = await db.collection("users").doc(userId).get();
//     if (!userDoc.exists) return res.status(404).json({ error: "User not found." });

//     res.json(userDoc.data());
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching user data." });
//   }
// };
const getUser = async (req, res) => {
  const userId = req.user.uid;

  try {
    // Fetch user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found." });
    const userData = userDoc.data();

    // Fetch moods ordered by date (descending)
    const moodsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("moods")
      .orderBy("createdAt", "desc")
      .get();
    
    const moods = moodsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate() // Convert Firestore timestamp to JS Date
    }));

    if (moods.length === 0) {
      return res.json({
        totalMoods: 0,
        mostFrequentMood: null,
        mostFrequentMoodPercentage: 0,
        currentStreak: 0,
        longestStreak: 0,
        moodSwings: 0,
        moodStabilityScore: 0,
        happiestDay: null,
        saddestDay: null,
        moodChangeRate: 0,
        mostActiveTime: null
      });
    }

    let moodCounts = {};
    let moodSwings = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate = null;
    let streakCounter = 0;
    let daysTracked = new Set();
    let moodByDay = {};
    let moodByHour = new Array(24).fill(0);

    for (let i = 0; i < moods.length; i++) {
      const { mood, createdAt } = moods[i];

      // Count mood occurrences
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;

      // Mood swings count
      if (i > 0 && moods[i - 1].mood !== mood) {
        moodSwings++;
      }

      // Streak calculation
      const currentDate = createdAt.toISOString().split("T")[0]; // Get YYYY-MM-DD format
      daysTracked.add(currentDate);

      if (lastDate) {
        const diffDays = (lastDate - createdAt) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          streakCounter++;
          longestStreak = Math.max(longestStreak, streakCounter);
        } else if (diffDays > 1) {
          streakCounter = 1;
        }
      } else {
        streakCounter = 1;
      }
      lastDate = createdAt;

      // Store mood by day of the week
      const dayOfWeek = createdAt.toLocaleString("en-US", { weekday: "long" });
      moodByDay[dayOfWeek] = (moodByDay[dayOfWeek] || 0) + 1;

      // Store mood by hour of the day
      const hour = createdAt.getHours();
      moodByHour[hour]++;
    }

    currentStreak = streakCounter;

    // Find most frequent mood
    let mostFrequentMood = null;
    let mostFrequentMoodCount = 0;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > mostFrequentMoodCount) {
        mostFrequentMood = mood;
        mostFrequentMoodCount = count;
      }
    }
    const mostFrequentMoodPercentage = ((mostFrequentMoodCount / moods.length) * 100).toFixed(1);

    // Find happiest & saddest day
    let happiestDay = null;
    let saddestDay = null;
    let maxMoodCount = 0;
    let minMoodCount = Infinity;

    for (const [day, count] of Object.entries(moodByDay)) {
      if (count > maxMoodCount) {
        happiestDay = day;
        maxMoodCount = count;
      }
      if (count < minMoodCount) {
        saddestDay = day;
        minMoodCount = count;
      }
    }

    // Mood stability score
    const moodStabilityScore = Math.max(0, 100 - ((moodSwings / moods.length) * 100)).toFixed(1);

    // Mood change rate
    const moodChangeRate = (moodSwings / (daysTracked.size || 1)).toFixed(1);

    // Most active logging hour
    let mostActiveHour = moodByHour.indexOf(Math.max(...moodByHour));
    mostActiveHour = mostActiveHour === -1 ? null : `${mostActiveHour}:00 - ${mostActiveHour + 1}:00`;

    res.json({
      user:userData,
      totalMoods: moods.length,
      mostFrequentMood,
      mostFrequentMoodPercentage,
      currentStreak,
      longestStreak,
      moodSwings,
      moodStabilityScore,
      happiestDay,
      saddestDay,
      moodChangeRate,
      mostActiveTime: mostActiveHour
    });
  } catch (error) {
    console.error("Error fetching user insights:", error);
    res.status(500).json({ error: "Error fetching user insights." });
  }
};



const updateUser = async (req, res) => {
  const userId = req.user.uid;
  const { name, age, gender, city, country } = req.body;

  try {
    await db.collection("users").doc(userId).update({ name, age, gender, city, country });
    res.json({ message: "User updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Error updating user data." });
  }
};


const storeMood = async (req, res) => {
  const { mood, reason } = req.body;
  const userId = req.user.uid;

  // Validate input
  if (!mood || !reason) {
    return res.status(400).json({ error: "Mood and reason are required." });
  }

  try {
    const currentDate = new Date();
    const hour = new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" });

    // const hour = currentDate.getHours();
    let timeOfDay = '';

    // Determine time of day based on more granular time slots
    if (hour >= 5 && hour < 8) {
      timeOfDay = 'earlyMorning';
    } else if (hour >= 8 && hour < 12) {
      timeOfDay = 'lateMorning';
    } else if (hour >= 12 && hour < 14) {
      timeOfDay = 'earlyAfternoon';
    } else if (hour >= 14 && hour < 17) {
      timeOfDay = 'lateAfternoon';
    } else if (hour >= 17 && hour < 18.5) {
      timeOfDay = 'earlyEvening';
    } else if (hour >= 18.5 && hour < 20) {
      timeOfDay = 'lateEvening';
    } else if (hour >= 20 && hour < 24) {
      timeOfDay = 'night';
    } else if (hour >= 0 && hour < 5) {
      timeOfDay = 'lateNight';
    }

    // Store mood, reason, and time of day in Firestore
    await db.collection("users").doc(userId).collection("moods").add({
      mood,
      reason,
      timeOfDay,
      createdAt: currentDate,
    });

    res.status(201).json({ message: "Mood saved successfully" });
  } catch (error) {
    console.error("Error storing mood:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { registerUser, getUser, updateUser, storeMood };

