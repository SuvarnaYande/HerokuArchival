const express = require('express')
const path = require('path')
const nforce = require ('nforce')
var hbs = require('hbs');
const PORT = process.env.PORT || 5000
const JSON = require ('JSON2')

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
	  var result; 
      org.authenticate(req.query, function(err) {
        if (!err) {
          org.query({ query: 'SELECT id, name, type, industry, rating FROM Account' }, function(err, results) {		  
            if (!err) {
				console.log ("Query result: " + results.records );
				console.log (JSON.stringify (results.records));
				result = JSON.stringify (results.records);
				for (i=0; i<results.records.length; i++){
					console.log (i);
					//console.log (JSON.parse (results.records[i].json));
				}
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
	  
	  if (result != null){
		  console.log("RESULT::");
		  console.log (result);
	  }
    }
	else {
	  console.log ("Redirect to SFDC" );
      res.redirect(org.getAuthUri());
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
