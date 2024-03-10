/* Import Packages */
/* --------------------------------------------------------------------------------- */
import express from "express";
import axios from "axios";
import bodyParser from "body-parser"
import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";
import multer from "multer"
import path from "path";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import fs from "fs";
import { profile } from "console";

/* Declare App and Constants and Global Variables */
/* --------------------------------------------------------------------------------- */
const app = express(); 
const port = 3000; /* host port */
const saltRounds = 12;
env.config();

/* Establish Connection To Database */
/* --------------------------------------------------------------------------------- */
const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });
  db.connect();

/* Middleware Mounting */
/* --------------------------------------------------------------------------------- */
app.use(express.static("public"));

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/data/uploads') // Specify the directory to save uploaded files
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 *60 *60 *24,
    },
})
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});




/* Utility Functions */
/* --------------------------------------------------------------------------------- */

/* gets current date*/
function getCurrentDate() {
  const today = new Date();
  const date = today.getFullYear()+'-'+(today.getMonth()+1).toString().padStart(2, '0')+'-'+today.getDate().toString().padStart(2, '0');
  return date;
}

/* pulls all the user data from the database from the user id*/
async function getUserInfo(user_id){
    let result = await db.query("SELECT * FROM users WHERE id=$1",
    [user_id]);
    let user = result.rows[0];
    return user;
}

/* pulls the username from the database from the user id*/
async function getUsername(user_id){ 
    let result = await db.query("SELECT username FROM users WHERE id=$1", 
    [user_id]);
    let user = result.rows[0];
    return user; 
}

/* gets all the book fields from the entry that matches the input id */
async function getBookData(book_id){
    let result = await db.query("SELECT * FROM books WHERE id=$1",
    [book_id]);
    let book = result.rows[0];
    return book;
}

async function getFriends(user_id){
    let result = await db.query("SELECT user2_id FROM friends WHERE user1_id=$1", /* gets all the friend ids from the entry that matches the input id */
    [user_id]);
    let friendIds = [];
    result.rows.forEach((friend) => {
        friendIds.push(friend.user2_id); /* populates the friend ids into an array rather than row data */
      });
    let friendData = await db.query("SELECT id,username,first_name,last_name,date_joined FROM users WHERE id= ANY($1)", /* gets all the listed fields from the entries that matches the ids in the input array */
    [friendIds]);
    return friendData.rows; /* returns the row data */
}

async function getFriendBooks(friendIds){
    let result = await db.query("SELECT book_id FROM user_books WHERE user_id= ANY($1) ORDER BY read_date DESC", /* gets all the book ids from the entries that matches the ids in the input array and orders them by read date descending */
    [friendIds]);
    let bookIds = [];
    result.rows.forEach((book) => {
        bookIds.push(book.book_id); /* populates the book ids into an array rather than row data */
      });
    let bookData = await db.query("SELECT * FROM books WHERE id = ANY($1)", /* gets all the book fields from the entries that matches the ids in the input array */
    [bookIds]);
    let bookDataRows = bookData.rows;
    let orderedBookData = [];
    bookIds.forEach((id)=>{ /* this for loop orders the book data the same way it was ordered when it was pulled from the database, maintaining the read date*/
        let found = bookDataRows.find((element) => element.id == id);
        orderedBookData.push(found);
    });
    return orderedBookData;
}

async function getFriendBookFriends(friendIds){
    let result = await db.query("SELECT user_id FROM user_books WHERE user_id= ANY($1) ORDER BY read_date DESC",
    [friendIds]);
    let friendsIds = [];
    result.rows.forEach((friend) => {
        friendsIds.push(friend.user_id);
      });
    let friendData = await db.query("SELECT * FROM users WHERE id = ANY($1)",
    [friendsIds]);
    let friendDataRows = friendData.rows;
    let orderedFriendData = [];
    friendIds.forEach((id)=>{
        let found = friendDataRows.find((element) => element.id == id);
        orderedFriendData.push(found);
    });
    return orderedFriendData;
}

function getFriendIds(friends){
    let friendIds = [];
    friends.forEach((friend) => {
        friendIds.push(friend.id);
    });
    return friendIds;
}

/* Routes */
/* --------------------------------------------------------------------------------- */
app.get("/", async (req,res) => {
    if(req.isAuthenticated()){
        res.render("index.ejs");
    } else {
        res.redirect("/home");
    }
})

app.get("/home", async (req,res) =>{
    res.render("home.ejs");
})

app.get('/login', (req, res) => {
  if(req.query.failed == "true"){
    res.render('login.ejs', { query: req.query, message: "password is incorrect" });
  } else {
    res.render('login.ejs', { query: req.query });
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      // Include the submitted username in the redirect
      return res.redirect(`/login?failed=true&username=${encodeURIComponent(req.body.username)}`);
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

app.get("/register", async (req,res) =>{
    res.render("register.ejs");
})

app.post("/register", async (req,res) =>{
    const firstName = req.body["first_name"];
    const lastName = req.body["last_name"];
    const username = req.body["username"];
    const email = req.body["email"];
    const profilePic = "/profile_images/default.jpg" 
    const dateJoined = getCurrentDate();
    const password = req.body["password"];
    const confirmPassword = req.body["confirm_password"];
  try{
    const checkResult = await db.query("SELECT * from users WHERE email=$1",
    [email]);
  
    if (checkResult.rows.length > 0){
      res.render("register.ejs", {formData: req.body, errorMessage: "This email is already in use! Try logging in."});
    } else {
        if(password == confirmPassword){
            bcrypt.hash(password, saltRounds, async (err,hash) => {
                if (err){
                  console.log("error:", err);
                } else {
                  const result = await db.query("INSERT INTO users (first_name, last_name, username, email, profile_pic, date_joined, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
                  [firstName, lastName, username, email, profilePic, dateJoined, hash]);
                  const user = result.rows[0];
                  req.login(user, (err) =>{
                    console.log(err);
                    res.redirect("/");
                  });
                }
              })
            } else {
              res.render("register.ejs", {formData: req.body, errorMessage: "Confirmed Password and Password do not match."});
        }
    }
  } catch (err) {
    console.log(err);
  }
})

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/home",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    } 
    res.redirect("/");
  });
});

app.post("/books", async (req,res) => {
    let bookId = req.body["bookId"];
    let bookData = await getBookData(bookId);
    console.log(bookData);
    res.render("book_info.ejs", {title: bookData.title, author: bookData.author, coverArt: bookData.cover_art, summary: bookData.summary});
})

app.get("/profile", async (req,res) => {
  res.render("profile.ejs");
})

app.post('/profile-update', upload.single('file'), async (req, res) => {
  // The image is available in req.file.buffer
   const result = await db.query("SELECT profile_pic FROM users WHERE email = $1", [
    req.body.email
  ]);
  const oldPath = result.rows[0].profile_pic;

  console.log(oldPath);

  const newPath = req.file.path.substring(7);
  if(oldPath == "/profile_images/default.jpg" ){
    db.query("UPDATE users SET profile_pic=$1 WHERE email=$2", [
      newPath,req.body.email
    ]);
  } else {
    fs.unlink("public/"+oldPath, (err) => {
      if (err) {
        console.error('Failed to delete file:', err);
      }
      db.query("UPDATE users SET profile_pic=$1 WHERE email=$2", [
        newPath,req.body.email
      ]);
    });
  }
  req.user.profile_pic = newPath;
  res.render("profile.ejs");
});

/* Strategies */
/* --------------------------------------------------------------------------------- */

/* Local Strategy */
/* --------------------------------------------------------------------------------- */
passport.use(
  "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );

  
/* Google Strategy */
/* --------------------------------------------------------------------------------- */
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/home",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          console.log(profile);
          const result = await db.query("SELECT * FROM users WHERE email = $1", [
            profile.email,
          ]);
          if (result.rows.length === 0) {
            const newUser = await db.query(
              "INSERT INTO users (email, password) VALUES ($1, $2)",
              [profile.email, "google"]
            );
            return cb(null, newUser.rows[0]);
          } else {
            return cb(null, result.rows[0]);
          }
        } catch (err) {
          return cb(err);
        }
      }
    )
  );
  
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

/* Listening */
/* --------------------------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})
