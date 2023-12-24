/* import packages */
/* --------------------------------------------------------------------------------- */
import express from "express";
import axios from "axios";
import bodyParser from "body-parser"
import ejs from "ejs"

/* declare app and constants */
/* --------------------------------------------------------------------------------- */
const app = express();
const port = 3000;

/* middlewares */
/* --------------------------------------------------------------------------------- */
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

/* post objects constructor */
/* --------------------------------------------------------------------------------- */
function sampleObj (param1, param2){ /* obj name, parameter entries */
    this.param1 = param1;
    this.param2 = param2; 
}

/* Routes */
/* --------------------------------------------------------------------------------- */
app.get("/", (req,res) => {
    res.render("index.ejs"); 
})

/* Listening */
/* --------------------------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})