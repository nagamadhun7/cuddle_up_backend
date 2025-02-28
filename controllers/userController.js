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



const getUser = async (req, res) => {
  const userId = req.user.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found." });

    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: "Error fetching user data." });
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
    const hour = currentDate.getHours();
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

