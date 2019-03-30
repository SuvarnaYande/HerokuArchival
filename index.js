const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var bodyParser = require('body-parser')
const basicAuth = require('express-basic-auth')
var hbs = require('ejs');

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
  .set('view engine', 'ejs')
  .get('/archivaldata', function (req, res){
	  const client = pool.connect();
	  pool.query('SELECT * FROM information_schema.columns', function (err4, rows, fields) {
		  //res.render('index', {records: rows});
		  console.log (rows); 
		  res.render('pages/db', rows );
		  res.status(200);
		  res.end(); 
	  })
  })
	.post('/sfdcarchive', function (req, res) {
		console.log ('Invoked by SFDC::::::'); 
		console.log (req.query.code); 
		var reqBody = req.body; 
		//console.log (reqBody);
	  
		var records = reqBody.records;
		var metadata = reqBody.metadata;
		var colArr = []; 
    
		var fieldList = metadata.substring(metadata.indexOf('(')+1, metadata.lastIndexOf(')')); 
		var tableName = metadata.substring(0, metadata.indexOf('(')); 
		console.log (fieldList);
		var dataKeyArr = [];//fieldList.split(',');
		var dataTypeArr = [];
		var alterColArr = '';
		var upsertFieldArr = '';
		for (i=0; i<fieldList.split(',').length; i++){
			var colHeader = fieldList.split(',')[i].trim().split(' ')[0];
			dataKeyArr[i]=colHeader.split(':')[0];
			dataTypeArr[i]=fieldList.split(',')[i].trim().split(' ')[1];
			colArr[i] = colHeader.replace(dataKeyArr[i] + ':', '');
        
			if (fieldList.split(',')[i].toUpperCase().indexOf('PRIMARY KEY') < 0){
				alterColArr +='ADD COLUMN IF NOT EXISTS ' +  fieldList.split(',')[i].trim() + ',';
				upsertFieldArr += dataKeyArr[i] +'=EXCLUDED.'+dataKeyArr[i] + ',';
			}	
		
			metadata = metadata.replace(dataKeyArr[i] + ':', '');
		}
		console.log(dataKeyArr);
		alterColArr = alterColArr.substring (0, alterColArr.length - 1);
		upsertFieldArr = upsertFieldArr.substring (0, upsertFieldArr.length - 1)
	      
		var valArr = [];
        
		for (i=0; i<records.length; i++){
			var recordVal = []; 
			for (j =0; j<dataKeyArr.length; j++){
				//var fldVal = records[i][dataKeyArr[j].trim()] ? records[i][dataKeyArr[j].trim()] : null;
				/*if (dataTypeArr[j].toUpperCase().trim() == 'BOOLEAN' && fldVal==''){
					fldVal = false;
				}*/
				//recordVal[j] =  '\'' + fldVal + '\''; 
				var fldVal = (records[i][dataKeyArr[j].trim()]);  
				if (fldVal && typeof fldVal == 'string' ){
					fldVal = fldVal.replace ("\'", "\'\'")
				}
				//recordVal[j] = fldVal ? '\'' + fldVal.replace('\'', '\'\'') + '\'' : 'default'; 
				recordVal[j] = fldVal ? '\'' + fldVal + '\'' : 'default'; 
			}
			valArr[i] = '('+ recordVal.join() +')';
		}
	  
		var createQuery = 'CREATE TABLE IF NOT EXISTS CA_' + metadata;
		var conflictAction = upsertFieldArr ? 'UPDATE SET ' + upsertFieldArr : 'NOTHING';
		var upsertQuery = 'INSERT INTO CA_' + tableName + '(' + colArr.join() +') VALUES ' + valArr.join()  + ' ON CONFLICT (Id) DO ' +  conflictAction;
	  
		console.log(createQuery);
		console.log(upsertQuery); 
  
		//const client = pool.connect();
		pool.connect().then(client => {
			client.query(createQuery, function (err2, results, fields){
				console.log("err2::: " + err2); 
				if (!err2){
					console.log('ALTER TABLE CA_' + tableName + ' ' + alterColArr);
					client.query ('ALTER TABLE CA_' + tableName + ' ' + alterColArr, function (er, results, fields){
						console.log ('ALTER ERR');
						console.log (er);
						if (typeof records != 'undefined' && valArr.length > 0){
							client.query(upsertQuery, function (err3, result){
								if (err3){
									console.log ("ERROR:: " + err3); 
								}
								else{
									console.log ("successful insertion");
									client.query('SELECT * FROM CA_' + tableName, function (err4, rows, fields) {
										if (err4){
											console.log ("ERROR4" + err4);
											client.release();
											res.status(200);
											res.end();
										}
										else{
											console.log ("Data from PG:::::::::::::");
											console.log (rows.rowCount);.
											client.release();
											res.status(200);
											res.end();
										}
									});
								}
							});
						}
						else{
							client.release();
							res.status(200);
							res.end();
						}
					});						
				}else{
					client.release();
					res.status(503);
					res.end();
				}
			});
		});
	})
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
