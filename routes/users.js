const express = require("express");
const { registerUser,declineFriendRequest, deleteUser, getUser,cancelFriendRequest, updateUser,getFriendsData,acceptFriendRequest, storeMood,sendFriendRequest, changeProfilePic,updateStatus,searchUsers, upload, getUnreadCounts, getUserProfile } = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", verifyToken, registerUser);
router.post("/delete", verifyToken, deleteUser);
router.get("/me", verifyToken, getUser);
router.put("/update", verifyToken, updateUser);
router.post("/store-mood", verifyToken, storeMood);
router.post('/upload-profile-pic', verifyToken, upload.single('profilePic'), changeProfilePic)
router.get('/searchUsers',verifyToken, searchUsers)
router.post('/updateUserStatus',verifyToken, updateStatus)
router.get('/getFriendsData',verifyToken, getFriendsData)
router.get('/unread', verifyToken, getUnreadCounts);
router.post('/sendFriendRequest',verifyToken, sendFriendRequest)
router.post('/acceptFriendRequest',verifyToken, acceptFriendRequest)
router.post('/cancelFriendRequest',verifyToken, cancelFriendRequest)
router.post('/declineFriendRequest',verifyToken, declineFriendRequest)
router.get('/getUserProfile/:userId',verifyToken,getUserProfile)

module.exports = router;
