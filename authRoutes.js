const admin = require('./firebaseAdmin'); // Assuming you saved the admin initialization in firebaseAdmin.js
const express = require('express');
const router = express.Router();

// Sign-up endpoint
router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // Save user role in Realtime Database
    await admin.database().ref('users/' + userRecord.uid).set({
      role: role,
    });

    res.status(201).send({ message: 'User created successfully!', uid: userRecord.uid });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
