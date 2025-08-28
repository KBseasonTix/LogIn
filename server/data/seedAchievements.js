// server/data/seedAchievements.js
// Script to seed default achievements into the database

const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');
const defaultAchievements = require('./defaultAchievements');

async function seedAchievements() {
  try {
    console.log('Seeding achievements...');
    
    // Clear existing achievements (optional - comment out in production)
    // await Achievement.deleteMany({});
    
    for (const achievementData of defaultAchievements) {
      const existingAchievement = await Achievement.findOne({ id: achievementData.id });
      
      if (!existingAchievement) {
        const achievement = new Achievement(achievementData);
        await achievement.save();
        console.log(`Created achievement: ${achievementData.name}`);
      } else {
        // Update existing achievement
        await Achievement.findOneAndUpdate(
          { id: achievementData.id },
          achievementData,
          { new: true }
        );
        console.log(`Updated achievement: ${achievementData.name}`);
      }
    }
    
    console.log('Achievement seeding completed successfully');
    return true;
  } catch (error) {
    console.error('Error seeding achievements:', error);
    return false;
  }
}

// If running this file directly
if (require.main === module) {
  const dotenv = require('dotenv');
  dotenv.config();
  
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected for seeding');
    const success = await seedAchievements();
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

module.exports = seedAchievements;