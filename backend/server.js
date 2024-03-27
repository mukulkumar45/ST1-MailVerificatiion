const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bcrypt = require('bcrypt');
const Student = require('./models/Student.js');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const nodemailer = require('nodemailer');

app.use(cors());
// const fs = require('fs');
mongoose.connect('mongodb://127.0.0.1:27017/StudentsApi');

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use(session({
    secret: 'Ye Project chori ka hai',
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge:1000 * 60 * 15
    }
}));


// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mukulkum0121@gmail.com',
      pass: 'nbjhkzbmowvbmkrw'
    }
});

// Send Verification Email
const BASE_URL = 'http://localhost:3000';
function sendVerificationEmail(email, verificationToken) {
    const verificationLink = `${BASE_URL}/verify?email=${email}&token=${verificationToken}`;
  
    const mailOptions = {
      from: 'mukulkum0121@gmail.com',
      to: email,
      subject: 'Account Verification',
      html: `Click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a>
      <p>Or Enter OTP ${verificationToken}</p>
      `
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
}

app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/register',(req,res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
})

app.get("/",(req,res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
})

app.get('/login',(req,res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
})

app.get('/verified',(req,res) => {
    res.sendFile(path.join(__dirname, '../frontend/verify.html'));
})

app.get('/stu',(req,res) => {
    const loggedIn = req.session.loggedIn;
    if(loggedIn) {
        const filepath = path.join(__dirname,'../frontend/students.html');
        // let htmlFile = fs.readFileSync(filepath, 'utf8');
        // htmlFile = htmlFile.replace('<<USERNAME>>', username);
        res.sendFile(filepath);
    }else{
        res.redirect('/login');
    }  
})

var apnaOTP = null;
app.post('/register' ,async (req,res) => {
    const user = req.body;
    if(!user.password || !user.username){
        res.send("Username and Password are required");
        return;
    }
    if(user.password.length < 4) {
        res.send("Password Length must be greator than or equal to 4");
        return;
    }
    if(!user.email) {
        res.send("Email Required");
        return;
    }

    const verificationToken = generateRandomToken();
    apnaOTP = verificationToken;

    const newUser = new Student(user);
    const saltRounds = 10;
    const hashedPwd = await bcrypt.hash(newUser.password, saltRounds);
    newUser.password = hashedPwd;
    newUser.verificationToken = verificationToken;
    try {
        await newUser.save();
        sendVerificationEmail(user.email, verificationToken);
        res.send(
            `<script> alert("Email Sent, Please Verify"); window.location.href = "/verified"; </script>`
          );
    } catch (err) {
        console.error(err);
        res.status(500).send("Couldn't Register Account");
    }
})

function generateRandomToken() {
    return Math.floor((Math.random()*9000)+1000);
}

app.post('/login',async (req,res) => {
    const loginData = req.body;
    
    const account = (await Student.find().where('username').equals(loginData.username))[0];
    if(!account) {
        res.send("User Name not found");
        return;
    }
    if(!account.isVerified) {
        res.send("Email Unverified");
        return;
    }
    const match = await bcrypt.compare(loginData.password, account.password);
    if(!match) {
        return res.send("Incorrent Password");
    }
    req.session.user = account.user;
    req.session.profile = account.username
    req.session.loggedIn = true;
    res.redirect('/stu');
})

/**************************/
app.post('/verify-otp',async (req,res) => {
    const userOtp = req.body.otp;

    if(userOtp === apnaOTP) {
        try {
            const user = await Student.findOneAndUpdate(
                {verificationToken: apnaOTP},
                {$set: {isVerified: true}},
                {new: true}
            );

            if(user) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
              }
        }
        catch(err) {
            console.log(err);
            res.json({success: false});
        }
        
    } else{
        res.json({success: false});
    }
});



// Verification
app.get('/verify', async (req, res) => {
    const { email, token } = req.query;
    
    try {
        // Find the user in the database using the Student model
        const user = await Student.findOne({ email, verificationToken: token });
        
        if (user) {
            // Mark the user as verified
            user.isVerified = true;
            await user.save();
            res.send(
                `<script> alert("Verification Successfull"); window.location.href = "/login"; </script>`
              );
        } else {
            res.status(400).send('Invalid verification token or email.');
        }
    } catch (error) {
        console.error('Error during verification:', error);
        res.status(500).send('Internal server error.');
    }
}); 

app.get('/studentsDetails', async (req,res) => {
    try {
        const students = await Student.find({}, 'username');
        res.json(students);
    }catch (err) {
        console.log(err);
        res.status(500).json({error : 'Internal Server Error'});
    }
});

app.get('/studentsDetails/:username', async (req,res) => {
    const requiredUser = req.params.username;
    try {
        const student = await Student.findOne({username: requiredUser});
        if(!student){
            return res.status(404).send("No Data found for entered username");
        }
        res.json(student);
    }
    catch(err) {
        console.log(err);
        res.status(400).json({error : "Internal Server Error"});
    }
} )
app.delete('/studentsDetails/:id', async (req,res) => {
    const id = req.params.id;
    try{
        await Student.findByIdAndDelete(id);
        res.status(200).send("Student Deleted");
    }catch(err) {
        console.log(err);
        res.status(400).send("Couldn't Delete Student");
    }
})

app.get('/logout', (req,res) => {
    req.session.loggedIn = false;
    res.redirect('/login');
})

app.put('/studentsDetails/:id/:input', async (req,res) => {
    const id = req.params.id;
    const newusername = req.params.input;
    try {
        const updateStudent = await Student.findByIdAndUpdate(
            id,
            {username: newusername},
        );
        res.status(200).send("Student Updated");
        if(!updateStudent){
            res.status(404).send("Studnet not found");
        }
    }catch(err) {
        console.log(err);
        res.status(400).send("Update Unsuccessfull");
    }
})

app.listen(3000 ,() => {
    console.log("Server Started At: http://localhost:3000");
})