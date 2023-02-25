// Creating your own Web server with nodejs and conencting to mySQL database
// use this template for your Project Phase 2

var http = require('http');     
var fs = require('fs');         
var url = require('url');       
var path = require('path');    
//const mysql = require('mysql');
const session = require('express-session');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { format } = require('node:path/win32');
const bodyParser = require('body-parser');

var fileExtensions = {
     ".html":    "text/html",
     ".css":     "text/css",
     ".js":      "text/javascript",
     ".jpeg":    "image/jpeg",
     ".jpg":     "image/jpeg",
     ".png":     "image/png"
 };
 


app.use(bodyParser.json());

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

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
  let user_id;
  let user_dept;
  // Look up the user in the database
  if (email && password) {
    // Execute SQL query that'll select the account from the database based on the specified Email and password
    connection.query('SELECT * FROM accounts WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;
      // If the account exists
      if (results.length > 0) {
        // Authenticate the user
        req.session.loggedin = true;
        req.session.email = email;
        req.session.fname = results[0].first_name; // set the fname value -------- Try out 2/15
        req.session.user_dept = results[0].user_dept;
        // Redirect to home page

        // Get the role of the user from the results 
        let role = results[0].user_type;

        //data variables from datbase
        //let fname = results[0].fname;
        let score = results[0].score;


        // Check if the user is an admin ------------
        if (role === 'A') {
          // Redirect the admin to the admin dashboard

          
          res.render('admin_dash.ejs', { email: req.session.email, 
          fname: req.session.fname, score: score });

          
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
            first_name: req.body.fname,
            last_name: req.body.lname,
            user_type: req.body.role,
            user_dept: req.body.dept
          };

            // Insert the new user into the database
            connection.query('INSERT INTO accounts SET ?', newUser, function(error, results, fields) {
              if (error) throw error;
                console.log('New user ' + req.session.fname + ' was added successfully');
              });

            res.render('admin_dash.ejs', { email: req.session.email, 
              fname: req.session.fname, score: score });
          });




          //Removing A User / Deny Access
          app.get('/remove_user.html', function (req, res) {
            res.sendFile(path.join(__dirname + '/remove_user.html'));
          });
          
          app.post('/remove_user', function(req, res) {
            const email = req.body.email;
            // Delete the user from the database using the email
            connection.query('DELETE FROM accounts WHERE email = ?', [email], function(error, results, fields) {
              if (error) throw error;
              console.log('User with email ' + email + ' was removed successfully');
            });
            res.render('admin_dash.ejs', { email: req.session.email, 
              fname: req.session.fname, score: score });
          });



          //
          app.get('/adminDate.ejs', function(req, res) {
            res.render('adminDate.ejs', );
          });
          

          app.post('/submit-form', function(req, res){

            const dated = req.body.date;
            const dept = req.body.department
            

            connection.query('ALTER TABLE employee_applications ADD COLUMN due_date DATE DEFAULT ? (SELECT user_dept FROM accounts WHERE user_dept = ?)', [dated, dept], function(error, results, fields) {
            
              if (error) throw error;
              console.log(DeptUp);
            });

          });







        } else {
          //If not an admin
          // Redirect the regular user to the regular user dashboard

          let user_id = 0;
          connection.query('SELECT user_id from accounts where email = ?', [email], function(error, results, fields) {
            if (error) throw error;
            req.session.user_id = results[0].user_id;
            console.log(req.session.user_id);
            let user_id = req.session.user_id;
            global.user_id = results[0].user_id;
            console.log(user_id);

              let user_dept = 0;
              connection.query('SELECT user_dept from accounts where email = ?', [email], function (error, results, fields) {
                  if (error) throw error;
                  req.session.user_dept = results[0].user_dept;
                  console.log(req.session.user_dept);
                  let user_dept = req.session.user_dept;
                  global.user_dept = results[0].user_dept;
                  console.log(user_dept);
              });

            
          });

  
          res.render('dashboard.ejs', { email: req.session.email,
             fname: req.session.fname, score : score });


        }
      } else {
        res.send('Incorrect Email and/or Password!');
      }
      res.end();
    });
  }
});

//LogOut Function
app.get('/logout', function(req, res) {
  // Destroy the session
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});



app.post('/logout', (req, res) => {
  // Destroy the user's session
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    // Redirect to the login page
    res.redirect('/login.html');
  });
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
  connection.query(`SELECT * FROM accounts WHERE email = ?`, [email], (error, results) => {
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
        connection.query(`UPDATE accounts SET password = ? WHERE email = ?`, [newPassword, email], (error, results) => {
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



app.post('/surveys', (req, res) => {
  //let user_id = req.session.user_id; // retrieve the user's ID from the session data
    let question1 = req.body.question1 || null;
    let question2 = req.body.question2 || null;
    let question3 = req.body.question3 || null;
    let question4 = req.body.question4 || null;
    let question5 = req.body.question5 || null;
    let question6 = parseInt(req.body.q6) || null;
    let question7 = parseInt(req.body.q7) || null;
    let question8 = parseInt(req.body.q8) || null;
    let question9 = parseInt(req.body.q9) || null;
    let question10 = parseInt(req.body.q10) || null;
    let question11 = req.body.question11 || null;
    let question12 = req.body.question12 || null;
    let question13 = req.body.question13 || null;
    let question14 = req.body.question14 || null;
    let question15 = req.body.question15 || null;

  const date = new Date();
  const dateString = date.toLocaleDateString();
  console.log(question2);
    connection.query('INSERT INTO survey_test (user_id, date_sent, question1, question2, question3, question4, question5, question6, question7, question8, question9, question10, question11, question12, question13, question14, question15) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [user_id, dateString, question1, question2, question3, question4, question5, question6, question7, question8, question9, question10, question11, question12, question13, question14, question15], function(error, results, fields) {
    if (error) throw error;
    // Redirect to a thank-you page
    res.send(`Thank you for completing the survey!`);
  });

});

/*
// POST route for handling form submission
app.post('/surveys', (req, res) => {
    const surveyResponses = {
        name: req.body.name,
        email: req.body.email,
        question1: req.body.question1 === 'yes' ? true : false,
        question2: req.body.question2 === 'yes' ? true : false,
        question3: req.body.question3 === 'yes' ? true : false,
        question4: req.body.question4 === 'yes' ? true : false,
        question5: req.body.question5 === 'yes' ? true : false,
        question6: req.body.question6,
        question7: req.body.question7,
        question8: req.body.question8,
        question9: req.body.question9,
        question10: req.body.question10,
        question11: req.body.question11,
        question12: req.body.question12,
        question13: req.body.question13,
        question14: req.body.question14,
        question15: req.body.question15,

        // add additional survey questions here
    };

    // check if all required fields are filled out
    if (   surveyResponses.question1 !== undefined && surveyResponses.question2 !== undefined
        && surveyResponses.question3 !== undefined && surveyResponses.question4 !== undefined
        && surveyResponses.question5 !== undefined
        && surveyResponses.question6 !== undefined && surveyResponses.question7 !== undefined
        && surveyResponses.question8 !== undefined && surveyResponses.question9 !== undefined
        && surveyResponses.question10 !== undefined && surveyResponses.question11
        && surveyResponses.question12 && surveyResponses.question13
        && surveyResponses.question14 && surveyResponses.question15) {
        // Process the form data here and send a response
        res.send(`Thank you for completing the survey, ${surveyResponses.name}!`);
    } else {
        // if not all required fields are filled out, send an error response
        res.status(400).send('Please fill out all required fields.');
    }
});
*/
  


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


//added code to render Home, Points, and Surveys tabs from dashboard. 
app.get('/admin_dashboard.ejs', function (req, res) {
    res.render('admin_dashboard.ejs', { fname: req.session.fname, score: '10' });
});

app.get('/dashboard.ejs', function (req, res) {
    res.render('dashboard.ejs', { fname: req.session.fname , score: '10'});
});

app.get('/points.ejs', function (req, res) {
    res.render('points.ejs', { fname: req.session.fname, score: '10' });
});

app.get('/goals.ejs', function (req, res) {
  res.render('goals.ejs', { fname: req.session.fname, score: '10' });
});

app.get('/adManage_survey.ejs', function (req, res) {
  res.render('adManage_survey.ejs', { fname: req.session.fname, score: '10' });
});

function getDates() {
    var dates = [];
    var currentDate = new Date();
    for (var i = 0; i < 7; i++) {
        var date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);
        dates.push(date);
    }
    return dates;
}




app.get('/calendar.ejs', function (req, res) {
    connection.query('SELECT start_date, finish_date, goal FROM goals', function (error, results, fields) {
        if (error) throw error;
        const goals = results.map(row => ({
            goal: row.goal,
            start_date: new Date(row.start_date),
            finish_date: new Date(row.finish_date)
        }));
        const months = [
            { name: 'January', days: 31 },
            { name: 'February', days: 28 },
            { name: 'March', days: 31 },
            { name: 'April', days: 30 },
            { name: 'May', days: 31 },
            { name: 'June', days: 30 },
            { name: 'July', days: 31 },
            { name: 'August', days: 31 },
            { name: 'September', days: 30 },
            { name: 'October', days: 31 },
            { name: 'November', days: 30 },
            { name: 'December', days: 31 }
        ];
        const dates = getDates();
        res.render('calendar.ejs', { dates, goals, months });
    });
});







app.get('/survey.ejs', (req, res) => {
    const surveyDept = req.session.user_dept;
    const query = `SELECT * FROM survey_templates WHERE survey_dept = '${surveyDept}'`;

    connection.query(query, (err, results) => {
        if (err) throw err;
        console.log(results); // <-- Add this line
        const surveyData = results[0];
        console.log(surveyData); // <-- Add this line
        res.render('survey.ejs', { surveyData });
    });
});






// Start the server
app.listen(8080, () => {
  console.log('Listening on port 8080. Its listening on http://127.0.0.1:8080 or http://localhost:8080');
});


// Time control so the server does not auto shut off - If making login.js file change the server needs to be stopped(ctrl+c)... 
//and the document needs to be saved in order for the changes to show up 
for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    connection.query('SELECT user_id FROM accounts',)
    console.log('.');
  }, i * 30000); //30000 = 30 Seconds
}