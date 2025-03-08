const admin = require("firebase-admin");
// const serviceAccount = require("./config/cuddleup-21617-firebase-adminsdk-fbsvc-8a9a6a7826.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Array of predefined reasons
const predefinedReasons = [
  { reason: "Work Stress", emotion: "Angry" },
  { reason: "Traffic Jam", emotion: "Angry" },
  { reason: "Argument with Someone", emotion: "Angry" },
  { reason: "Missed a Deadline", emotion: "Angry" },
  { reason: "Poor Customer Service", emotion: "Angry" },
  { reason: "Other", emotion: "Angry" },
  { reason: "Random Thought", emotion: "Angry" },
  { reason: "Couldn’t Identify Emotion", emotion: "Angry" },
  { reason: "Mixed Feelings", emotion: "Angry" },
  { reason: "No Specific Reason", emotion: "Angry" },

  { reason: "Dealing with an irritating situation", emotion: "Annoyance" },
{ reason: "Hearing constant noise", emotion: "Annoyance" },
{ reason: "Being interrupted while concentrating", emotion: "Annoyance" },
{ reason: "Having to repeat something multiple times", emotion: "Annoyance" },
{ reason: "Being treated unfairly", emotion: "Annoyance" },
{ reason: "Dealing with unnecessary delays", emotion: "Annoyance" },
{ reason: "Having someone invade personal space", emotion: "Annoyance" },
{ reason: "When things don't go as planned", emotion: "Annoyance" },
{ reason: "Seeing people be inconsiderate", emotion: "Annoyance" },
{ reason: "Dealing with a messy environment", emotion: "Annoyance" },


{ reason: "Preparing for an important event", emotion: "Nervousness" },
{ reason: "Facing a difficult task", emotion: "Nervousness" },
{ reason: "Uncertainty about the outcome", emotion: "Nervousness" },
{ reason: "Being watched or judged", emotion: "Nervousness" },
{ reason: "Anticipating something unfamiliar", emotion: "Nervousness" },
{ reason: "Having to speak in front of others", emotion: "Nervousness" },
{ reason: "Meeting new people", emotion: "Nervousness" },
{ reason: "Making a significant decision", emotion: "Nervousness" },
{ reason: "Feeling unprepared", emotion: "Nervousness" },
{ reason: "Going through a major life change", emotion: "Nervousness" },

  { reason: "Relationship Issues", emotion: "Sad" },
  { reason: "Lost Something Important", emotion: "Sad" },
  { reason: "Feeling Unappreciated", emotion: "Sad" },
  { reason: "Bad News from a Friend", emotion: "Sad" },
  { reason: "Rainy and Gloomy Weather", emotion: "Sad" },
  { reason: "Other", emotion: "Sad" },
  { reason: "Random Thought", emotion: "Sad" },
  { reason: "Couldn’t Identify Emotion", emotion: "Sad" },
  { reason: "Mixed Feelings", emotion: "Sad" },
  { reason: "No Specific Reason", emotion: "Sad" },

  { reason: "Relationship Issues", emotion: "Sadness" },
  { reason: "Lost Something Important", emotion: "Sadness" },
  { reason: "Feeling Unappreciated", emotion: "Sadness" },
  { reason: "Bad News from a Friend", emotion: "Sadness" },
  { reason: "Rainy and Gloomy Weather", emotion: "Sadness" },
  { reason: "Other", emotion: "Sadness" },
  { reason: "Random Thought", emotion: "Sadness" },
  { reason: "Couldn’t Identify Emotion", emotion: "Sadness" },
  { reason: "Mixed Feelings", emotion: "Sadness" },
  { reason: "No Specific Reason", emotion: "Sadness" },

  { reason: "Health Concerns", emotion: "Worried" },
  { reason: "Upcoming Exam or Presentation", emotion: "Worried" },
  { reason: "Financial Issues", emotion: "Worried" },
  { reason: "Family Responsibilities", emotion: "Worried" },
  { reason: "Thinking About the Future", emotion: "Worried" },
  { reason: "Other", emotion: "Worried" },
  { reason: "Random Thought", emotion: "Worried" },
  { reason: "Couldn’t Identify Emotion", emotion: "Worried" },
  { reason: "Mixed Feelings", emotion: "Worried" },
  { reason: "No Specific Reason", emotion: "Worried" },

  { reason: "Personal Achievement", emotion: "Happy" },
  { reason: "Had a Great Conversation", emotion: "Happy" },
  { reason: "Finished a Task Successfully", emotion: "Happy" },
  { reason: "Nice Compliment from Someone", emotion: "Happy" },
  { reason: "Enjoying a Good Meal", emotion: "Happy" },
  { reason: "Other", emotion: "Happy" },
  { reason: "Random Thought", emotion: "Happy" },
  { reason: "Couldn’t Identify Emotion", emotion: "Happy" },
  { reason: "Mixed Feelings", emotion: "Happy" },
  { reason: "No Specific Reason", emotion: "Happy" },

  { reason: "Unexpected Event", emotion: "Excited" },
  { reason: "Planning a Trip", emotion: "Excited" },
  { reason: "Bought Something New", emotion: "Excited" },
  { reason: "Going to a Party or Event", emotion: "Excited" },
  { reason: "Starting a New Hobby", emotion: "Excited" },
  { reason: "Other", emotion: "Excited" },
  { reason: "Random Thought", emotion: "Excited" },
  { reason: "Couldn’t Identify Emotion", emotion: "Excited" },
  { reason: "Mixed Feelings", emotion: "Excited" },
  { reason: "No Specific Reason", emotion: "Excited" },

  { reason: "Getting a new job or promotion", emotion: "Excitement" },
{ reason: "Attending a long-awaited event or concert", emotion: "Excitement" },
{ reason: "Meeting a favorite celebrity", emotion: "Excitement" },
{ reason: "Receiving great news or a surprise gift", emotion: "Excitement" },
{ reason: "A new adventure or vacation", emotion: "Excitement" },
{ reason: "Starting a new project or hobby", emotion: "Excitement" },
{ reason: "Making progress on a personal goal", emotion: "Excitement" },
{ reason: "Experiencing something for the first time", emotion: "Excitement" },
{ reason: "Reuniting with a loved one after a long time", emotion: "Excitement" },
{ reason: "Winning a competition or game", emotion: "Excitement" },

  { reason: "Feeling Lonely", emotion: "Crying" },
  { reason: "Miss Someone", emotion: "Crying" },
  { reason: "Emotional Movie or Music", emotion: "Crying" },
  { reason: "Bad Memory Came Back", emotion: "Crying" },
  { reason: "Lack of Support from Friends", emotion: "Crying" },
  { reason: "Other", emotion: "Crying" },
  { reason: "Random Thought", emotion: "Crying" },
  { reason: "Couldn’t Identify Emotion", emotion: "Crying" },
  { reason: "Mixed Feelings", emotion: "Crying" },
  { reason: "No Specific Reason", emotion: "Crying" },

  { reason: "Nothing in Particular", emotion: "Neutral" },
  { reason: "Just Another Regular Day", emotion: "Neutral" },
  { reason: "Feeling Bored", emotion: "Neutral" },
  { reason: "Mind Wandering", emotion: "Neutral" },
  { reason: "Just Observing Things Around", emotion: "Neutral" },
  { reason: "Other", emotion: "Neutral" },
  { reason: "Random Thought", emotion: "Neutral" },
  { reason: "Couldn’t Identify Emotion", emotion: "Neutral" },
  { reason: "Mixed Feelings", emotion: "Neutral" },
  { reason: "No Specific Reason", emotion: "Neutral" },

  { reason: "Unexpected Gift", emotion: "Surprise" },
  { reason: "Surprising News", emotion: "Surprise" },
  { reason: "Unexpected Visitor", emotion: "Surprise" },
  { reason: "Surprise Party", emotion: "Surprise" },
  { reason: "Unplanned Opportunity", emotion: "Surprise" },
  { reason: "Other", emotion: "Surprise" },
  { reason: "Random Thought", emotion: "Surprise" },
  { reason: "Couldn’t Identify Emotion", emotion: "Surprise" },
  { reason: "Mixed Feelings", emotion: "Surprise" },
  { reason: "No Specific Reason", emotion: "Surprise" },

  { reason: "Watching a Scary Movie", emotion: "Fear" },
  { reason: "Facing a Dangerous Situation", emotion: "Fear" },
  { reason: "Fear of the Unknown", emotion: "Fear" },
  { reason: "Feeling Unsafe", emotion: "Fear" },
  { reason: "Having a Nightmare", emotion: "Fear" },
  { reason: "Other", emotion: "Fear" },
  { reason: "Random Thought", emotion: "Fear" },
  { reason: "Couldn’t Identify Emotion", emotion: "Fear" },
  { reason: "Mixed Feelings", emotion: "Fear" },
  { reason: "No Specific Reason", emotion: "Fear" },

  { reason: "Waiting for Something", emotion: "Boredom" },
  { reason: "No Plans", emotion: "Boredom" },
  { reason: "Stuck in a Routine", emotion: "Boredom" },
  { reason: "Lack of Interest", emotion: "Boredom" },
  { reason: "Long Day at Work or School", emotion: "Boredom" },
  { reason: "Other", emotion: "Boredom" },
  { reason: "Random Thought", emotion: "Boredom" },
  { reason: "Couldn’t Identify Emotion", emotion: "Boredom" },
  { reason: "Mixed Feelings", emotion: "Boredom" },
  { reason: "No Specific Reason", emotion: "Boredom" },

  { reason: "Received Praise", emotion: "Approval" },
  { reason: "Validation from Others", emotion: "Approval" },
  { reason: "Recognition for Hard Work", emotion: "Approval" },
  { reason: "Compliment from Someone", emotion: "Approval" },
  { reason: "Feeling Appreciated", emotion: "Approval" },
  { reason: "Other", emotion: "Approval" },
  { reason: "Random Thought", emotion: "Approval" },
  { reason: "Couldn’t Identify Emotion", emotion: "Approval" },
  { reason: "Mixed Feelings", emotion: "Approval" },
  { reason: "No Specific Reason", emotion: "Approval" },

  { reason: "Wanting Something New", emotion: "Desire" },
  { reason: "Desire for Change", emotion: "Desire" },
  { reason: "Ambition for Growth", emotion: "Desire" },
  { reason: "Lust or Attraction", emotion: "Desire" },
  { reason: "Wanting to Travel", emotion: "Desire" },
  { reason: "Other", emotion: "Desire" },
  { reason: "Random Thought", emotion: "Desire" },
  { reason: "Couldn’t Identify Emotion", emotion: "Desire" },
  { reason: "Mixed Feelings", emotion: "Desire" },
  { reason: "No Specific Reason", emotion: "Desire" },

  { reason: "Wanting to Learn Something New", emotion: "Curiosity" },
  { reason: "Exploring New Ideas", emotion: "Curiosity" },
  { reason: "Seeking Adventure", emotion: "Curiosity" },
  { reason: "Interest in Discovering Facts", emotion: "Curiosity" },
  { reason: "Wondering About the Future", emotion: "Curiosity" },
  { reason: "Other", emotion: "Curiosity" },
  { reason: "Random Thought", emotion: "Curiosity" },
  { reason: "Couldn’t Identify Emotion", emotion: "Curiosity" },
  { reason: "Mixed Feelings", emotion: "Curiosity" },
  { reason: "No Specific Reason", emotion: "Curiosity" },

  { reason: "Accomplishing a Personal Goal", emotion: "Pride" },
  { reason: "Achievement in a Project", emotion: "Pride" },
  { reason: "Winning a Competition", emotion: "Pride" },
  { reason: "Overcoming a Challenge", emotion: "Pride" },
  { reason: "Feeling Good About Yourself", emotion: "Pride" },
  { reason: "Other", emotion: "Pride" },
  { reason: "Random Thought", emotion: "Pride" },
  { reason: "Couldn’t Identify Emotion", emotion: "Pride" },
  { reason: "Mixed Feelings", emotion: "Pride" },
  { reason: "No Specific Reason", emotion: "Pride" },

  { reason: "Not Understanding Something", emotion: "Confusion" },
  { reason: "Feeling Lost", emotion: "Confusion" },
  { reason: "Disorientation", emotion: "Confusion" },
  { reason: "Unsure About Decisions", emotion: "Confusion" },
  { reason: "Uncertainty About the Future", emotion: "Confusion" },
  { reason: "Other", emotion: "Confusion" },
  { reason: "Random Thought", emotion: "Confusion" },
  { reason: "Couldn’t Identify Emotion", emotion: "Confusion" },
  { reason: "Mixed Feelings", emotion: "Confusion" },
  { reason: "No Specific Reason", emotion: "Confusion" },

  { reason: "Thankful for Support from Others", emotion: "Gratitude" },
  { reason: "Appreciating Life’s Little Moments", emotion: "Gratitude" },
  { reason: "Feeling Thankful for Family/Friends", emotion: "Gratitude" },
  { reason: "Grateful for Achievements", emotion: "Gratitude" },
  { reason: "Feeling Lucky", emotion: "Gratitude" },
  { reason: "Other", emotion: "Gratitude" },
  { reason: "Random Thought", emotion: "Gratitude" },
  { reason: "Couldn’t Identify Emotion", emotion: "Gratitude" },
  { reason: "Mixed Feelings", emotion: "Gratitude" },
  { reason: "No Specific Reason", emotion: "Gratitude" },

  { reason: "Feeling Loved by Someone", emotion: "Love" },
  { reason: "Falling in Love", emotion: "Love" },
  { reason: "Loving a Family Member", emotion: "Love" },
  { reason: "Loving a Friend", emotion: "Love" },
  { reason: "Loving a Pet", emotion: "Love" },
  { reason: "Other", emotion: "Love" },
  { reason: "Random Thought", emotion: "Love" },
  { reason: "Couldn’t Identify Emotion", emotion: "Love" },
  { reason: "Mixed Feelings", emotion: "Love" },
  { reason: "No Specific Reason", emotion: "Love" },

  { reason: "Witnessing something repulsive", emotion: "Disgust" },
{ reason: "Smelling something unpleasant", emotion: "Disgust" },
{ reason: "Seeing something dirty or unclean", emotion: "Disgust" },
{ reason: "Encountering a revolting taste", emotion: "Disgust" },
{ reason: "Feeling betrayed by someone", emotion: "Disgust" },
{ reason: "Dealing with a dishonest person", emotion: "Disgust" },
{ reason: "Seeing something that challenges personal beliefs", emotion: "Disgust" },
{ reason: "Having to touch something unpleasant", emotion: "Disgust" },
{ reason: "Witnessing cruelty or violence", emotion: "Disgust" },
{ reason: "Encountering behavior that feels morally wrong", emotion: "Disgust" },

  { reason: "Watching a Funny Video", emotion: "Amusement" },
  { reason: "Jokes from Friends", emotion: "Amusement" },
  { reason: "Enjoying Humor in Movies", emotion: "Amusement" },
  { reason: "Lighthearted Situation", emotion: "Amusement" },
  { reason: "Fun Event", emotion: "Amusement" },
  { reason: "Other", emotion: "Amusement" },
  { reason: "Random Thought", emotion: "Amusement" },
  { reason: "Couldn’t Identify Emotion", emotion: "Amusement" },
  { reason: "Mixed Feelings", emotion: "Amusement" },
  { reason: "No Specific Reason", emotion: "Amusement" },

  { reason: "Losing Someone Close", emotion: "Grief" },
  { reason: "Death of a Pet", emotion: "Grief" },
  { reason: "End of a Relationship", emotion: "Grief" },
  { reason: "Feeling Alone in the World", emotion: "Grief" },
  { reason: "Mourning a Loss", emotion: "Grief" },
  { reason: "Other", emotion: "Grief" },
  { reason: "Random Thought", emotion: "Grief" },
  { reason: "Couldn’t Identify Emotion", emotion: "Grief" },
  { reason: "Mixed Feelings", emotion: "Grief" },
  { reason: "No Specific Reason", emotion: "Grief" },

  { reason: "Looking Up to Someone", emotion: "Admiration" },
  { reason: "Inspired by Someone’s Work", emotion: "Admiration" },
  { reason: "Respect for Someone’s Character", emotion: "Admiration" },
  { reason: "Admiring Someone’s Talent", emotion: "Admiration" },
  { reason: "Feeling Awe Toward Someone", emotion: "Admiration" },
  { reason: "Other", emotion: "Admiration" },
  { reason: "Random Thought", emotion: "Admiration" },
  { reason: "Couldn’t Identify Emotion", emotion: "Admiration" },
  { reason: "Mixed Feelings", emotion: "Admiration" },
  { reason: "No Specific Reason", emotion: "Admiration" },

  { reason: "Making a Mistake in Public", emotion: "Embarrassment" },
  { reason: "Awkward Social Situation", emotion: "Embarrassment" },
  { reason: "Saying Something Wrong", emotion: "Embarrassment" },
  { reason: "Being the Center of Attention", emotion: "Embarrassment" },
  { reason: "Acknowledging a Fault", emotion: "Embarrassment" },
  { reason: "Other", emotion: "Embarrassment" },
  { reason: "Random Thought", emotion: "Embarrassment" },
  { reason: "Couldn’t Identify Emotion", emotion: "Embarrassment" },
  { reason: "Mixed Feelings", emotion: "Embarrassment" },
  { reason: "No Specific Reason", emotion: "Embarrassment" },

  { reason: "Not Liking Someone’s Actions", emotion: "Disapproval" },
  { reason: "Disagreeing with Someone’s Opinion", emotion: "Disapproval" },
  { reason: "Disapproving of a Decision", emotion: "Disapproval" },
  { reason: "Feeling Disappointed in Someone", emotion: "Disapproval" },
  { reason: "Feeling Let Down", emotion: "Disapproval" },
  { reason: "Other", emotion: "Disapproval" },
  { reason: "Random Thought", emotion: "Disapproval" },
  { reason: "Couldn’t Identify Emotion", emotion: "Disapproval" },
  { reason: "Mixed Feelings", emotion: "Disapproval" },
  { reason: "No Specific Reason", emotion: "Disapproval" },

  { reason: "Overcoming a Difficult Situation", emotion: "Relief" },
  { reason: "Getting Good News After Stress", emotion: "Relief" },
  { reason: "Completing a Challenging Task", emotion: "Relief" },
  { reason: "No Longer Worrying About Something", emotion: "Relief" },
  { reason: "Feeling Free from a Burden", emotion: "Relief" },
  { reason: "Other", emotion: "Relief" },
  { reason: "Random Thought", emotion: "Relief" },
  { reason: "Couldn’t Identify Emotion", emotion: "Relief" },
  { reason: "Mixed Feelings", emotion: "Relief" },
  { reason: "No Specific Reason", emotion: "Relief" },

  { reason: "Regret for a Past Action", emotion: "Remorse" },
  { reason: "Apologizing to Someone", emotion: "Remorse" },
  { reason: "Feeling Guilty", emotion: "Remorse" },
  { reason: "Recognizing Mistakes", emotion: "Remorse" },
  { reason: "Learning from Past Regrets", emotion: "Remorse" },
  { reason: "Other", emotion: "Remorse" },
  { reason: "Random Thought", emotion: "Remorse" },
  { reason: "Couldn’t Identify Emotion", emotion: "Remorse" },
  { reason: "Mixed Feelings", emotion: "Remorse" },
  { reason: "No Specific Reason", emotion: "Remorse" },

  { reason: "Coming to a New Understanding", emotion: "Realization" },
  {
    reason: "Discovering Something New About Yourself",
    emotion: "Realization",
  },
  { reason: "Having an Insightful Moment", emotion: "Realization" },
  { reason: "Figuring Out a Problem", emotion: "Realization" },
  { reason: "Coming to Terms with Something", emotion: "Realization" },
  { reason: "Other", emotion: "Realization" },
  { reason: "Random Thought", emotion: "Realization" },
  { reason: "Couldn’t Identify Emotion", emotion: "Realization" },
  { reason: "Mixed Feelings", emotion: "Realization" },
  { reason: "No Specific Reason", emotion: "Realization" },

  { reason: "Looking Forward to the Future", emotion: "Optimism" },
  { reason: "Hopeful for Positive Change", emotion: "Optimism" },
  { reason: "Feeling Like Things Will Get Better", emotion: "Optimism" },
  { reason: "Trusting in Better Times Ahead", emotion: "Optimism" },
  { reason: "Believing in Possibilities", emotion: "Optimism" },
  { reason: "Other", emotion: "Optimism" },
  { reason: "Random Thought", emotion: "Optimism" },
  { reason: "Couldn’t Identify Emotion", emotion: "Optimism" },
  { reason: "Mixed Feelings", emotion: "Optimism" },
  { reason: "No Specific Reason", emotion: "Optimism" },

  { reason: "Being treated unfairly", emotion: "Anger" },
{ reason: "Experiencing frustration", emotion: "Anger" },
{ reason: "Being misunderstood or misjudged", emotion: "Anger" },
{ reason: "Seeing someone else being mistreated", emotion: "Anger" },
{ reason: "Having expectations unmet", emotion: "Anger" },
{ reason: "Being insulted or disrespected", emotion: "Anger" },
{ reason: "Feeling powerless or helpless", emotion: "Anger" },
{ reason: "Being lied to", emotion: "Anger" },
{ reason: "Dealing with a stressful situation", emotion: "Anger" },
{ reason: "Experiencing injustice or inequality", emotion: "Anger" },
];

async function addPredefinedReasons() {
  try {
    const batch = db.batch();

    predefinedReasons.forEach((reasonData, index) => {
      const reasonRef = db.collection("reasons").doc(`${index + 1}`); // Use index or any other unique ID
      batch.set(reasonRef, reasonData);
    });

    await batch.commit();
    console.log("Predefined reasons added successfully!");
  } catch (error) {
    console.error("Error adding predefined reasons:", error.message);
  }
}

addPredefinedReasons();
