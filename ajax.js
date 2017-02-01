//Bouh :p

	var map = L.map('map').setView([0,0], 2);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	L.control.scale().addTo(map);

	var markers = new L.FeatureGroup();
 	var i=0;
	var old_lng=0;
	var position_ISS = new Array(new Array());
	var latitude=0;
	var longitude=0;
	var zoom=0;

	function send_request(){
		var ajax = new XMLHttpRequest();
		ajax.open('GET', "http://api.open-notify.org/iss-now.json?nocache=" + Math.random(), true);
		ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		ajax.addEventListener('readystatechange',  function(e) {
			if(ajax.readyState == 4 && ajax.status == 200) {
				response=JSON.parse(ajax.responseText);
				markers.clearLayers();
				latitude = response.iss_position.latitude;
				longitude = response.iss_position.longitude;
				var icone = L.icon({iconUrl:'Images/ISS.png', iconSize:[50, 50], iconAnchor:[25,25], popupAnchor:[0,-25]});
				var marker = L.marker([latitude, longitude],{icon: icone}).bindPopup("The ISS is actually here ! ");
				markers.addLayer(marker);

				var coords=document.getElementById("coordinates");
				coords.innerHTML="The ISS' coordinates are <br> Latitude : "+ latitude + " ---- Longitude : " + longitude;

				if (position_ISS[i]!=0 && old_lng<=180 && old_lng>=170 && longitude>=-180 && longitude<=-170){i++;};
				position_ISS[i].push(L.latLng(latitude, longitude));
				old_lng=longitude;

				for (var j=0; j<position_ISS.length;j++){
					var ligne=L.polyline(position_ISS[i]);
					markers.addLayer(ligne);
				};

				map.addLayer(markers);
			};});
		ajax.send();

		var box_follow_ISS=document.getElementById("box_follow_ISS");
		box_follow_ISS.addEventListener('click',function(ev){
			if (box_follow_ISS.checked){
				map.setView([latitude, longitude],5);
			}
		});
		if (box_follow_ISS.checked){
			map.setView([latitude, longitude],5);
		}
	};


	setInterval(function(){send_request()},500);


	var zoom_picture_ISS=document.getElementById("picture_submit");
	zoom_picture_ISS.addEventListener('click',function(ev){
		ev.preventDefault();
		var smartphone_zoom_ISS=document.getElementById("smartphone_zoom_ISS");
		var reflex_zoom_ISS=document.getElementById("reflex_zoom_ISS");
		var teleobjective_zoom_ISS=document.getElementById("teleobjective_zoom_ISS");
		if (smartphone_zoom_ISS.checked){
			zoom=smartphone_zoom_ISS.value;
		};
		if (reflex_zoom_ISS.checked){
			zoom=reflex_zoom_ISS.value;
		};
		if (teleobjective_zoom_ISS.checked){
			zoom=teleobjective_zoom_ISS.value;
		};
		if (zoom!=0){
			var picture_ISS=document.getElementById("picture")
			picture_ISS.innerHTML="<img src='https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/static/"+longitude+","+latitude+","+zoom+","+Math.random()*360+",50/600x400?access_token=pk.eyJ1IjoiZW9sZGFyIiwiYSI6ImNpeW4xOG1hMjAwNGozM3FsYnFheWJzOXYifQ.hZAFQxA9xQWMObZqfWdtog'/>"
			var ajax2 = new XMLHttpRequest();
			ajax2.open('GET', "http://api.geonames.org/findNearbyPlaceNameJSON?lat="+latitude+"&lng="+longitude+"&username=eoldar", true);
			ajax2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			ajax2.addEventListener('readystatechange',  function(e) {
				if(ajax2.readyState == 4 && ajax2.status == 200) {
					response=JSON.parse(ajax2.responseText);
					var message=document.getElementById("message");
					if (response.geonames.length==0){
						message.innerHTML="Hello World";}
					else {
						message.innerHTML="Hello "+response.geonames[0].name+", "+response.geonames[0].countryName;}
				}
			});
			ajax2.send();
		}
	})
