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
var cardPool = null;

/* middleware mounts */
/* --------------------------------------------------------------------------------- */
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

/* post objects constructor */
/* --------------------------------------------------------------------------------- */
function sampleObj(param1, param2){ /* obj name, parameter entries */
    this.param1 = param1;
    this.param2 = param2; 
}

/* utility functions */
/* --------------------------------------------------------------------------------- */

/* generate query string */
 function queryGen(obj) {
  let propertyNames = Object.getOwnPropertyNames(obj); /* generates a list of property names from the input object*/
  let propCount = propertyNames.length; /* generates the number of properties in the input object*/ 
  let fullQuery = "/?"; /* generates the base query string*/

  for(let i = 0; i < propCount; i++){ 
    if(Object.values(obj)[i]){ /* if the propery is not null, generate the query segment*/
      let propName = propertyNames[i]; /* get the property name */
      let propValue = obj[Object.keys(obj)[i]]; /* get the property value*/
      let queryItem = `${propName}=${propValue}`;/* generate the query item*/
      fullQuery = fullQuery+queryItem+"&" ;/* add the & to combine queries*/
    }
  }
  fullQuery = fullQuery.slice(0,fullQuery.length-1); /* remove the last &*/
  return fullQuery; /* returns the full query string*/
}

/* routes */
/* --------------------------------------------------------------------------------- */

/* initial site load*/
app.get("/", async (req,res) => {
  try {         
    if(cardPool == null){ /* only do load once as this load takes a long time*/
    const response = await axios.get("https://api.tcgdex.net/v2/en/cards");
    cardPool = response.data;
    }
    res.render("index.ejs", { cardCollection: cardPool});
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
})

app.get("/card-search", async (req,res) => {
  try {         
    res.render("card_search.ejs");
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
})

app.post("/query", async (req,res) => {
  try {
    var data = req.body;
    var queryString = queryGen(data);
    const response = await axios.get("https://api.tcgdex.net/v2/en/cards"+queryString); /* be careful with using get or post here */
    var searchData = response.data;
    res.render("card_search.ejs", { searchData: searchData});
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", { 
      error: error.message,
    });
  }
})

app.post("/view", async (req,res) => {
  try {
    var data = req.body;
    
    const response = await axios.get("https://api.tcgdex.net/v2/en/cards/"+data.cardID);
    console.log(response.data);
    res.render("card_search.ejs", {cardData : response.data});
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", { 
      error: error.message,
    });
  }
})

/* listening */
/* --------------------------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})