const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var bodyParser = require('body-parser')
const basicAuth = require('express-basic-auth')

//module.exports = basicAuth({ users: { 'suvarnasanket.yande@cognizant.com': '#Saanvi123' } })

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

function myAuthorizer(username, password){
	console.log ('1');
	console.log (username);
	console.log (password);
	return true; 
}
var app = express(); 

app
  .use(bodyParser.json())
  .use(basicAuth( { authorizer: myAuthorizer } ))
  .post('/sfdcarchive', function (req, res) {
	  console.log ('Invoked by SFDC::::::'); 
	  console.log (req.query.code); 
	  var reqBody = req.body; 
	  console.log (reqBody);
	  
	  var records = reqBody.records;
      var metadata = reqBody.metadata;
	  var insertFields = metadata; 
      var finalResult = [];
        
      var fieldList = metadata.substring(metadata.indexOf('(')+1, metadata.indexOf(')')); 
	  var tableName = metadata.substring(0, metadata.indexOf('(')); 
      console.log (fieldList);
      var fieldArr = [];//fieldList.split(',');
	  var insertFieldArr = [];
	  var upsertFieldArr = [];
      for (i=0; i<fieldList.split(',').length; i++){
        //fieldArr[i]=fieldList.split(',')[i].trim().split(' ')[0].split(':')[0];
		var colHeader = fieldList.split(',')[i].trim().split(' ')[0]
        fieldArr[i]=colHeader.split(':')[0];
        insertFields =  insertFields.replace(fieldList.split(',')[i].trim().split(' ')[1].trim(), ''); 
		insertFieldArr[i]='ADD COLUMN IF NOT EXISTS ' + fieldList.split(',')[i];
		upsertFieldArr[i] = fieldArr[i] +'=EXCLUDED.'+fieldArr[i];
		
        if (colHeader.indexOf(':') > 0){
          metadata = metadata.replace(fieldArr[i] + ':', '');
          insertFields  = insertFields.replace(fieldArr[i] + ':', '');
		  insertFieldArr[i]=insertFieldArr[i].replace(fieldArr[i] + ':', '');
		  upsertFieldArr[i] = colHeader.split(':')[1] +'=EXCLUDED.'+colHeader.split(':')[1];
        }
      }
      console.log(fieldArr);

	
	  for (i=0; i<records.length; i++){
        var result = '(';
		var recordVal = []; 
        for (j =0; j<fieldArr.length; j++){
			//recordVal[j] = '\'' + records[i][fieldArr[j].trim()] ? records[i][fieldArr[j].trim()] : '' + '\'';
            var fldVal = records[i][fieldArr[j].trim()] ? records[i][fieldArr[j].trim()] : '';
            recordVal[j] = '\'' +fldVal +  '\'';
        }
        //result = result.substring (0, result.length - 1) + ')';
        finalResult[i] = '('+ recordVal.join() +')';
      }
	  
      //finalResult = finalResult.substring (0, finalResult.length - 1); 
      console.log('INSERT INTO Account (' + fieldArr.join() +') VALUES ' + finalResult.join() + ' ON CONFLICT (ID) DO UPDATE SET ' + upsertFieldArr.join()); 
      console.log('CREATE TABLE IF NOT EXISTS ' + metadata);
	  
	  const client = pool.connect();
	  pool.query('DROP TABLE IF EXISTS Account', function (err1, result){
		//console.log(err1); 
		pool.query('CREATE TABLE IF NOT EXISTS ' + metadata, function (err2, results, fields){
			console.log(err2); 
			console.log(results);
			
			
			/*for (i=0; i<insertFieldArr.length; i++){
				pool.query ('IF COL_LENGTH(\'' + tableName + '\', 'CreateDate') IS NULL BEGIN ALTER TABLE ACCOUNT ADD  Exists END');
			}*/
			if (!err2){
				pool.query ('ALTER TABLE ' + tableName + ' ' + insertFieldArr.join(), function (er, results, fields){
					console.log (er);
					pool.query('INSERT INTO ' + insertFields +' VALUES ' + finalResult.join()  + ' ON CONFLICT (ID) DO UPDATE SET ' + upsertFieldArr.join(), function (err3, result){
					if (err3){
						console.log ("ERROR" + err3); 
					}
					else{
						//console.log ("successful insertion");
						//console.log (res);
						//TODO: Correct place for res.End(); 
						//res.status(200);
						//res.end();
						pool.query('SELECT * FROM Account', function (err4, rows, fields) {
							//console.log ("Select err4:: " + err4);
							if (err4){
								console.log ("ERROR4" + err4);
							}
							else{
								console.log ("Data from PG:::::::::::::");
								//console.log (err);
								console.log (rows);
								//TODO: below 2 lines are only for testing. Needs to be removed.
								res.status(200);
						res.end();
							}
							//pool.end();
						});	
						//res.status(201).end();
						
						//res.status(200).json({"message":"successful"});
					}
				});
				});
									
			}
		});
	});
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
