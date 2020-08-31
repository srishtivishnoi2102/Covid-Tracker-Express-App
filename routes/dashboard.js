const express = require('express');
const {to} =require('await-to-js');
const router = express.Router();
const mydb=require("../lib/datacenter/mysql");
const { invalid } = require('joi');



const dbHandleError=(res,err)=>{
    console.log("Error in executing query, ",{error:err});
        return res.json({
            msg:`Error in executing query`,
            err:err
        });
}


// api to get number of cases in various states
router.get('/', async(req, res) => {
    const stateWiseCasesSql = `SELECT states.state, SUM(district_cases.confirmed) as Confirmed, SUM(district_cases.hospitalised) as Hospitalised, 
                SUM(district_cases.recovered) as Recovered, SUM(district_cases.fatal) as Fatal FROM  district_cases JOIN districts JOIN states 
                    WHERE district_cases.district_id = districts.id
                    AND districts.stateid=states.id
                            GROUP by states.id`;
    var err,response;
    [err,response]=await to(mydb.executeQuery(stateWiseCasesSql));
    if(err){
        dbHandleError(res,err);
    }
    console.log(response);
    return  res.json({
        data:response
    });
});


// api to get number of cases in a particular state
router.get('/:stateid', async(req, res) => {
    const stateid=req.params.stateid;

    if(!stateid){
        return res.status(400).json({
            success:false,
            err:"invalid payload"
        });
    }

    const districtWiseCasesSql = `SELECT districts.name, district_cases.confirmed AS Confirmed, district_cases.hospitalised AS hospitalised,
                            district_cases.recovered AS recovered, district_cases.fatal AS fatal , zone
                            FROM district_cases JOIN districts WHERE 
                            district_cases.district_id = districts.id AND districts.stateid = '${stateid}'`;


    var err,response;
    [err,response]=await to(mydb.executeQuery(districtWiseCasesSql));
    if(err){
        dbHandleError(res,err);
    }
    console.log(response);
    return  res.json({
        data:response
    });
});



//  API for all states, to update their counts every day.

router.post('/update', async(req, res) => {
    const districtName=req.body.district;
    const observation=req.body.observation;
    const count=req.body.count;
    if(!districtName || parseInt(count)<0){
        return  res.status(400).json({
            success:false,
            err:"Invalid payload"
        });
    }
    var districtId;
    const prevStateSql = `SELECT d.id, dc.confirmed,dc.hospitalised,dc.recovered,dc.fatal from district_cases dc join districts d 
                        WHERE dc.district_id=d.id and d.name="${districtName}"`;
    var err,response;
    [err,response]=await to(mydb.executeQuery(prevStateSql));
    if(err){
        dbHandleError(res,err);
    }
    var prevRow={}
    if(response.length==0){
        prevRow={
            confirmed: 0,
            hospitalised: 0,
            recovered: 0,
            fatal: 0
          }
    }else{

        prevRow=response[0];
    }
    
    var updatedRow=Object.assign({},prevRow);
    updatedRow[observation]=count;

    
    const getdistrictIdSql=`SELECT id from districts where name='${districtName}';`;
    [err,response]=await to(mydb.executeQuery(getdistrictIdSql));
    if(err){
        dbHandleError(res,err);
    }
    if(response.length==0){
        return res.json({
             success:false,
             msg: "Disctrict does not exist"
         });

    }
    

    districtId=response[0]['id'];
    if(parseInt(updatedRow['fatal'])>=30 || 
        (parseInt(updatedRow['hospitalised'])>=30 && parseInt(updatedRow['confirmed'])>=50) ||
        (absolute(parseInt(updatedRow['confirmed'])- parseInt(updatedRow['recovered']) >=100))){
            updatedRow['zone']=1;
        }else{
            updatedRow['zone']=0;
        }
  

    const updateRecordSql= `INSERT INTO district_cases (district_id, confirmed, hospitalised, recovered, fatal, updatedAt, zone) 
                        VALUES ('${districtId}', '${updatedRow["confirmed"]}' ,'${updatedRow["hospitalised"]}' ,'${updatedRow["recovered"]}',
                        '${updatedRow["fatal"]}' ,curDate(),'${updatedRow["zone"]}' ) 
                        ON DUPLICATE KEY UPDATE ${observation}= '${count}', zone= '${updatedRow["zone"]}'`;
                                                    
    [err,response]=await to(mydb.executeQuery(updateRecordSql));
    if(err){
        dbHandleError(res,err);
    }
    return  res.json({
        success:true,
        msg:"Successfully updated the records"
    });
});


module.exports=router;