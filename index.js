const express = require('express')
const path = require('path')
const nforce = require ('nforce')
var hbs = require('hbs');
const JSON = require('json');
const PORT = process.env.PORT || 5000
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
			  console.log ("JSON format: " + JSON.serialize (results.records ));
			  console.log ("JSON format: " + JSON.parse (results.records ));
			  for (i = 0; i < results.records.length; i++){
			    console.log (results.records[i].get ('id'));
				console.log (results.records[i].get ('name'));
			  }
              res.render('index', {records: results.records});
			  //const client = await pool.connect()
			  //const result = await client.query('SELECT * FROM test_table');
			  //const results = { 'results': (result) ? result.rows : null};
			  //res.render('pages/db', results );
			  //client.release();
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
