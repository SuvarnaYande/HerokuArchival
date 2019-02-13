const express = require('express')
const path = require('path')
const nforce = require ('nforce')
var hbs = require('hbs');
const PORT = process.env.PORT || 5000
const JSON = require ('JSON2')

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

function oauthCallbackUrl(req) {
  return req.protocol + '://' + req.get('host') + '/archive';
}

hbs.registerHelper('get', function(field) {
  return this.get(field);
});

express()
  .set('view engine', 'hbs')
  .post('/sfdcarchive', (req, res) => {
	  console.log ('Invoked by SFDC'); 
	  console.log (req); 
  })
  .get('/archive', (req, res) => {
	  var org = nforce.createConnection({
      clientId: process.env.CONSUMER_KEY,
      clientSecret: process.env.CONSUMER_SECRET,
      redirectUri: oauthCallbackUrl(req),
      mode: 'single'
    });
	console.log ("req.query.code:: " +req.query.code );
	if (req.query.code !== undefined) {
      // authenticated
	  console.log ("Authentication req code: " + req.query.code );
      org.authenticate(req.query, function(err) {
        if (!err) {
		  var myQuery = 'SELECT id, name, type, industry, rating FROM Account'; 
          org.query({ query: myQuery }, function(err, results) {		  
            if (!err) {
				//console.log ("Query result: " + results.records );
				//console.log ("Stringify:::"); 
				//console.log (JSON.stringify (results.records));
				//console.log ("Len:: " + JSON.stringify (results.records).length);
				//console.log ("Parse result: " );
				//console.log (JSON.parse(results.records));
				
				//console.log ("parseJSON result: " );
				//console.log ((JSON.stringify (results.records)).parseJSON());
				//console.log ("Array result: " );
				//console.log (JSON.parse(JSON.stringify (results.records)));
				//console.log ("toJSONString result: " );
				//console.log (JSON.parse(JSON.stringify (results.records)).toJSONString());
				var fieldNames = myQuery.substring(myQuery.indexOf('SELECT') + 6, myQuery.indexOf('FROM')); 
				console.log (fieldNames); 
				var fields = fieldNames.split(','); 
				console.log (fields); 
				var columnNames = ''; 
				for (j=0; j< fields.length; j++){
					columnNames += '"' + fields[j].trim() + '",';
				}
				columnNames = columnNames.substring (0, columnNames.length - 1);
				var completeResult = ''; 
				var completeResult1 = ''; 
				var arrResult = JSON.parse(JSON.stringify (results.records));
				for (i=0; i<arrResult.length; i++){
					console.log (arrResult[i]);
					//console.log (JSON.stringify(arrResult[i]));
					completeResult += '(\'' + JSON.stringify(arrResult[i]) + '\'),' ;
					var finalResult = '('; 
					for (j=0; j< fields.length; j++){
						console.log (fields[j].trim()); 
						//console.log (arrResult[i].get(field.trim())); 
						console.log (arrResult[i][fields[j].trim()]); 
						finalResult += '\'' + arrResult[i][fields[j].trim()] + '\',';
					}
					finalResult = finalResult.substring (0, finalResult.length - 1) + '),';
					completeResult1 += finalResult;
					//console.log (arrResult[i].json);
				}
				
				/*for (i=0; i<results.records.length; i++){
					console.log (i);
					console.log (results.records[i]._fields);
					completeResult += '(\'' + results.records[i]._fields.toString() + '\'),' 
					//console.log (JSON.parse (results.records[i].json));
				}*/
				completeResult = completeResult.substring (0, completeResult.length - 1);
				completeResult1 = completeResult1.substring (0, completeResult1.length - 1)
				//console.log (completeResult); 
				console.log('INSERT INTO Account VALUES ' + completeResult); 
				console.log('INSERT INTO Account (' + columnNames +') VALUES ' + completeResult1); 
				const client = pool.connect();
				pool.query('DROP TABLE IF EXISTS Account', function (err1, result){
					console.log(err1); 
					pool.query('CREATE TABLE IF NOT EXISTS Account (name text, type text, industry text, rating text, id text)' , function (err2, results, fields){
						console.log(err2); 
						if (!err){
							pool.query('INSERT INTO Account (' + fieldNames +') VALUES ' + completeResult1, function (err3, res){
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
										pool.end();
									});
									
								}
								
							});
							
						}
					});
				});
				
				//pool.query('INSERT INTO Account VALUES ' + completeResult);
				/*pool.query('INSERT INTO Account VALUES ('{"name":"GenePoint","type":"Customer - Channel","industry":"Biotechnology","rating":"Cold","id":"0017F000007y8FPQAY"},{"name":"United Oil & Gas, UK","type":"Customer - Direct","industry":"Energy","rating":null,"id":"0017F000007y8FNQAY"},{"name":"United Oil & Gas, Singapore","type":"Customer - Direct","industry":"Energy","rating":null,"id":"0017F000007y8FOQAY"},{"name":"Edge Communications","type":"Customer - Direct","industry":"Electronics","rating":"Hot","id":"0017F000007y8FFQAY"},{"name":"Burlington Textiles Corp of America","type":"Customer - Direct","industry":"Apparel","rating":"Warm","id":"0017F000007y8FGQAY"},{"name":"Pyramid Construction Inc.","type":"Customer - Channel","industry":"Construction","rating":null,"id":"0017F000007y8FHQAY"},{"name":"Dickenson plc","type":"Customer - Channel","industry":"Consulting","rating":null,"id":"0017F000007y8FIQAY"},{"name":"Grand Hotels & Resorts Ltd","type":"Customer - Direct","industry":"Hospitality","rating":"Warm","id":"0017F000007y8FJQAY"},{"name":"Express Logistics and Transport","type":"Customer - Channel","industry":"Transportation","rating":"Cold","id":"0017F000007y8FLQAY"},{"name":"University of Arizona","type":"Customer - Direct","industry":"Education","rating":"Warm","id":"0017F000007y8FMQAY"},{"name":"United Oil & Gas Corp.","type":"Customer - Direct","industry":"Energy","rating":"Hot","id":"0017F000007y8FKQAY"},{"name":"sForce","type":null,"industry":null,"rating":null,"id":"0017F000007y8FQQAY"},{"name":"Test 2","type":"Prospect","industry":null,"rating":"Warm","id":"0017F00000ODuA4QAL"},{"name":"Test 2 Lightning Experience","type":null,"industry":null,"rating":null,"id":"0017F00000ODuA9QAL"}'));*/
				
				/*pool.query('SELECT * FROM Account', function (err, rows, fields) {
					console.log ("Data from PG:::::::::::::");
					console.log (err);
					console.log (rows);
				});*/
				
				//const resultpgs = { 'resultpgs': (result != null) ? result.rows : null};
				//console.log ('Data from PG:::: ');
				//console.log (resultpgs);
				//res.render('pages/db', results );
				//pool.end();
	  
                res.render('index', {records: results.records});
            }
            else {
              res.send(err.message);
            }
          });
        }
        else {
          if (err.message.indexOf('invalid_grant') >= 0) {
            res.redirect('/');
          }
          else {
            res.send(err.message);
          }
        }
      });
	  
    }
	else {
	  console.log ("Redirect to SFDC" );
      res.redirect(org.getAuthUri());
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
