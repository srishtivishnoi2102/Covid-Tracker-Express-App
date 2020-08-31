const express = require('express');
const {to} =require('await-to-js');
const fs=require('fs');
const router = express.Router();
const mydb=require("../lib/datacenter/mysql");
const { json } = require('body-parser');


const dbHandleError=(res,err)=>{
    console.log("Error in executing query, ",{error:err});
        return res.json({
            msg:`Error in executing query`,
            err:err
        });
}
// 5.    Show extreme risk regions/districts: A region is said to be extreme risk, if more than 70% of its connected districts
//          are high risk. Will be called upto 1000 times/day.

router.get('/red/', async(req, res) => {
    console.log("In router.get('/:red/', async(req, res)");
    const graphData=fs.readFileSync("./graph.json");                            //  read graph
    console.log(graphData);

    //  write sql to fetch the district with their zones
    const fetchZoneSql= `SELECT districts.name, districts.id, districts.name, district_cases.zone AS zone
                            FROM district_cases JOIN districts WHERE district_cases.district_id = districts.id`;
    var err,response;
    [err,response]=await to(mydb.executeQuery(fetchZoneSql));
    if(err){
        dbHandleError(res,err);
    }

    // update zone of district to 2(RED) if more than 70% neighbours are in zone 1(ORANGE)   <TODO> 


    return  res.json({
        graphData
    });
})


router.get('/:districtid/', async(req, res) => {
    console.log("In router.get('/:districtid/', async(req, res)");

    const districtid=req.params.districtid;
    if(!districtid){
        return res.status(400).json({
            success:false,
            err:"invalid payload"
        });
    }

    const districtRiskSql = `SELECT districts.name, districts.name, district_cases.confirmed AS Confirmed, district_cases.hospitalised AS hospitalised,
                                district_cases.recovered AS recovered, district_cases.fatal AS fatal , district_cases.zone AS zone
                            FROM district_cases JOIN districts WHERE district_cases.district_id = districts.id AND districts.id = '${districtid}'`;
    var err,response;
    [err,response]=await to(mydb.executeQuery(districtRiskSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        return  res.status(400)
                .json({
                    success:false,
                    err:"Invalid Request"
                });
    }
    var zone=0;
    var riskStatus="No Risk, District is in Green Zone";
    if(response.length>0){
        zone=parseInt(response[0]['zone']);
        if(zone==1){
            riskStatus="District is in Orange Zone (High Risk)";
        }else if(zone==2){
            riskStatus="District is in Red Zone(Extreme High Risk)";
        }
    }   
    return  res.json({
        zone,
        riskStatus,
        success:true
    });districtid
});



module.exports=router;