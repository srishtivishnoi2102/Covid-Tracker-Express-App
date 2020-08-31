const express = require('express');
const bodyParser=require('body-parser');
const mydb=require("./lib/datacenter/mysql");
var path = require('path');


const app=new express();

app.use(express.static('public'));
mydb.connectDb();

app.use(express.json());
app.use(bodyParser.json());
app.use('/covid/',require("./routes/dashboard"));     //router for dashboard
app.use('/risk/',require("./routes/risk"));     //router for risk.js




const PORT=process.env.PORT ||8000;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}!`);
});