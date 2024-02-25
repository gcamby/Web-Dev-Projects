/* Import Packages */
/* --------------------------------------------------------------------------------- */
import express from "express"; /* Hosting the express server */
import axios from "axios"; /* Using APIs */
import bodyParser from "body-parser"; /* Form Parsing */
import pg from "pg"; /* PostgreSQL database */
import env from "dotenv"; /* Environment Variables */
import bcrypt from "bcrypt"; /* Encryption and hashing */
import session from "express-session"; /* Session Management */
import passport from "passport"; /* Session Management */
import { Strategy } from "passport-local"; /* Session Management */

/* Configure dotenv file */
/* --------------------------------------------------------------------------------- */
env.config();

/* Declare App and Global Constants */
/* --------------------------------------------------------------------------------- */
const app = express();
const port = 3000;
const saltRounds = 12;

/* Database Linkup */
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
app.use(session({
    secret: "TOPSECRETWORD",
    resave: false, 
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 *60 *60 *24
    }
  }))
app.use(passport.initialize());
app.use(passport.session());

/* Object Constructors */
/* --------------------------------------------------------------------------------- */

/* Constructor template*/
function SampleObj (param1, param2){ /* obj name, parameter entries */
    this.param1 = param1;
    this.param2 = param2; 
}

/* Utility Functions */
/* --------------------------------------------------------------------------------- */

/* Function template*/
function sampleUtility (param1, param2){ 
}

/* Routes */
/* --------------------------------------------------------------------------------- */
app.get("/", (req,res) => {
    res.render("index.ejs"); 
})

app.post("/login", passport.authenticate("local", {
  successRedirect: "/secrets",
  failureRedirect: "/login"
}));

/* Passport Strategy */
/* --------------------------------------------------------------------------------- */
passport.use(
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
  
  passport.serializeUser((user, cb) =>{
    cb(null,user);
  });
  
  passport.deserializeUser((user, cb) =>{
    cb(null,user);
  });

/* Listening... */
/* --------------------------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})