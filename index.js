const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var bodyParser = require('body-parser')
const basicAuth = require('basic-auth')

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});


var app = express(); 

app
  .use(bodyParser.json())
  .post('/sfdcarchive', (req, res) => {
	  console.log ('Invoked by SFDC::::::'); 
	  console.log (req.query.code); 
	  var reqBody = req.body; 
	  console.log (reqBody);
	  
	  var records = reqBody.records;
      var metadata = reqBody.metadata;
      var finalResult = '';
        
      var fieldList = metadata.substring(metadata.indexOf('(')+1, metadata.indexOf(')')); 
      console.log (fieldList);
      var fieldArr = [];//fieldList.split(',');
   
      for (i=0; i<fieldList.split(',').length; i++){
        fieldArr[i]=fieldList.split(',')[i].trim().split(' ')[0];
      }
      console.log(fieldArr);
      for (i=0; i<records.length; i++){
        var result = '(';
        for (j =0; j<fieldArr.length; j++){
            var fldVal = records[i][fieldArr[j].trim()] ? records[i][fieldArr[j].trim()] : '';
            result += '\'' +fldVal +  '\',';
        }
        result = result.substring (0, result.length - 1) + ')';
        finalResult += result + ',';
      }
	
      finalResult = finalResult.substring (0, finalResult.length - 1); 
      console.log('INSERT INTO Account (' + fieldArr.join() +') VALUES ' + finalResult); 
      console.log('CREATE TABLE IF NOT EXISTS ' + metadata);
	  
	  const client = pool.connect();
	  pool.query('DROP TABLE IF EXISTS Account', function (err1, result){
		console.log(err1); 
		pool.query('CREATE TABLE IF NOT EXISTS ' + metadata, function (err2, results, fields){
			console.log(err2); 
			if (!err2){
				pool.query('INSERT INTO Account (' + fieldArr.join() +') VALUES ' + finalResult, function (err3, res){
					if (err3){
						console.log ("ERROR" + err3); 
					}
					else{
						console.log ("successful insertion");
						pool.query('SELECT * FROM Account', function (err4, rows, fields) {
							console.log ("Select err4:: " + err4);
							if (err4){
								console.log ("ERROR4" + err4);
							}
							else{
								console.log ("Data from PG:::::::::::::");
								//console.log (err);
								console.log (rows);
							}
							//pool.end();
						});	
						//res.status(201).end();
					}
				});					
			}
		});
	});
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
