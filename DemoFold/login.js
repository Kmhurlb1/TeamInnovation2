// Creating your own Web server with nodejs and conencting to mySQL database
// use this template for your Project Phase 2

var http = require('http');     
var fs = require('fs');         
var url = require('url');       
var path = require('path');    
//const mysql = require('mysql');
const session = require('express-session');
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { format } = require('node:path/win32');

var fileExtensions = {
     ".html":    "text/html",
     ".css":     "text/css",
     ".js":      "text/javascript",
     ".jpeg":    "image/jpeg",
     ".jpg":     "image/jpeg",
     ".png":     "image/png"
 };
 


const app = express();


// Connect to the database
const connection = mysql.createConnection({
  host: '107.180.1.16',
  port:'3306',
  user: 'springa2023team1',
  password: 'springa2023team1',
  database: 'springa2023team1'
});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');

// Parse incoming request bodies as JSON
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// Handle GET request to root URL
app.get('/', function (req, res) {
	// Render login template
	res.sendFile(path.join(__dirname + '/login.html'));
});





// Handle login requests
app.post('/auth', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // Look up the user in the database
  if (email && password) {
    // Execute SQL query that'll select the account from the database based on the specified Email and password
    connection.query('SELECT * FROM accounts_demo WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;
      // If the account exists
      if (results.length > 0) {
        // Authenticate the user
        req.session.loggedin = true;
        req.session.email = email;
        // Redirect to home page

        // Get the role of the user from the results 
        let role = results[0].role;

        //data variables from datbase
        let fname = results[0].fname;
        let score = results[0].score;

        // Check if the user is an admin ------------
        if (role === 'admin') {
          // Redirect the admin to the admin dashboard

          
          res.render('admin_dashboard.ejs', { email: req.session.email, 
          fname: fname, score: score });
          
          app.get('/add_user.html', function (req, res) {
            // Render add_user.html template
            res.sendFile(path.join(__dirname + '/add_user.html'));
          });

          //Admin can update user profile
          // Admin can add a new user

          app.post('/add_user', function(req, res) {
          // Get the new user information from the form
          const newUser = {
            email: req.body.email,
            password: req.body.password,
            fname: req.body.fname,
            lname: req.body.lname,
            role: req.body.role
          };

            // Insert the new user into the database
            connection.query('INSERT INTO accounts_demo SET ?', newUser, function(error, results, fields) {
              if (error) throw error;
                console.log('New user ' +fname + ' was added successfully');
              });

            res.redirect('/admin_dashboard');
          });

          //Removing A User / Deny Access
          app.get('/remove_user.html', function (req, res) {
            res.sendFile(path.join(__dirname + '/remove_user.html'));
          });
          
          app.post('/remove_user', function(req, res) {
            const email = req.body.email;
            // Delete the user from the database using the email
            connection.query('DELETE FROM accounts_demo WHERE email = ?', [email], function(error, results, fields) {
              if (error) throw error;
              console.log('User with email ' + email + ' was removed successfully');
            });
            res.redirect('/admin_dashboard');
          });



        } else {
          //If not an admin
          // Redirect the regular user to the regular user dashboard


          res.render('dashboard.ejs', { email: req.session.email,
             fname: fname, score : score });





        }
      } else {
        res.send('Incorrect Email and/or Password!');
      }
      res.end();
    });
  }
});



function generatePassword() {
  // Generate a random password
  var password = Math.random().toString(36).slice(-8);
  console.log("Generated password: " + password);
  return password;
}



//Reset Password
app.post('/reset_password', (req, res) => {
  // Get the email of the user from the request
  let email = req.body.email;

  // Check if the email exists in the database
  connection.query(`SELECT * FROM accounts_demo WHERE email = ?`, [email], (error, results) => {
    if (error) throw error;

    // If the email exists
    if (results.length > 0) {
      // Generate a new password
      let newPassword = generatePassword();


      

      // Hash the new password
      // If password hash is enabled replace ln121 newPassword with hash
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) throw err;

        // Update the password in the database
        connection.query(`UPDATE accounts_demo SET password = ? WHERE email = ?`, [newPassword, email], (error, results) => {
          if (error) throw error;

          // Send the new password to the user via email
          //sendPasswordResetEmail(email, newPassword);

          // Send a success response
          res.send('Password reset successful. Please check your email for the new password.: Your new password is ' + newPassword);
        });
      });
    } else {
      // If the email does not exist, send an error message
      res.send('The email does not exist in the database.');
    }
  });
});

/*
//Forwarding
// http://localhost:8080/dashboard
app.get('/dashboard.html', function(req, res) {
	// If the user is loggedin
	if (req.session.loggedin) {
		// Output Email
		res.send('Welcome back, ' + req.session.email + '!');
	} else {
		// Not logged in
		res.send('Please login to view this page!');
	}
	res.end();
});
*/


app.set('view engine', 'ejs');



app.get('/dashboard.html', function (req, res) {
  // Check if the user is logged in
  if (req.session.loggedin) {
    // Render the dashboard template and pass in the email of the logged-in user
    res.render('dashboard.ejs', { email: req.session.email });
  } else {
    // If the user is not logged in, redirect them to the login page
    res.redirect('/');
  }
});


// Start the server
app.listen(8080, () => {
  console.log('Listening on port 8080. Its listening on http://127.0.0.1:8080 or http://localhost:8080');
});
