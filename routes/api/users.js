const express = require('express');
const bcrypt = require("bcryptjs");
const router = express.Router();
const keys = require("../../config/key")
const User = require('../../models/User');
var jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
var nodemailer = require('nodemailer');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function getRandomPwd(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// @route   get api/users/test
// @desc    test User
// @access  Public
router.get('/test',(req,res) => {return res.json({msg:"this is test"})});

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post('/signup', async (req,res) => {
    User.findOne({ useremail: req.body.useremail }).then(user => {
        if (user) {
          res.status(400).json("Email Already Exist!");
        } else {

          // Generate Verification Code
          const veri_code = getRandomInt(1000, 9999);
            const newUser = new User({
              useremail: req.body.useremail,
              password: req.body.password,
              phonenumber: req.body.phonenumber,
              veri_code: veri_code,
            });
    
            if(req.body.checked) {
            // Send Verification Code via Email
              var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'juri.god0403@gmail.com',
                  pass: 'pfbfiriqcxsfthsx'
                }
              });

              var mailOptions = {
                from: 'zhak20220726@gmail.com',
                to: req.body.useremail,
                subject: 'BlockReward Verification Code',
                html: '<h1>Welcome</h1><p>'+ veri_code + '</p>'
              };

              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            } else {
              const accountSid = process.env.TWILIO_ACCOUNT_SID;
              const authToken = process.env.TWILIO_AUTH_TOKEN;
              const client = require('twilio')(accountSid, authToken);

              client.messages
                .create({
                  body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
                  from: '+15017122661',
                  to: req.body.phonenumber,
                })
                .then(message => console.log(message.sid));
            }

            // Hash password before saving in database
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                  .save()
                  .then(user => res.json(user))
                  .catch(err => console.log(err));
              });
            });
        }
    });
})

// @route   POST api/users
// @desc    Login User
// @access  Public
router.post('/login', async (req,res) => {
    
    password = req.body.password
    phonenumber = req.body.useremail
    if(! phonenumber.includes("@")){
      User.findOne({ phonenumber: req.body.useremail }).then(user => {
        // Check if user exists
        if (!user) {
          return res.status(400).json("Email not found");
        }
        
        // Check if user account is accepted
        if (user.status == "Pending") {
          return res.status(400).json("Account is not verified");
        }

        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
          if (isMatch) {

            // User matched
            // Create JWT Payload
            const payload = {
              id: user.id,
              phonenumber: req.body.useremail
            };
    
            // Sign token
            jwt.sign(
              payload,
              keys.secretOrKey,
              {
                expiresIn: 31556926 // 1 year in seconds
              },
              (err, token) => {
                res.json({
                  success: true,
                  token: token
                });
              }
            );
          } else {
            return res
              .status(400)
              .json("Password incorrect");
          }
        });
      })
    } else {
      User.findOne({ useremail: req.body.useremail }).then(user => {
        // Check if user exists
        if (!user) {
          return res.status(400).json("Email not found");
        }
        
        // Check if user account is accepted
        if (user.status == "Pending") {
          return res.status(400).json("Account is not verified");
        }

        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
          if (isMatch) {

            // User matched
            // Create JWT Payload
            const payload = {
              id: user.id,
              useremail: user.useremail
            };
    
            // Sign token
            jwt.sign(
              payload,
               keys.secretOrKey,
              {
                expiresIn: 31556926 // 1 year in seconds
              },
              (err, token) => {
                res.json({
                  success: true,
                  token: token
                });
              }
            );
          } else {
            return res
              .status(400)
              .json("Password incorrect");
          }
        });
      })
    }
    
})

// @route   POST api/users
// @desc    Reset Password
// @access  Public
router.post('/forgetpassword', async (req,res) => {
  if(req.body.checked){
    User.findOne({ useremail: req.body.useremail }).then(user => {
      if (user) {
        
        const myquery = { useremail: req.body.useremail };
        const newPwdLength = getRandomInt(8, 20);
        const newPassword = getRandomPwd(newPwdLength, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        // Transfer Password via Email
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'juri.god0403@gmail.com',
            pass: 'pfbfiriqcxsfthsx'
          }
        });

        var mailOptions = {
          from: 'zhak20220726@gmail.com',
          to: req.body.useremail,
          subject: 'BlockReward Verification Code',
          html: '<h1>Welcome</h1><p>'+ newPassword + '</p>'
        };
        
        console.log(newPassword);

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) throw err;
            const newvalue = { password : hash };
            User.updateOne(myquery, newvalue, function(err, doc) {
              if (err) throw err;
              res.json("Success");
            });
          });
        });
      } else {
        res.status(400).json("Email Does Not Exist!");
      }
    })
  } else {
    User.findOne({ phonenumber: req.body.phonenumber }).then(user => {
      if (user) {
        
        const myquery = { phonenumber: req.body.phonenumber };
        const newPwdLength = getRandomInt(8, 20);
        const newPassword = getRandomPwd(newPwdLength, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
       

        // Send SMS to Phone
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        client.messages
          .create({
            body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
            from: '+15017122661',
            to: req.body.phonenumber,
          })
                

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) throw err;
            const newvalue = { password : hash };
            User.updateOne(myquery, newvalue, function(err, doc) {
              if (err) throw err;
              res.json("Success");
            });
          });
        });
      } else {
        res.status(400).json("Phonenumber Does Not Exist!");
      }
    })
  }
})

// @route   POST api/users
// @desc    Verify Account
// @access  Public
router.post('/verify-account', async (req, res) => {
  User.findOne({ useremail: req.body.useremail, veri_code: req.body.veri_code }).then(user => {
    if(user) {
      const myquery = { useremail: req.body.useremail };
      const newvalue = { status: "Accepted" };
      User.updateOne(myquery, newvalue, function(err, doc) {
        if (err) throw err;
        res.json(user);
      })
    } else {
      res.status(400).json("Wrong Verification Code");
    }
  })
})

module.exports = router;