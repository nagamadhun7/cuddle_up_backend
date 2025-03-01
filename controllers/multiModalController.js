const axios = require("axios");
const multer = require("multer");
const { Blob } = require("buffer");
const FormData = require("form-data"); // Use the form-data package instead of global FormData
const upload = multer({ storage: multer.memoryStorage() });

const IMENTIV_API_URL = "https://api.imentiv.ai/v1/";
const IMENTIV_API_KEY = "LUqQDGJYJ-WbhMBhp0sGmvnt8qpkRajh_u5N52bQhHLeB7CqaLG-1x7seRGV1c7RplE";

const analyzeTextMood = async (req, res) => {
    try {
      const { text } = req.body;

      console.log("Received text:", text);
 
      
      if (!text) return res.status(400).json({ error: "Text input is required" });
      
      // Create form-urlencoded data instead of JSON
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('video_url', '');
      params.append('bulk_upload_id', '');
      params.append('callback_url', '');
      
      console.log("Sending to API:", params.toString());
      
      const response = await axios.post(
        `${IMENTIV_API_URL}texts`,
        params,
        { 
          headers: { 
            "X-API-Key": IMENTIV_API_KEY, 
            "Content-Type": "application/x-www-form-urlencoded",
            "accept": "application/json" 
          } 
        }
      );
      
      const textId = response.data.id;
      console.log("Text uploaded, ID:", textId);
      
      // Step 2: Poll for analysis completion
      const getEmotionResult = async () => {
        try {
          const response = await axios.get(`${IMENTIV_API_URL}texts/${textId}`, {
            headers: {
              "X-API-Key": IMENTIV_API_KEY,
              "accept": "application/json",
            },
          });
          if (response.data.status === "processing") {
            return null; // Keep polling
          }
          return response.data.sentences && response.data.sentences[0] ? 
            response.data.sentences[0].emotions : null;
        } catch (error) {
          console.error("Error fetching text analysis:", error);
          return null;
        }
      };
      
      // Step 3: Poll every 3 seconds until analysis is done
      const waitForEmotionAnalysis = async () => {
        return new Promise((resolve) => {
          const interval = setInterval(async () => {
            const emotions = await getEmotionResult();
            if (emotions) {
              clearInterval(interval);
              resolve(emotions);
            }
          }, 3000);
          
          // Add a timeout to prevent infinite polling
          setTimeout(() => {
            clearInterval(interval);
            resolve(null);
          }, 30000);
        });
      };
      
      const emotions = await waitForEmotionAnalysis();
      
      if (!emotions) {
        return res.status(504).json({ error: "Analysis timed out" });
      }
      
      // Step 4: Determine dominant emotion
      let dominantEmotion = null;
      let highestScore = 0;
      for (let emotion in emotions) {
        if (emotions[emotion] > highestScore) {
          highestScore = emotions[emotion];
          dominantEmotion = emotion;
        }
      }
      
    
      res.json({ dominantEmotion, confidence: highestScore });
    } catch (error) {
      console.error("Text Mood Analysis Error:", error);
      
      // Better error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      res.status(500).json({ error: "Failed to analyze text mood" });
    }
  };

const analyzeAudioMood = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Audio file is required" });
    
    // Step 1: Upload audio file to Imentiv
    const formData = new FormData();
    // Correctly append the buffer as a file
    formData.append("file", req.file.buffer, {
      filename: "audio.wav",
      contentType: req.file.mimetype || 'audio/wav'
    });
    formData.append("title", "User Mood Test");
    formData.append("description", "Audio recording for mood analysis");
    
    const uploadResponse = await axios.post(`${IMENTIV_API_URL}audios`, formData, {
      headers: {
        ...formData.getHeaders(), // This will work with form-data package
        "X-API-Key": IMENTIV_API_KEY,
      },
    });
    
    const audioId = uploadResponse.data.id;
    console.log("Audio uploaded, ID:", audioId);
    
    // Step 2: Poll for analysis completion
    const getEmotionResult = async () => {
        
      try {
        const response = await axios.get(`${IMENTIV_API_URL}audios/${audioId}`, {
          headers: {
            "X-API-Key": IMENTIV_API_KEY,
            accept: "application/json",
          },
        });
        
        if (response.data.status === "processing") {
          return null; // Keep polling
        }
     
        
        return response.data.emotions; // Return emotion data
      } catch (error) {
        console.error("Error fetching audio analysis:", error);
        return null;
      }
    };
    
    // Step 3: Poll every 3 seconds until analysis is done
    const waitForEmotionAnalysis = async () => {
      return new Promise((resolve) => {
        const interval = setInterval(async () => {
          const emotions = await getEmotionResult();
          if (emotions) {
            clearInterval(interval);
            resolve(emotions);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(interval);
          resolve(null);
        }, 30000);
      });
    };
    
    const emotions = await waitForEmotionAnalysis();

    if (!emotions) {
      return res.status(504).json({ error: "Analysis timed out" });
    }
    
    // Step 4: Determine dominant emotion
    let dominantEmotion = null;
    let highestScore = 0;
    
    for (let emotion in emotions) {
      if (emotions[emotion] > highestScore) {
        highestScore = emotions[emotion];
        dominantEmotion = emotion;
      }
    }
    
    res.json({ dominantEmotion, score: highestScore });
  } catch (error) {
    console.error("Audio Mood Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze audio mood" });
  }
};

const analyzeImageMood = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image file is required" });
    
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append("title", "User Image Mood Test");
    formData.append("description", "Facial expression analysis");
    
    const response = await axios.post(`${IMENTIV_API_URL}images`, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-API-Key": IMENTIV_API_KEY,
      },
    });
    
    // res.json(response.data);
    const imageId = response.data.id;
    console.log("Image uploaded, ID:", imageId);
    
    // Step 2: Poll for analysis completion
    const getEmotionResult = async () => {
        
      try {
        const response = await axios.get(`${IMENTIV_API_URL}images/${imageId}`, {
          headers: {
            "X-API-Key": IMENTIV_API_KEY,
            accept: "application/json",
          },
        });
        
        if (response.data.status === "processing") {
          return null; // Keep polling
        }
     
        
        // return response.data.emotions; // Return emotion data
        return response.data.faces && response.data.faces[0] ? response.data.faces[0].emotions : null;
      } catch (error) {
        console.error("Error fetching audio analysis:", error);
        return null;
      }
    };
    
    // Step 3: Poll every 3 seconds until analysis is done
    const waitForEmotionAnalysis = async () => {
      return new Promise((resolve) => {
        const interval = setInterval(async () => {
          const emotions = await getEmotionResult();
          if (emotions) {
            clearInterval(interval);
            resolve(emotions);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(interval);
          resolve(null);
        }, 30000);
      });
    };
    
    const emotions = await waitForEmotionAnalysis();

    if (!emotions) {
      return res.status(504).json({ error: "Analysis timed out" });
    }
    
    // Step 4: Determine dominant emotion
    let dominantEmotion = null;
    let highestScore = 0;
    
    for (let emotion in emotions) {
      if (emotions[emotion] > highestScore) {
        highestScore = emotions[emotion];
        dominantEmotion = emotion;
      }
    }
    
    res.json({ dominantEmotion, score: highestScore });
  } catch (error) {
    console.error("Image Mood Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze image mood" });
  }
};

module.exports = {
  analyzeTextMood,
  analyzeAudioMood,
  analyzeImageMood,
  upload,
};