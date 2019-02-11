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
  return req.protocol + '://' + req.get('host');
}

hbs.registerHelper('get', function(field) {
  return this.get(field);
});

express()
  .set('view engine', 'hbs')
  .get('/', (req, res) => {
	  var org = nforce.createConnection({
      clientId: process.env.CONSUMER_KEY,
      clientSecret: process.env.CONSUMER_SECRET,
      redirectUri: oauthCallbackUrl(req),
      mode: 'single'
    });
	console.log ("req.query.code:: " +req.query.code );
	if (req.query.code !== undefined) {
      // authenticated
	  console.log ("Authentication red code: " + req.query.code );
      org.authenticate(req.query, function(err) {
        if (!err) {
          org.query({ query: 'SELECT id, name, type, industry, rating FROM Account' }, function(err, results) {		  
            if (!err) {
				console.log ("Query result: " + results.records );
				console.log (JSON.stringify (results.records));
				var completeResult; 
				for (i=0; i<results.records.length; i++){
					console.log (i);
					console.log (results.records[i]._fields);
					completeResult = '(\'' + results.records[i]._fields.toString() + '\'),' 
					//console.log (JSON.parse (results.records[i].json));
				}
				console.log (completeResult); 
				console.log('INSERT INTO Account VALUES ' + completeResult); 
				const client = pool.connect()
				pool.query('CREATE TABLE IF NOT EXISTS Account (Id nvarchar (20), name string, type string, industry string, rating string)');
				//pool.query('INSERT INTO Account VALUES ' + JSON.stringify (results.records));
				/*pool.query('INSERT INTO Account VALUES ('{"name":"GenePoint","type":"Customer - Channel","industry":"Biotechnology","rating":"Cold","id":"0017F000007y8FPQAY"},{"name":"United Oil & Gas, UK","type":"Customer - Direct","industry":"Energy","rating":null,"id":"0017F000007y8FNQAY"},{"name":"United Oil & Gas, Singapore","type":"Customer - Direct","industry":"Energy","rating":null,"id":"0017F000007y8FOQAY"},{"name":"Edge Communications","type":"Customer - Direct","industry":"Electronics","rating":"Hot","id":"0017F000007y8FFQAY"},{"name":"Burlington Textiles Corp of America","type":"Customer - Direct","industry":"Apparel","rating":"Warm","id":"0017F000007y8FGQAY"},{"name":"Pyramid Construction Inc.","type":"Customer - Channel","industry":"Construction","rating":null,"id":"0017F000007y8FHQAY"},{"name":"Dickenson plc","type":"Customer - Channel","industry":"Consulting","rating":null,"id":"0017F000007y8FIQAY"},{"name":"Grand Hotels & Resorts Ltd","type":"Customer - Direct","industry":"Hospitality","rating":"Warm","id":"0017F000007y8FJQAY"},{"name":"Express Logistics and Transport","type":"Customer - Channel","industry":"Transportation","rating":"Cold","id":"0017F000007y8FLQAY"},{"name":"University of Arizona","type":"Customer - Direct","industry":"Education","rating":"Warm","id":"0017F000007y8FMQAY"},{"name":"United Oil & Gas Corp.","type":"Customer - Direct","industry":"Energy","rating":"Hot","id":"0017F000007y8FKQAY"},{"name":"sForce","type":null,"industry":null,"rating":null,"id":"0017F000007y8FQQAY"},{"name":"Test 2","type":"Prospect","industry":null,"rating":"Warm","id":"0017F00000ODuA4QAL"},{"name":"Test 2 Lightning Experience","type":null,"industry":null,"rating":null,"id":"0017F00000ODuA9QAL"}'));*/
				
				//const result = pool.query('SELECT * FROM Account');
				//const resultpgs = { 'resultpgs': (result != null) ? result.rows : null};
				//console.log ('Data from PG:::: ');
				//console.log (resultpgs);
				//res.render('pages/db', results );
				pool.end();
	  
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
