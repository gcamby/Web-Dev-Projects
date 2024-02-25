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
var fullCardPool = null;
var fullSetList = null;
var imageCardPool = null; 

/* middlewares */
/* --------------------------------------------------------------------------------- */
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

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
  
  function getPokemon(cardList,index){
    return cardList[index];
  }
  
  function hasImage(pokemon) {
    let imageProp = true;
    if(pokemon.image == undefined){
      imageProp = false;
    }
    return imageProp;
  }

/* Routes */
/* --------------------------------------------------------------------------------- */
app.get("/", async (req,res) => {
    try { 
        if(fullCardPool == null){ /* only do load once as this load takes a long time*/  
        const response = await axios.get("https://api.tcgdex.net/v2/en/cards"); /* gets the entire card database from the api */
        fullCardPool = response.data; /* loads into a variable called cardPool */ 
        } /* ends check for if the cardpool is already loaded */
    
        if(fullSetList == null){ /* only do load once as this load takes a long time*/
        const response = await axios.get("https://api.tcgdex.net/v2/en/sets"); /* gets the entire card database from the api */
        fullSetList = response.data; /* loads into a variable called fullSetList */ 
        } /* ends check for if the fullSetList is already loaded */
        
        var rng;
        var imageFlag = false;
        var randCard;
        while(imageFlag == false){
          rng = Math.floor(Math.random()*fullCardPool.length);
          randCard = getPokemon(fullCardPool,rng);
          imageFlag = hasImage(randCard);
        }
    
        if(imageCardPool == null){
          imageCardPool = [];
          for(let i = 0;i<fullCardPool.length;i++){
            if(hasImage(fullCardPool[i])==true){
              imageCardPool.push(fullCardPool[i]);
            }
          }
        }
    
        res.render("index.ejs", { randCard: randCard, fullSetList: fullSetList, imageCardPool: imageCardPool});/* renders the site with cardPool loaded */
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

/* Listening... */
/* --------------------------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`listening on port ${port}`);
})