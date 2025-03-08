const { db } = require("../config/firebase");

const getReasons = async (req, res) => {
  const userId = req.user.uid;

  try {
    const predefinedReasonsSnapshot = await db.collection("reasons").get();
    const predefinedReasons = predefinedReasonsSnapshot.docs.map((doc) =>
      doc.data()
    );

    // Fetch custom reasons stored by the user
    const customReasonsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("customReasons")
      .get();

    const customReasons = customReasonsSnapshot.docs.map((doc) => doc.data());

    // Combine both predefined and custom reasons
    const allReasons = [...predefinedReasons, ...customReasons];

    res.json(allReasons);
  } catch (error) {
    console.error("Error fetching reasons:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// const addCustomReason = async (req, res) => {
//   const { reason, emotion } = req.body;
//   const userId = req.user.uid;

//   // Validate input
//   if (!reason || !emotion) {
//     return res.status(400).json({ error: "Reason and emotion are required." });
//   }

//   try {
//     // Add the custom reason to the user's collection of reasons
//     // await db.collection("users").doc(userId).collection("customReasons").add({
//     //   reason,
//     //   emotion,
//     //   createdAt: new Date(),
//     // });
//     // res.status(201).json({ message: "Custom reason added successfully" });
//     const customReasonRef = await db.collection("users").doc(userId).collection("customReasons").add({
//       reason,
//       emotion,
//       createdAt: new Date(),
//     });

//     // Fetch the added custom reason with its ID
//     const customReason = { id: customReasonRef.id, reason, emotion, createdAt: new Date() };

//     res.status(201).json(customReason);
//   } catch (error) {
//     console.error("Error adding custom reason:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };




const addCustomReason = async (req, res) => {
  const { reason, emotion } = req.body;
  const userId = req.user.uid;

  // Validate input
  if (!reason || !emotion) {
    return res.status(400).json({ error: "Reason and emotion are required." });
  }

  try {
    // Get the user's reasons for the specified emotion
    const reasonsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("customReasons")
      .where("emotion", "==", emotion)
      .get();
    
    // Limit to 3 reasons for all users (no need to check premium status)
    if (reasonsSnapshot.size >= 3) {
      return res.status(401).json({ error: "You can only add up to 3 reasons for this emotion." });
    }

    // Add the custom reason to the user's collection
    const customReasonRef = await db.collection("users").doc(userId).collection("customReasons").add({
      reason,
      emotion,
      createdAt: new Date(),
    });

    // Return the newly added custom reason with its ID
    const customReason = { id: customReasonRef.id, reason, emotion, createdAt: new Date() };

    res.status(201).json(customReason);  // Return the custom reason data to the front end
  } catch (error) {
    console.error("Error adding custom reason:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { getReasons, addCustomReason };
