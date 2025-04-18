require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { auth, db } = require("./firebase");
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } = require("firebase/firestore");
const SibApiV3Sdk = require('sib-api-v3-sdk');
const crypto = require("crypto");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Path to your saved key

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;

// Configure Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Function to generate a random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString('hex');
};

const validateDateFormat = (dateStr) => {
  const regex = /^(\d{2})\/([A-Za-z]{3})\/(\d{4})$/;
  if (!regex.test(dateStr)) return false;
  
  const [, day, monthStr, year] = dateStr.match(regex);
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    .indexOf(monthStr.toLowerCase()) + 1;
  
  if (month === 0) return false;
  const dayNum = parseInt(day);
  const yearNum = parseInt(year);
  
  if (dayNum < 1 || dayNum > 31) return false;
  if (yearNum < 1900 || yearNum > 9999) return false;
  
  return true;
};

app.post("/signup", async (req, res) => {
  const { businessEmail, businessName, financialYearEnd, address, contactNumber } = req.body;

  console.log("Request body:", req.body);

  try {
    if (!validateDateFormat(financialYearEnd)) {
      console.log("Invalid date format:", financialYearEnd);
      return res.status(400).json({ error: "Invalid financial year end format. Please use DD/MMM/YYYY (e.g., 31/Mar/2025)" });
    }

    const [, day, monthStr, year] = financialYearEnd.match(/^(\d{2})\/([A-Za-z]{3})\/(\d{4})$/);
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
      .indexOf(monthStr.toLowerCase());
    const dateObject = new Date(year, month, day);

    if (isNaN(dateObject.getTime())) {
      console.log("Invalid date parsed:", financialYearEnd);
      return res.status(400).json({ error: "Invalid date value for Financial Year End" });
    }

    // Generate a random password
    const password = generatePassword();
    console.log("Generated password:", password);
    console.log("Type of password:", typeof password);
    console.log("Password length:", password.length);

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new Error("Generated password is invalid (must be a string, at least 6 characters)");
    }

    console.log("Creating Firebase user with:", { businessEmail, password });
    const userCredential = await createUserWithEmailAndPassword(auth, businessEmail, password);
    const user = userCredential.user;
    console.log("User created with UID:", user.uid);

    console.log("Saving to Firestore for UID:", user.uid);
    await setDoc(doc(db, "users", user.uid), {
      businessName,
      financialYearEnd: dateObject,
      address,
      contactNumber,
      businessEmail,
      createdAt: new Date().toISOString(),
    });

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(businessEmail);
    console.log("Password reset link generated:", resetLink);

    console.log("Preparing to send user email to:", businessEmail);
    const userEmail = new SibApiV3Sdk.SendSmtpEmail();
    userEmail.sender = { name: 'Forge', email: process.env.ADMIN_EMAIL };
    userEmail.to = [{ email: businessEmail }];
    userEmail.subject = 'BBBEE Calculator - Empower Your Compliance Journey!';
    userEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color: #4a90e2; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                <h3 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome, ${businessName}!</h3>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; color: #333333;">
                <p style="font-size: 16px; line-height: 1.5;">Your account has been created successfully!</p>
                <p style="font-size: 16px; line-height: 1.5;">Email: ${businessEmail}</p>
                <p style="font-size: 16px; line-height: 1.5;">We’re excited to welcome you to Forge! You’ve just taken a key step toward simplifying your BBBEE compliance. Our calculator is designed to help you assess, plan, and achieve your empowerment goals with ease and accuracy. </p>
                <pstyle="font-size: 16px; line-height: 1.5;">We’re currently reviewing your account creation and payment details. Once everything is confirmed, we’ll get back to you with full access details and next steps to start using the calculator. This won’t take long, and we’ll be in touch soon!</p>
                <pstyle="font-size: 16px; line-height: 1.5;">In the meantime, if you have any questions, feel free to reach out to us at tebatsomoyaba@gmail.com. We’re here to assist you every step of the way.</p>
                <pstyle="font-size: 16px; line-height: 1.5;">Looking forward to supporting your BBBEE success!</p>
                <p><a href="${resetLink}" style="color: #4a90e2; text-decoration: underline;">Set Your Password</a></p>
                <p style="font-size: 14px; color: #777777; margin-top: 20px;">Best regards,<br><span style="color: #4a90e2; font-weight: bold;">Forge Academy</span></p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999999; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                © ${new Date().getFullYear()} Forge. All rights reserved .
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    console.log("Preparing to send admin email");
    const adminEmail = new SibApiV3Sdk.SendSmtpEmail();
    adminEmail.sender = { name: 'Forge', email: process.env.ADMIN_EMAIL };
    adminEmail.to = [{ email: process.env.ADMIN_EMAIL }];
    adminEmail.subject = 'New User Signup Notification';
    adminEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color: #e94e77; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                <h3 style="color: #ffffff; margin: 0; font-size: 24px;">New User Alert</h3>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; color: #333333;">
                <p style="font-size: 16px; line-height: 1.5;">A new user has just signed up:</p>
                <ul style="list-style-type: none; padding: 0; font-size: 16px; line-height: 1.6;">
                  <li style="margin-bottom: 10px;"><strong>Business Name:</strong> ${businessName}</li>
                  <li style="margin-bottom: 10px;"><strong>Email:</strong> ${businessEmail}</li>
                  <li style="margin-bottom: 10px;"><strong>Address:</strong> ${address}</li>
                  <li style="margin-bottom: 10px;"><strong>Contact Number:</strong> ${contactNumber}</li>
                  <li style="margin-bottom: 10px;"><strong>Financial Year End:</strong> ${financialYearEnd}</li>
                  <li style="margin-bottom: 10px;"><strong>Password:</strong> ${password}</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999999; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                © ${new Date().getFullYear()} Forge. All rights reserved.
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    console.log("Sending emails via Brevo");
    await apiInstance.sendTransacEmail(userEmail);
    await apiInstance.sendTransacEmail(adminEmail);

    console.log("Signup successful for UID:", user.uid);
    res.status(201).json({ 
      message: "User created successfully, emails sent", 
      uid: user.uid, 
      businessName, 
      financialYearEnd: dateObject,
    });
  } catch (error) {
    console.error("Signup error details:", { code: error.code, message: error.message, stack: error.stack });
    res.status(400).json({ error: error.message, code: error.code });
  }
});


// New /update-profile endpoint
app.patch("/update-profile", async (req, res) => {
  const { uid, businessName, sector } = req.body;
  console.log("Update profile request:", { uid, businessName, sector });

  try {
    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!businessName || !sector) {
      return res.status(400).json({ error: "Business name and sector are required" });
    }

    await setDoc(doc(db, "users", uid), { businessName, sector }, { merge: true });
    res.status(200).json({ message: "Profile updated", businessName, sector });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { businessEmail, password } = req.body;
  console.log("Login request received:", { businessEmail, password: "****" }); // Hide password

  try {
    console.log("Attempting Firebase login...");
    const userCredential = await signInWithEmailAndPassword(auth, businessEmail, password);
    const user = userCredential.user;
    console.log("Firebase login successful, UID:", user.uid);

    console.log("Fetching user data from Firestore...");
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      console.log("No user data found in Firestore for UID:", user.uid);
      return res.status(404).json({ error: "User data not found" });
    }

    const userData = userDoc.data();
    console.log("User data fetched:", userData);
    res.status(200).json({ 
      message: "Login successful", 
      uid: user.uid, 
      businessName: userData.businessName, 
      financialYearEnd: userData.financialYearEnd 
    });
  } catch (error) {
    console.error("Login error details:", { code: error.code, message: error.message, stack: error.stack });
    if (error.code === "auth/invalid-credential") {
      res.status(401).json({ error: "Invalid email or password" });
    } else {
      res.status(500).json({ error: "Something went wrong", code: error.code });
    }
  }
});

// Test route to confirm server is working
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test route working' });
});

// Management Control Table - Create
app.post("/management-control", async (req, res) => {
  console.log("Management control POST hit with body:", req.body);
  const { userId, managers, managementData } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!managers || !Array.isArray(managers)) {
      console.log("Invalid managers data");
      return res.status(400).json({ error: "Managers must be an array" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const managementControlData = {
      userId,
      managers: managers.map(manager => ({
        name: manager.name,
        siteLocation: manager.siteLocation || "",
        idNumber: manager.idNumber,
        position: manager.position,
        jobTitle: manager.jobTitle || "",
        race: manager.race || "",
        gender: manager.gender || "",
        isDisabled: manager.isDisabled || false,
        votingRights: Number(manager.votingRights) || 0,
        isExecutiveDirector: manager.isExecutiveDirector || false,
        isIndependentNonExecutive: manager.isIndependentNonExecutive || false
      })),
      managementData: {
        totalVotingRights: Number(managementData.totalVotingRights) || 0,
        blackVotingRights: Number(managementData.blackVotingRights) || 0,
        blackFemaleVotingRights: Number(managementData.blackFemaleVotingRights) || 0,
        disabledVotingRights: Number(managementData.disabledVotingRights) || 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "managementControl"), managementControlData);

    res.status(201).json({
      message: "Management control data saved successfully",
      id: docRef.id,
      ...managementControlData
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});

// Management Control - Retrieve
app.get("/management-control/:userId", async (req, res) => {  
  const { userId } = req.params;

  try {
    const managementRef = collection(db, "managementControl");
    const q = query(managementRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const managementRecords = [];
    querySnapshot.forEach((doc) => {
      managementRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (managementRecords.length === 0) {
      return res.status(404).json({ message: "No management control data found for this user" });
    }

    res.status(200).json({
      message: "Management control data retrieved successfully",
      data: managementRecords
    });
  } catch (error) {
    console.error("Management control retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Employment Equity - Create
app.post("/employment-equity", async (req, res) => {
  console.log("Employment equity POST hit with body:", req.body);
  const { userId, employees, employmentData } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!employees || !Array.isArray(employees)) {
      console.log("Invalid employees data");
      return res.status(400).json({ error: "Employees must be an array" });
    }
    if (!employmentData || typeof employmentData !== 'object') {
      console.log("Invalid employmentData");
      return res.status(400).json({ error: "Employment data must be an object" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const employmentEquityData = {
      userId,
      employees: employees.map(employee => ({
        name: employee.name || "",
        siteLocation: employee.siteLocation || "",
        idNumber: employee.idNumber || "",
        jobTitle: employee.jobTitle || "",
        race: employee.race || "",
        gender: employee.gender || "",
        isDisabled: Boolean(employee.isDisabled),
        descriptionOfDisability: employee.descriptionOfDisability || "",
        isForeign: Boolean(employee.isForeign),
        occupationalLevel: employee.occupationalLevel || "",
        grossMonthlySalary: Number(employee.grossMonthlySalary) || 0
      })),
      employmentData: {
        totalEmployees: Number(employmentData.totalEmployees) || 0,
        blackEmployees: Number(employmentData.blackEmployees) || 0,
        blackFemaleEmployees: Number(employmentData.blackFemaleEmployees) || 0,
        disabledEmployees: Number(employmentData.disabledEmployees) || 0,
        foreignEmployees: Number(employmentData.foreignEmployees) || 0,
        byOccupationalLevel: employmentData.byOccupationalLevel || {}
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "employmentEquity"), employmentEquityData);

    res.status(201).json({
      message: "Employment equity data saved successfully",
      id: docRef.id,
      ...employmentEquityData
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});

// Employment Equity - Retrieve
app.get("/employment-equity/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const employmentRef = collection(db, "employmentEquity");
    const q = query(employmentRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const employmentRecords = [];
    querySnapshot.forEach((doc) => {
      employmentRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (employmentRecords.length === 0) {
      return res.status(404).json({ message: "No employment equity data found for this user" });
    }

    res.status(200).json({
      message: "Employment equity data retrieved successfully",
      data: employmentRecords
    });
  } catch (error) {
    console.error("Employment equity retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Yes 4 Youth Initiative - Create
app.post("/yes4youth-initiative", async (req, res) => {
  console.log("Yes 4 Youth Initiative POST hit with body:", req.body);
  const { userId, participants, yesData } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!participants || !Array.isArray(participants)) {
      console.log("Invalid participants data");
      return res.status(400).json({ error: "Participants must be an array" });
    }
    if (!yesData || typeof yesData !== 'object') {
      console.log("Invalid yesData");
      return res.status(400).json({ error: "YES data must be an object" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const yes4YouthInitiativeData = {
      userId,
      participants: participants.map(participant => ({
        name: participant.name || "",
        siteLocation: participant.siteLocation || "",
        idNumber: participant.idNumber || "",
        jobTitle: participant.jobTitle || "",
        race: participant.race || "",
        gender: participant.gender || "",
        occupationalLevel: participant.occupationalLevel || "",
        hostEmployerYear: participant.hostEmployerYear || "",
        monthlyStipend: Number(participant.monthlyStipend) || 0,
        startDate: participant.startDate || "",
        endDate: participant.endDate || "",
        isCurrentYesEmployee: Boolean(participant.isCurrentYesEmployee),
        isCompletedYesAbsorbed: Boolean(participant.isCompletedYesAbsorbed)
      })),
      yesData: {
        totalParticipants: Number(yesData.totalParticipants) || 0,
        blackYouthParticipants: Number(yesData.blackYouthParticipants) || 0,
        totalStipendPaid: Number(yesData.totalStipendPaid) || 0,
        currentYesEmployees: Number(yesData.currentYesEmployees) || 0,
        completedYesAbsorbed: Number(yesData.completedYesAbsorbed) || 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "yes4YouthInitiative"), yes4YouthInitiativeData);

    res.status(201).json({
      message: "YES 4 Youth Initiative data saved successfully",
      id: docRef.id,
      ...yes4YouthInitiativeData
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});
// Yes 4 Youth Initiative - Retrieve
app.get("/yes4youth-initiative/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const yesRef = collection(db, "yes4YouthInitiative");
    const q = query(yesRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const yesRecords = [];
    querySnapshot.forEach((doc) => {
      yesRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (yesRecords.length === 0) {
      return res.status(404).json({ message: "No YES 4 Youth Initiative data found for this user" });
    }

    res.status(200).json({
      message: "YES 4 Youth Initiative data retrieved successfully",
      data: yesRecords
    });
  } catch (error) {
    console.error("YES 4 Youth Initiative retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Skills Development - Create
app.post("/skills-development", async (req, res) => {
  console.log("Skills Development POST hit with body:", req.body);
  const { userId, trainings, summary } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!trainings || !Array.isArray(trainings)) {
      console.log("Invalid trainings data");
      return res.status(400).json({ error: "Trainings must be an array" });
    }
    if (!summary || typeof summary !== "object") {
      console.log("Invalid summary data");
      return res.status(400).json({ error: "Summary must be an object" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const skillsDevelopmentData = {
      userId,
      trainings: trainings.map((training) => ({
        startDate: training.startDate || "",
        endDate: training.endDate || "",
        trainingCourse: training.trainingCourse || "",
        trainerProvider: training.trainerProvider || "",
        category: training.category || "",
        learnerName: training.learnerName || "",
        siteLocation: training.siteLocation || "",
        idNumber: training.idNumber || "",
        race: training.race || "",
        gender: training.gender || "",
        isDisabled: Boolean(training.isDisabled),
        coreCriticalSkills: training.coreCriticalSkills || "",
        totalDirectExpenditure: Number(training.totalDirectExpenditure) || 0,
        additionalExpenditure: Number(training.additionalExpenditure) || 0,
        costToCompanySalary: Number(training.costToCompanySalary) || 0,
        trainingDurationHours: Number(training.trainingDurationHours) || 0,
        numberOfParticipants: Number(training.numberOfParticipants) || 0,
        isUnemployedLearner: Boolean(training.isUnemployedLearner),
        isAbsorbedInternalTrainer: Boolean(training.isAbsorbedInternalTrainer),
      })),
      summary: {
        totalTrainings: Number(summary.totalTrainings) || 0,
        totalDirectExpenditure: Number(summary.totalDirectExpenditure) || 0,
        totalAdditionalExpenditure: Number(summary.totalAdditionalExpenditure) || 0,
        totalCostToCompanySalary: Number(summary.totalCostToCompanySalary) || 0,
        totalTrainingHours: Number(summary.totalTrainingHours) || 0,
        totalParticipants: Number(summary.totalParticipants) || 0,
        unemployedLearners: Number(summary.unemployedLearners) || 0,
        absorbedInternalTrainers: Number(summary.absorbedInternalTrainers) || 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "skillsDevelopment"), skillsDevelopmentData);

    res.status(201).json({
      message: "Skills development data saved successfully",
      id: docRef.id,
      ...skillsDevelopmentData,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});

// Skills Development - Retrieve
app.get("/skills-development/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const skillsRef = collection(db, "skillsDevelopment");
    const q = query(skillsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const skillsRecords = [];
    querySnapshot.forEach((doc) => {
      skillsRecords.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    if (skillsRecords.length === 0) {
      return res.status(404).json({ message: "No skills development data found for this user" });
    }

    res.status(200).json({
      message: "Skills development data retrieved successfully",
      data: skillsRecords,
    });
  } catch (error) {
    console.error("Skills development retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Ownership Details - Create
app.post("/ownership-details", async (req, res) => {
  console.log("Ownership Details POST hit with body:", req.body);
  const { userId, participants, entities, ownershipData } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!participants || !Array.isArray(participants)) {
      console.log("Invalid participants data");
      return res.status(400).json({ error: "Participants must be an array" });
    }
    if (!entities || !Array.isArray(entities)) {
      console.log("Invalid entities data");
      return res.status(400).json({ error: "Entities must be an array" });
    }
    if (!ownershipData || typeof ownershipData !== "object") {
      console.log("Invalid ownershipData");
      return res.status(400).json({ error: "Ownership data must be an object" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const ownershipDetailsData = {
      userId,
      participants: participants.map((participant) => ({
        name: participant.name || "",
        idNumber: participant.idNumber || "",
        race: participant.race || "",
        gender: participant.gender || "",
        isForeign: Boolean(participant.isForeign),
        isNewEntrant: Boolean(participant.isNewEntrant),
        designatedGroups: Boolean(participant.designatedGroups),
        isYouth: Boolean(participant.isYouth),
        isDisabled: Boolean(participant.isDisabled),
        isUnemployed: Boolean(participant.isUnemployed),
        isLivingInRuralAreas: Boolean(participant.isLivingInRuralAreas),
        isMilitaryVeteran: Boolean(participant.isMilitaryVeteran),
        economicInterest: Number(participant.economicInterest) || 0,
        votingRights: Number(participant.votingRights) || 0,
        outstandingDebt: Number(participant.outstandingDebt) || 0,
      })),
      entities: entities.map((entity) => ({
        tier: entity.tier || "",
        entityName: entity.entityName || "",
        ownershipInNextTier: Number(entity.ownershipInNextTier) || 0,
        modifiedFlowThroughApplied: Boolean(entity.modifiedFlowThroughApplied),
        totalBlackVotingRights: Number(entity.totalBlackVotingRights) || 0,
        blackWomenVotingRights: Number(entity.blackWomenVotingRights) || 0,
        totalBlackEconomicInterest: Number(entity.totalBlackEconomicInterest) || 0,
        blackWomenEconomicInterest: Number(entity.blackWomenEconomicInterest) || 0,
        newEntrants: Number(entity.newEntrants) || 0,
        designatedGroups: Number(entity.designatedGroups) || 0,
        youth: Number(entity.youth) || 0,
        disabled: Number(entity.disabled) || 0,
        unemployed: Number(entity.unemployed) || 0,
        livingInRuralAreas: Number(entity.livingInRuralAreas) || 0,
        militaryVeteran: Number(entity.militaryVeteran) || 0,
        esopBbos: Number(entity.esopBbos) || 0,
        coOps: Number(entity.coOps) || 0,
        outstandingDebtByBlackParticipants: Number(entity.outstandingDebtByBlackParticipants) || 0,
      })),
      ownershipData: {
        blackOwnershipPercentage: Number(ownershipData.blackOwnershipPercentage) || 0,
        blackFemaleOwnershipPercentage: Number(ownershipData.blackFemaleOwnershipPercentage) || 0,
        blackYouthOwnershipPercentage: Number(ownershipData.blackYouthOwnershipPercentage) || 0,
        blackDisabledOwnershipPercentage: Number(ownershipData.blackDisabledOwnershipPercentage) || 0,
        blackUnemployedOwnershipPercentage: Number(ownershipData.blackUnemployedOwnershipPercentage) || 0,
        blackRuralOwnershipPercentage: Number(ownershipData.blackRuralOwnershipPercentage) || 0,
        blackMilitaryVeteranOwnershipPercentage: Number(ownershipData.blackMilitaryVeteranOwnershipPercentage) || 0,
        votingRightsBlack: Number(ownershipData.votingRightsBlack) || 0,
        votingRightsBlackFemale: Number(ownershipData.votingRightsBlackFemale) || 0,
        economicInterestBlack: Number(ownershipData.economicInterestBlack) || 0,
        economicInterestBlackFemale: Number(ownershipData.economicInterestBlackFemale) || 0,
        ownershipFulfillment: Boolean(ownershipData.ownershipFulfillment),
        netValue: Number(ownershipData.netValue) || 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "ownershipDetails"), ownershipDetailsData);

    res.status(201).json({
      message: "Ownership details data saved successfully",
      id: docRef.id,
      ...ownershipDetailsData,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});

// Ownership Details - Retrieve
app.get("/ownership-details/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const ownershipRef = collection(db, "ownershipDetails");
    const q = query(ownershipRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const ownershipRecords = [];
    querySnapshot.forEach((doc) => {
      ownershipRecords.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    if (ownershipRecords.length === 0) {
      return res.status(404).json({ message: "No ownership details data found for this user" });
    }

    res.status(200).json({
      message: "Ownership details data retrieved successfully",
      data: ownershipRecords,
    });
  } catch (error) {
    console.error("Ownership details retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Enterprise Development - Create
app.post("/enterprise-development", async (req, res) => {
  console.log("Enterprise Development POST hit with body:", req.body);
  const { userId, beneficiaries, summary } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!beneficiaries || !Array.isArray(beneficiaries)) {
      console.log("Invalid beneficiaries data");
      return res.status(400).json({ error: "Beneficiaries must be an array" });
    }
    if (!summary || typeof summary !== "object") {
      console.log("Invalid summary data");
      return res.status(400).json({ error: "Summary must be an object" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const enterpriseDevelopmentData = {
      userId,
      beneficiaries: beneficiaries.map((beneficiary) => ({
        beneficiaryName: beneficiary.beneficiaryName || "",
        siteLocation: beneficiary.siteLocation || "",
        isSupplierDevelopmentBeneficiary: Boolean(beneficiary.isSupplierDevelopmentBeneficiary),
        blackOwnershipPercentage: Number(beneficiary.blackOwnershipPercentage) || 0,
        blackWomenOwnershipPercentage: Number(beneficiary.blackWomenOwnershipPercentage) || 0,
        beeStatusLevel: beneficiary.beeStatusLevel || "",
        contributionType: beneficiary.contributionType || "",
        contributionDescription: beneficiary.contributionDescription || "",
        dateOfContribution: beneficiary.dateOfContribution || "",
        paymentDate: beneficiary.paymentDate || "",
        contributionAmount: Number(beneficiary.contributionAmount) || 0,
      })),
      summary: {
        totalBeneficiaries: Number(summary.totalBeneficiaries) || 0,
        totalContributionAmount: Number(summary.totalContributionAmount) || 0,
        supplierDevelopmentBeneficiaries: Number(summary.supplierDevelopmentBeneficiaries) || 0,
        blackOwnedBeneficiaries: Number(summary.blackOwnedBeneficiaries) || 0,
        blackWomenOwnedBeneficiaries: Number(summary.blackWomenOwnedBeneficiaries) || 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "enterpriseDevelopment"), enterpriseDevelopmentData);

    res.status(201).json({
      message: "Enterprise development data saved successfully",
      id: docRef.id,
      ...enterpriseDevelopmentData,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});

// Enterprise Development - Retrieve
app.get("/enterprise-development/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const enterpriseRef = collection(db, "enterpriseDevelopment");
    const q = query(enterpriseRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const enterpriseRecords = [];
    querySnapshot.forEach((doc) => {
      enterpriseRecords.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    if (enterpriseRecords.length === 0) {
      return res.status(404).json({ message: "No enterprise development data found for this user" });
    }

    res.status(200).json({
      message: "Enterprise development data retrieved successfully",
      data: enterpriseRecords,
    });
  } catch (error) {
    console.error("Enterprise development retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// Socio-Economic Development - Create
app.post("/socio-economic-development", async (req, res) => {
  console.log("Socio-Economic Development POST hit with body:", req.body);
  const { userId, beneficiaries, summary } = req.body;

  try {
    if (!userId) {
      console.log("Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!beneficiaries || !Array.isArray(beneficiaries)) {
      console.log("Invalid beneficiaries data");
      return res.status(400).json({ error: "Beneficiaries must be an array" });
    }
    if (!summary || typeof summary !== "object") {
      console.log("Invalid summary data");
      return res.status(400).json({ error: "Summary must be an object" });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    const socioEconomicDevelopmentData = {
      userId,
      beneficiaries: beneficiaries.map((beneficiary) => ({
        beneficiaryName: beneficiary.beneficiaryName || "",
        siteLocation: beneficiary.siteLocation || "",
        blackParticipationPercentage: Number(beneficiary.blackParticipationPercentage) || 0,
        contributionType: beneficiary.contributionType || "",
        contributionDescription: beneficiary.contributionDescription || "",
        dateOfContribution: beneficiary.dateOfContribution || "",
        contributionAmount: Number(beneficiary.contributionAmount) || 0,
      })),
      summary: {
        totalBeneficiaries: Number(summary.totalBeneficiaries) || 0,
        totalContributionAmount: Number(summary.totalContributionAmount) || 0,
        averageBlackParticipation: Number(summary.averageBlackParticipation) || 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "socioEconomicDevelopment"), socioEconomicDevelopmentData);

    res.status(201).json({
      message: "Socio-economic development data saved successfully",
      id: docRef.id,
      ...socioEconomicDevelopmentData,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(400).json({ error: error.message, code: error.code });
  }
});

// Socio-Economic Development - Retrieve
app.get("/socio-economic-development/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const socioEconomicRef = collection(db, "socioEconomicDevelopment");
    const q = query(socioEconomicRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const socioEconomicRecords = [];
    querySnapshot.forEach((doc) => {
      socioEconomicRecords.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    if (socioEconomicRecords.length === 0) {
      return res.status(404).json({ message: "No socio-economic development data found for this user" });
    }

    res.status(200).json({
      message: "Socio-economic development data retrieved successfully",
      data: socioEconomicRecords,
    });
  } catch (error) {
    console.error("Socio-economic development retrieval error:", error.code, error.message);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// New /get-profile endpoint
app.get("/get-profile", async (req, res) => {
  const { uid } = req.query;
  console.log("Get profile request for UID:", uid);

  try {
    if (!uid) {
      console.log("Missing UID in request");
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      console.log("User not found for UID:", uid);
      return res.status(404).json({ error: "User not found" });
    }

    const data = userDoc.data();
    console.log("Profile data retrieved:", data);

    res.status(200).json({
      businessName: data.businessName || '',
      sector: data.sector || '',
      financialYearEnd: data.financialYearEnd || null,
      address: data.address || '',
      contactNumber: data.contactNumber || '',
      businessEmail: data.businessEmail || '',
    });
  } catch (error) {
    console.error("Get profile error:", error.code, error.message);
    res.status(500).json({ error: "Failed to fetch profile", code: error.code });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));