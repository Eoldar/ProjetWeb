

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

	function send_request(){
		var ajax = new XMLHttpRequest();
		ajax.open('GET', "http://api.open-notify.org/iss-now.json?nocache=" + Math.random(), false);
		ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		ajax.addEventListener('readystatechange',  function(e) {
			if(ajax.readyState == 4 && ajax.status == 200) {
				response=JSON.parse(ajax.responseText);
				markers.clearLayers();
				latitude = response.iss_position.latitude;
				longitude = response.iss_position.longitude;
				var icone = L.icon({iconUrl:'Images/ISS.png', iconSize:[50, 50], iconAnchor:[25,0]});
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

	setInterval(function(){send_request()},3000);
