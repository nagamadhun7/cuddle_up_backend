const { db } = require("../config/firebase");

const getUserMoods = async (req, res) => {
    const userId = req.user.uid; // Get the authenticated user's ID
  
    try {
      const moodsSnapshot = await db.collection("users").doc(userId).collection("moods").orderBy("createdAt", "desc").get();
  
      if (moodsSnapshot.empty) {
        return res.status(200).json([]); // Return an empty array if no moods exist
      }
  
      const moods = moodsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      res.status(200).json(moods);
    } catch (error) {
      console.error("Error fetching moods:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
module.exports = { getUserMoods };
