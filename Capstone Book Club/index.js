/* Import Packages */
/* --------------------------------------------------------------------------------- */
import express from "express";
import axios from "axios";
import bodyParser from "body-parser"
import pg from "pg";
import ejs from "ejs";
import env from "dotenv";
import bcrypt from "bcrypt";
import fs from "fs";

/* Declare App and Constants and Global Variables */
/* --------------------------------------------------------------------------------- */
const app = express(); 
const port = 3000; /* host port */
let userId = 1; /* temporary variable that keeps track of the user ID */
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
app.use(bodyParser.urlencoded({ extended: true }));

/* Utility Functions */
/* --------------------------------------------------------------------------------- */

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
    let friendData = await db.query("SELECT id,user_name,first_name,last_name,date_joined FROM users WHERE id= ANY($1)", /* gets all the listed fields from the entries that matches the ids in the input array */
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
    /* let user = await getUserInfo(userId);
    let username = user.user_name;
    let friends = await getFriends(userId);
    let friendIds = getFriendIds(friends);
    let friendBookFriends = await getFriendBookFriends(friendIds);

    res.render("index.ejs", {username:  username, friendBookFriends: friendBookFriends,friendBooks: friendBooks}); */ 
    res.redirect("/home");
})

app.get("/home", async (req,res) =>{
    res.render("home.ejs");
})

app.get("/login", async (req,res) =>{
    res.render("login.ejs");
})

app.post("/login", async (req,res) =>{
    const checkEmail = req.body["email"]; 
    const checkPassword = req.body["password"];
  try{
    let loginRequest = await db.query("SELECT * FROM users WHERE email = $1",
    [checkEmail]);
    let loginInfo = loginRequest.rows;
    console.log(loginInfo);
    bcrypt.compare(checkPassword,loginInfo[0].password, (err,result) => {
      if(err){
        console.log("There was an error:", err);
      } else {
        console.log(result);
        if(result){
          console.log("you got the password right");//succes action
        } else {
          res.send("The Password was Incorrect");//fail action
        }
      }
    });

  } catch(err) {
    console.log("There was an error with the login:",err);
  }
})

app.get("/register", async (req,res) =>{
    res.render("register.ejs");
})

app.post("/register", async (req,res) =>{
    const firstName = req.body["first_name"];
    const lastName = req.body["last_name"];
    const username = req.body["username"];
    const email = req.body["email"]; 
    const password = req.body["password"];
    const confirmPassword = req.body["password"];
  try{
    const checkResult = await db.query("SELECT * from users WHERE user_name=$1",
    ["username"]);
  
    if (checkResult.rows.length > 0){
      res.send("Email already exists, try loggin in.");
    } else {
        if(password == confirmPassword){
            bcrypt.hash(password, saltRounds, async (err,hash) => {
                if (err){
                  console.log("error:", err);
                } else {
                  db.query("INSERT INTO users (first_name, last_name, user_name, email, password) VALUES ($1, $2, $3, $4, $5)",
                  [firstName, lastName, username, email, hash]);
                }
              })
            } else {
            res.send("Confirmed Password and Password do not match.");
        }
    }
  } catch (err) {
    console.log(err);
  }
})

app.post("/books", async (req,res) => {
    let bookId = req.body["bookId"];
    let bookData = await getBookData(bookId);
    console.log(bookData);
    res.render("book_info.ejs", {title: bookData.title, author: bookData.author, coverArt: bookData.cover_art, summary: bookData.summary});
})

/* Listening */
/* --------------------------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})
