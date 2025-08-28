# 📱 iOS Simulator Testing Guide

## Quick Test Instructions

### 1. Start the Development Server
```bash
cd /Users/kyle/Desktop/LogIn/client
npx expo start
```

### 2. Open iOS Simulator
- Press `i` in the terminal to open iOS Simulator
- Or scan QR code with Expo Go app on physical device

### 3. Essential Test Checklist

#### ✅ Core App Functions:
- [ ] App launches without crashes
- [ ] User can register/login
- [ ] Home feed displays posts
- [ ] Profile screen loads correctly
- [ ] Communities page works
- [ ] Navigation between screens works

#### ✅ Points & Rewards System:
- [ ] Points display correctly in profile (should show 1250)
- [ ] "Earn Points" section shows for free users
- [ ] Rewarded ad button appears
- [ ] "Watch Ad for 100 Points" button works (shows test ads)
- [ ] Points increase after watching ad

#### ✅ Subscription Features:
- [ ] "Upgrade" button opens subscription modal
- [ ] Subscription modal shows $5/month and $40/year options
- [ ] Both plan options are selectable
- [ ] Subscribe buttons work (should show success in demo)

#### ✅ Badge Gifting:
- [ ] Can access badge gifting from profile
- [ ] Badge gifting uses points system
- [ ] Badge gifting modal opens correctly

#### ✅ AdMob Integration:
- [ ] Test ads display correctly
- [ ] Rewarded ads can be watched
- [ ] No crashes when loading ads
- [ ] Banner ads show on home screen (if implemented)

### 4. Expected Behavior

**Free Users:**
- See "Earn Points" section in profile
- Can watch rewarded ads for points
- See subscription upgrade prompts
- Limited to 1 community and 1 post per day

**Premium Users (after subscribing):**
- No "Earn Points" section
- No ads
- Unlimited communities and posts
- Premium badge in profile

### 5. Troubleshooting

**If app crashes:**
- Check Metro bundler logs
- Ensure all imports are correct
- Check if AdMob test IDs are working

**If ads don't load:**
- Test ads should work in development
- Check AdMob configuration in app.json
- Verify internet connection

**If points don't update:**
- Check AuthContext updateUserPoints function
- Verify localStorage/AsyncStorage is working
- Check console logs for errors

### 6. Demo Flow

1. **Launch app** → Should load to home screen
2. **Navigate to Profile** → See 1250 points and "Earn Points" section
3. **Tap "Watch Ad"** → Test rewarded ad plays
4. **Complete ad** → Points increase by 100
5. **Tap "Upgrade"** → Subscription modal opens
6. **Select plan** → Can choose monthly or yearly
7. **Tap Subscribe** → Success message shows

### 7. Performance Check

- App should launch in under 3 seconds
- Screen transitions should be smooth
- No memory warnings in simulator
- No console errors or warnings

---

**✅ If all tests pass, your app is ready for production builds!**