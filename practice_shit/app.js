function getHashParams() {
          var hashParams = {};
          var e, r = /([^&;=]+)=?([^&;]*)/g,
              q = window.location.hash.substring(1);
          while ( e = r.exec(q)) {
             hashParams[e[1]] = decodeURIComponent(e[2]);
          }
          return hashParams;
}


var params = getHashParams();


var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;



$.ajax({
	url: 'https://api.spotify.com/v1/me/playlists',
	headers: {
        'Authorization': 'Bearer ' + access_token
    },
	type: "GET",
	dataType: 'json',
	success: (response) => {
		console.log(response);
	};
})