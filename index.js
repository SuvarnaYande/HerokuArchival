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
				
				for (i=0; i<results.records.length; i++){
					console.log (i);
					//console.log (JSON.parse (results.records[i].json));
				}
				
				const client = await pool.connect()
				await client.query('CREATE TABLE IF NOT EXISTS Account (Id nvarchar (20), name string, type string, industry string, rating string)');
				//await client.query('INSERT INTO Account VALUES ' + JSON.stringify (results.records));
				//const result = await client.query('SELECT * FROM Account');
				//const results = { 'results': (result != null) ? result.rows : null};
				console.log ('Data from PG:::: ');
				console.log (results);
				//res.render('pages/db', results );
				client.release();
	  
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
