/* npm modules */
/* --------------------------------------------------------------------------------- */
import express from "express";
import bodyParser from "body-parser"

/* declare constants */
/* --------------------------------------------------------------------------------- */
const app = express();
const port = 3000;

/* middlewares */
/* --------------------------------------------------------------------------------- */
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

/* post objcects constructor */
/* --------------------------------------------------------------------------------- */
function PostObj (title, bodyText){
    this.title = title; /* give post a title component */
    this.bodyText = bodyText; /* give post a body text component */
}

var posts = []; /* declare an array of post objects as a psuedo database */

app.get("/", (req,res) => {
    res.render("index.ejs", {posts: posts}); /* main page that is fed the posts array for building the post html */
})

app.post("/", (req, res) => {
    console.log(req.body);
    let newPost =  new PostObj(req.body["post-title"], req.body["content"]); /* creates a new post with constructor */
    posts.push(newPost); /* pushes the new post onto the array*/
    console.log(posts);
    res.render("index.ejs", {posts: posts}); /* renders the new post*/
})

app.post("/about", (req, res) => {
    res.render("about.ejs"); /* renders about page*/
})

app.post("/newPost", (req, res) => {
    res.render("newPost.ejs"); /* redners new post page*/
})

app.post("/edit", (req, res) => {
    console.log(req.body["source"]);
    let index = req.body["source"]; /* get the hidden input called "source" from the body*/
    let title = posts[index].title; /* get the title from the post that was selected to be edited */
    let bodyText = posts[index].bodyText; /* get the body text from the post that was selected to be edited*/
    res.render("editPost.ejs", {title: title, bodyText: bodyText}); /* renders the editPost page with the title and bodytext*/
})

app.post("/delete", (req, res) => {
    console.log(req.body["source"]); 
    let index = req.body["source"]; /* get the hidden input called "source" from the body*/
    posts.splice(index,1); /* remove post from the array*/
    res.render("index.ejs", {posts: posts}); /* render page with new array*/
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  })

