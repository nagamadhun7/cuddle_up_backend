const { db, admin } = require("../config/firebase");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const cloudinary = require("../cloudinary");

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

    const { photoURL } = req.body;
    const image = photoURL ? photoURL : "";

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
        photoURL: image,
        friends: [],
        pendingRequests: [],
        receivedRequests: [],
        status: "active",
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
    // Fetch user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found." });
    const userData = userDoc.data();
   

    // Fetch moods ordered by date (descending)
    const moodsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("moods")
      .orderBy("createdAt", "desc")
      .get();

    const moods = moodsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(), // Convert Firestore timestamp to JS Date
    }));

    if (moods.length === 0) {
      return res.json({
        user: userData,
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
        mostActiveTime: null,
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

      // Streak calculation - fixed to properly compare dates
      const currentDate = createdAt.toISOString().split("T")[0]; // Get YYYY-MM-DD format
      daysTracked.add(currentDate);

      if (lastDate) {
        // Get the current date and last date as Date objects at midnight UTC
        const currDateObj = new Date(currentDate + "T00:00:00Z");
        const lastDateObj = new Date(lastDate + "T00:00:00Z");

        // Calculate difference in days correctly
        const diffDays = (lastDateObj - currDateObj) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          streakCounter++;
          longestStreak = Math.max(longestStreak, streakCounter);
        } else if (diffDays > 1) {
          streakCounter = 1;
        }
      } else {
        streakCounter = 1;
      }
      lastDate = currentDate; // Store the date string, not the Date object

      // Store mood by day of the week - using UTC day of week for consistency
      const dayOfWeek = createdAt.toLocaleString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });
      moodByDay[dayOfWeek] = (moodByDay[dayOfWeek] || 0) + 1;

      // Store mood by hour of the day - using UTC hours for consistency
      const hour = createdAt.getUTCHours();
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
    const mostFrequentMoodPercentage = (
      (mostFrequentMoodCount / moods.length) *
      100
    ).toFixed(1);

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
    const moodStabilityScore = Math.max(
      0,
      100 - (moodSwings / moods.length) * 100
    ).toFixed(1);

    // Mood change rate
    const moodChangeRate = (moodSwings / (daysTracked.size || 1)).toFixed(1);

    // Most active logging hour
    let mostActiveHour = moodByHour.indexOf(Math.max(...moodByHour));
    mostActiveHour =
      mostActiveHour === -1 ? null : formatHourRange(mostActiveHour);

    function formatHourRange(hour) {
      // Format consistently with UTC timezone
      const startHour = hour;
      const endHour = (hour + 1) % 24; // Use modulo to handle hour 23 wrapping to 0

      // Calculate AM/PM periods
      const startPeriod = startHour >= 12 ? "PM" : "AM";
      const endPeriod = endHour >= 12 ? "PM" : "AM";

      // Adjust hours to 12-hour format
      const startFormatted = formatHourWithAMPM(startHour, startPeriod);
      const endFormatted = formatHourWithAMPM(endHour, endPeriod);

      return `${startFormatted} - ${endFormatted} (UTC)`;
    }

    function formatHourWithAMPM(hour, period) {
      // Adjust hour for 12-hour format (0 becomes 12 for midnight, 13 becomes 1 for 1 PM, etc.)
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12; // Handle midnight (0) and noon (12)

      return `${displayHour}:00 ${period}`;
    }

    const responsePayload = {
      user: userData,
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
      mostActiveTime: mostActiveHour,
    };
    // console.log("Final Response:", JSON.stringify(responsePayload, null, 2));
    res.json(responsePayload);
  } catch (error) {
    console.error("Error fetching user insights:", error);
    res.status(500).json({ error: "Error fetching user insights." });
  }
};

const updateUser = async (req, res) => {
  const userId = req.user.uid;
  const { name, age, gender, city, country } = req.body;

  try {
    await db
      .collection("users")
      .doc(userId)
      .update({ name, age, gender, city, country });
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
    const hour = new Date().toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/New_York",
    });

    // const hour = currentDate.getHours();
    let timeOfDay = "";

    // Determine time of day based on more granular time slots
    if (hour >= 5 && hour < 8) {
      timeOfDay = "earlyMorning";
    } else if (hour >= 8 && hour < 12) {
      timeOfDay = "lateMorning";
    } else if (hour >= 12 && hour < 14) {
      timeOfDay = "earlyAfternoon";
    } else if (hour >= 14 && hour < 17) {
      timeOfDay = "lateAfternoon";
    } else if (hour >= 17 && hour < 18.5) {
      timeOfDay = "earlyEvening";
    } else if (hour >= 18.5 && hour < 20) {
      timeOfDay = "lateEvening";
    } else if (hour >= 20 && hour < 24) {
      timeOfDay = "night";
    } else if (hour >= 0 && hour < 5) {
      timeOfDay = "lateNight";
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


const getLatestMood = async(req,res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.friends) return res.json({ friends: [] });

    const friendMoods = await Promise.all(
      userData.friends.map(async (friendId) => {
        const friendDoc = await db.collection("users").doc(friendId).get();
        const friendData = friendDoc.data();
        return {
          id: friendId,
          name: friendData?.name || "Unknown",
          latestMood: friendData?.latestMood || "Unknown",
        };
      })
    );

    res.json({ friends: friendMoods });
  } catch (error) {
    console.error("Error fetching moods:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const deleteUser = async (req, res) => {
  const uid = req.user.uid;

  try {
    // 🔹 Delete user moods if they exist (assuming the moods collection is a sub-collection of the user document)
    const moodsRef = db.collection("users").doc(uid).collection("moods");
    const moodsSnapshot = await moodsRef.get();

    // Loop through the moods and delete each document
    moodsSnapshot.forEach(async (moodDoc) => {
      await moodDoc.ref.delete();
      // console.log(`Mood document ${moodDoc.id} deleted.`);
    });

    // 🔹 Now delete the user document
    const userDoc = db.collection("users").doc(uid);
    const userSnapshot = await userDoc.get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: "User not found in Firestore." });
    }

    await userDoc.delete();
    // console.log(`User ${uid} deleted from Firestore.`);

    res
      .status(200)
      .json({ message: "User and related data deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const changeProfilePic = async (req, res) => {
  const uid = req.user?.uid;
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const result = await cloudinary.uploader.upload_stream(
      { folder: "profile_pics" }, // Save in the 'profile_pics' folder
      async (error, image) => {
        if (error) {
          return res
            .status(500)
            .json({ error: "Error uploading to Cloudinary" });
        }

        // Get the URL of the uploaded image
        const imageUrl = image.secure_url;

        // You can save this URL in Firestore, database, or send it to the frontend
        // Example: Saving URL to Firestore (replace this with your own logic)

        const userRef = db.collection("users").doc(uid); // Assuming user is authenticated
        await userRef.update({ photoURL: imageUrl });

        // Return the URL to frontend (or store it wherever you need)
        return res.json({ imageUrl });
      }
    );

    // Pipe the file stream into Cloudinary's upload stream
    result.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong with the upload." });
  }
};

const searchUsers = async (req, res) => {
  const { searchName } = req.query; // Expecting `name` as query parameter

  if (!searchName) {
    return res.status(400).send("Name parameter is required.");
  }

  const currentUserId = req.user.uid

  try {
    // Query Firestore for users with the specified name
    const usersRef = db.collection("users"); // Assuming 'users' is your collection
    // const snapshot = await usersRef.where('name', '==', searchName).get();
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      return res.status(404).send("No users found.");
    }

    const users = snapshot.docs
    .map((doc) => ({
      id: doc.id, // Firestore document ID
      ...doc.data(),
    }))
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchName.toLowerCase()) &&
        user.id !== currentUserId
    );

    if (users.length === 0) {
      return res.status(404).send("No users found with that name.");
    }

    const resultUsers = users.map((user) => ({
      uid: user.id, // Assuming you want to include the document id
      name: user.name,
      photoURL: user.photoURL, // Assuming you have a 'photoURL' field for profile picture
      age: user.age,
      city: user.city,
      country: user.country,
      gender: user.gender,
    }));
  

    // Send the found users back to the frontend
    res.json(resultUsers);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updateStatus = async (req, res) => {
  const { userId, status } = req.body; // Expecting userId and status ('active' or 'inactive')

  if (!userId || !status) {
    return res.status(400).json({ error: "User ID and status are required" });
  }

  try {
    await db.collection("users").doc(userId).update({ status });

    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFriendsData = async (req, res) => {
  const uid = req.user.uid;

  try {
    // Step 1: Fetch the current user's friend UIDs from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    // Step 2: Get the friend UIDs
    const friendUIDs = userData.friends;

    // Step 3: Fetch friend data for each UID
    const friendPromises = friendUIDs.map((uid) =>
      db.collection("users").doc(uid).get()
    );

    const friendDocs = await Promise.all(friendPromises);


    // Step 4: Map over the friend docs and extract the necessary data
    const friendsData = friendDocs.map((doc) => {
      const friendData = doc.data();
      return {
        uid: doc.id,
        name: friendData.name,
        city: friendData.city,
        country: friendData.country,
        age: friendData.age,
        photoURL: friendData.photoURL,
        status: friendData.status, // Assuming `status` is updated somewhere in the backend
      };
    });

    res.json({
      friends: friendsData,
      pendingRequests: userData.pendingRequests,
      receivedRequests: userData.receivedRequests,
    });
  } catch (error) {
    console.error("Error fetching friends data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user?.uid;

    const messagesSnapshot = await db
      .collection("messages")
      .where("receiverId", "==", userId)
      .where("read", "==", false)
      .get();

    // Count unread messages by sender
    const unreadCounts = {};
    messagesSnapshot.forEach((doc) => {
      const data = doc.data();
      const senderId = data.senderId;
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
    });

    res.json(unreadCounts);
  } catch (error) {
    console.error("Error fetching friends data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    // Authenticate user
    const senderId = req.user?.uid;

    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Check if users exist
    const senderDoc = await db.collection("users").doc(senderId).get();
    const receiverDoc = await db.collection("users").doc(receiverId).get();

    if (!senderDoc.exists || !receiverDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();
    const senderName = senderData.name;
    const receiverName = receiverData.name;

    

    if (
      senderData.pendingRequests?.includes(receiverId) ||
      receiverData.receivedRequests?.includes(senderId)
    ) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Update sender's pendingRequests and receiver's receivedRequests
    await db
      .collection("users")
      .doc(senderId)
      .update({
        pendingRequests: admin.firestore.FieldValue.arrayUnion({
          uid: receiverId,
          name: receiverName,
          status: "pending" // or "sent" based on your logic
        }),
      });

    await db
      .collection("users")
      .doc(receiverId)
      .update({
        receivedRequests: admin.firestore.FieldValue.arrayUnion({
          uid: senderId,
          name: senderName,
          status: "pending" // or "sent" based on your logic
        }),
      });

    return res
      .status(200)
      .json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



const acceptFriendRequest = async (req, res) => {
  try {
    // Authenticate user
    const receiverId = req.user?.uid;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ error: "Sender ID is required" });
    }

    // Check if users exist
    const senderDoc = await db.collection("users").doc(senderId).get();
    const receiverDoc = await db.collection("users").doc(receiverId).get();

    if (!senderDoc.exists || !receiverDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();

    // Check if there's an existing pending friend request
    if (
      !receiverData.receivedRequests.some(
        (req) => req.uid === senderId && req.status === "pending"
      )
    ) {
      return res.status(400).json({ error: "No pending friend request" });
    }

    // Remove the request from both users' arrays
    await db.collection("users").doc(senderId).update({
      pendingRequests: admin.firestore.FieldValue.arrayRemove({
        uid: receiverId,
        name: receiverData.name,
        status: "pending",
      }),
    });

    await db.collection("users").doc(receiverId).update({
      receivedRequests: admin.firestore.FieldValue.arrayRemove({
        uid: senderId,
        name: senderData.name,
        status: "pending",
      }),
    });

    // Add each other to their friends arrays
    await db.collection("users").doc(senderId).update({
      friends: admin.firestore.FieldValue.arrayUnion(
        receiverId,
      ),
    });

    await db.collection("users").doc(receiverId).update({
      friends: admin.firestore.FieldValue.arrayUnion(
        senderId,
      ),
    });

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return res.status(500).json({ error: "Server error" });
  }
};


const cancelFriendRequest = async (req, res) => {
  try {
    // Authenticate user
    const senderId = req.user?.uid;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Check if users exist
    const senderDoc = await db.collection("users").doc(senderId).get();
    const receiverDoc = await db.collection("users").doc(receiverId).get();

    if (!senderDoc.exists || !receiverDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();

    // Check if there is an existing pending request from the sender to the receiver
    if (
      !senderData.pendingRequests.some(
        (req) => req.uid === receiverId && req.status === "pending"
      )
    ) {
      return res.status(400).json({ error: "No pending friend request to cancel" });
    }

    // Remove the request from both users' arrays
    await db.collection("users").doc(senderId).update({
      pendingRequests: admin.firestore.FieldValue.arrayRemove({
        uid: receiverId,
        name: receiverData.name,
        status: "pending",
      }),
    });

    await db.collection("users").doc(receiverId).update({
      receivedRequests: admin.firestore.FieldValue.arrayRemove({
        uid: senderId,
        name: senderData.name,
        status: "pending",
      }),
    });

    return res.status(200).json({ message: "Friend request canceled successfully" });
  } catch (error) {
    console.error("Error canceling friend request:", error);
    return res.status(500).json({ error: "Server error" });
  }
};


const removeFriend = async (req, res) => {
  try {
    // Authenticate user
    const receiverId = req.user?.uid;
    const {friendId}  = req.body;
  

    if (!friendId) {
      return res.status(400).json({ error: "Friend ID is required" });
    }

    // Check if users exist
    const receiverDoc = await db.collection("users").doc(receiverId).get();
    const friendDoc = await db.collection("users").doc(friendId).get();

    if (!receiverDoc.exists || !friendDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const receiverData = receiverDoc.data();
    const friendData = friendDoc.data();

    // Check if they are actually friends
    if (
      !receiverData.friends.includes(friendId) || 
      !friendData.friends.includes(receiverId)
    ) {
      return res.status(400).json({ error: "Not friends" });
    }

    // Remove each other from their friends arrays
    await db.collection("users").doc(receiverId).update({
      friends: admin.firestore.FieldValue.arrayRemove(friendId),
    });

    await db.collection("users").doc(friendId).update({
      friends: admin.firestore.FieldValue.arrayRemove(receiverId),
    });

    return res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error removing friend:", error);
    return res.status(500).json({ error: "Server error" });
  }
};




const declineFriendRequest = async (req, res) => {
  try {
    // Authenticate user
    const receiverId = req.user?.uid;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ error: "Sender ID is required" });
    }

    // Check if users exist
    const receiverDoc = await db.collection("users").doc(receiverId).get();
    const senderDoc = await db.collection("users").doc(senderId).get();

    if (!receiverDoc.exists || !senderDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const receiverData = receiverDoc.data();
    const senderData = senderDoc.data();

    // Check if there is an existing received friend request for the receiver
    const existingRequest = receiverData.receivedRequests?.find(
      (req) => req.uid === senderId && req.status === "pending"
    );

    if (!existingRequest) {
      return res.status(400).json({ error: "No pending friend request to decline" });
    }

    // Remove the request from both users' arrays
    await db.collection("users").doc(receiverId).update({
      receivedRequests: admin.firestore.FieldValue.arrayRemove({
        uid: senderId,
        name: senderData.name,
        status: "pending",
      }),
    });

    await db.collection("users").doc(senderId).update({
      pendingRequests: admin.firestore.FieldValue.arrayRemove({
        uid: receiverId,
        name: receiverData.name,
        status: "pending",
      }),
    });

    return res.status(200).json({ message: "Friend request declined successfully" });
  } catch (error) {
    console.error("Error declining friend request:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(userId)
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      uid: userDoc.id,
      name: userData.name,
      status: userData.status
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};




module.exports = {
  registerUser,
  deleteUser,
  getUser,
  updateUser,
  getFriendsData,
  storeMood,
  upload,
  changeProfilePic,
  updateStatus,
  searchUsers,
  getUnreadCounts,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getUserProfile,
  getLatestMood,
  removeFriend
};

