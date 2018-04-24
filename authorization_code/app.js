/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '9588473a13504c208b9a8c836b70e9cf'; // Your client id
var client_secret = 'bd5ad0d8f5b742c0bd7f784aae91dd96'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());


// this route gets hit by you clicking the Login link (WHICH LOOKS LIKE A BUTTON)
app.get('/login', function(req, res) {

  // ???? leaves record of this interaction in the user's browser before doing the code below
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application connects to spotify.com to request authorization
  // hey, spotify.com, this app that belongs to developer registered at client_id
  // who is about to hit you up for an auth token
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri, // this is where you should send user once you have made
                                    //  a note of this upcoming transaction
      state: state // ps, spotify.com, the real user will have a cookie that corresponds to this
                    // that's how u know they're legit
    })
  );

}); // app.get /login

// meanwhile spotify.com does some stuff to get ready for this auth party
// if necessary user will be taken to an intermediary spotify.com page to login or sign up to/for spotify
// then tries to send user back to wherever is specifed in redirect_uri above
// which happens to be this route right here why lookie there
// spotify.com will attach things to the query string that will be needed inside the route

app.get('/callback', function(req, res) {
  console.log("HERE IS REQ.QUERY FROM THE CALLBACK ROUNTE------------------------"); 
  console.log(req.query)
  // your application requests refresh and access tokens
  // after checking the state parameter

  // this was attached by spotify abvoe beofre it redirected us here
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  // if user cookie doesn't match what they are claiming, then say heyell no
  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      })
    );

  } else {

    res.clearCookie(stateKey);


    // GET THE TOKEN
    // prepare auth stuff based on 
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      // hey i'm who login said i was 
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true // you get JSON back
    };
    // make a post request to [described above] with options [described above]
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        // the tokens we seek are now available in "body" (presumably part of the response)
        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // now you have the token and you could use it to do other stuff
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        /// like maybe this for example????
        // use the access token to access the Spotify Web API
        // HANNAH figure out what this does and/or why/if it is even necessary
        request.get(options, function(error, response, body) {
          console.log("THIS IS BODY FROM THE GET REQ IN THE POST REQ IN CALLBACK-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
          console.log(body)          
        });

        // ***we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } 
      // there was an error when you tried to make the request to get the token
      else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }

    }); // end request.post




  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
