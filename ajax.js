//Bouh :p


	var map = L.map('map').setView([20,0], 3);
	L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }).addTo(map);
	/*L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	}).addTo(map);
	/*L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);*/
	L.control.scale().addTo(map);

	var markers = new L.FeatureGroup();
	var old_lng=0;
	var position_ISS = new Array();
	var indice_trait = new Array();
	indice_trait.push(0);
	var latitude=0;
	var longitude=0;
	var zoom=0;
	var i=0;
	var Interval_ISS;
	var Interval_Homemade;

	send_request();

	function send_request(){
		var ajax = new XMLHttpRequest();
		ajax.open('GET', "https://api.wheretheiss.at/v1/satellites/25544", true);
		ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		ajax.addEventListener('readystatechange',  function(e) {
			if(ajax.readyState == 4 && ajax.status == 200) {
				response=JSON.parse(ajax.responseText);
				markers.clearLayers();
				latitude = Math.round(response.latitude*1000)/1000;
				longitude = Math.round(response.longitude*1000)/1000;
				var icone = L.icon({iconUrl:'Pictures/ISS.png', iconSize:[50, 50], iconAnchor:[25,25], popupAnchor:[0,-25]});
				var marker = L.marker([latitude, longitude],{icon: icone});
				markers.addLayer(marker);

				var coords=document.getElementById("coordinates");
				if (latitude>=0){var LAT="N"}
				else if (latitude<0){var LAT="S"};
				if (longitude>=0){var LON="E"}
				else if (longitude<0){var LON="W"};
				coords.innerHTML="<p>The ISS' coordinates are :<br> Latitude : "+Math.abs(latitude)+"° "+LAT+" ---- Longitude : "+Math.abs(longitude)+"° "+LON+"</p>";

				if (position_ISS.length!=0 && old_lng<=180 && old_lng>=170 && longitude>=-180 && longitude<=-170){indice_trait.push(position_ISS.length);i=0;};
				i++;
				position_ISS.push(L.latLng(latitude, longitude));
				old_lng=longitude;

				for (var j=0; j<indice_trait.length-1;j++){
					var ligne=L.polyline(position_ISS.slice(indice_trait[j],indice_trait[j+1]-1), {color:'red', weight: 5, opacity:1});
					markers.addLayer(ligne);
				};
				var ligne_current=L.polyline(position_ISS.slice(indice_trait[indice_trait.length-1],indice_trait[indice_trait.length-1]+i), {color:'red', weight: 5, opacity:1});
				markers.addLayer(ligne_current);
				map.addLayer(markers);
			};});
		ajax.send();

		var box_follow_ISS=document.getElementById("box_follow_ISS");
		box_follow_ISS.addEventListener('click',function(ev){
			if (box_follow_ISS.checked){
				map.setView([latitude, longitude],5);
			}
			else{
				map.setView([latitude, longitude],3);
			}
		});
		if (box_follow_ISS.checked){
			map.setView([latitude, longitude],5);
		}
	};


	function ask_speed(v,lat,lon){
		console.log(lat,lon,v);
		lon=lon*Math.PI/180;
		lat=lat*Math.PI/180;
		var a=6378249.2;
		var b=6356515.0;
		var e2=(Math.pow(a,2)-Math.pow(b,2))/(Math.pow(a,2));
		var W=Math.sqrt(1-e2*Math.pow(Math.sin(lat),2));
		var N=a/W;
		var h=400000;

		var angle_Z=(2*0.5*Math.PI*v)/(3600*40000);
		lon=lon+angle_Z*180/Math.PI;

		var X0=(N+h)*Math.cos(lon)*Math.cos(lat);
		var Y0=(N+h)*Math.sin(lon)*Math.cos(lat);
		var Z0=(N*(1-e2)+h)*Math.sin(lat);

		var angle_Y=51.64*Math.PI/180;
		var angle_Z_terre=2*0.5*Math.PI/86400;

		var angle_Y=0;
		//var angle_Z_terre=0;

		//Coordinates after the rotation of 51.64° of the ISS
		var X2=X0
		var Y2=Y0*Math.cos(angle_Y)-Z0*Math.sin(angle_Y);
		var Z2=Y0*Math.sin(angle_Y)+Z0*Math.cos(angle_Y);
		//Coordinates after the rotation of the Earth during 0.5s
		var X3=X2*Math.cos(-angle_Z_terre)-Y2*Math.sin(-angle_Z_terre);
		var Y3=X2*Math.sin(-angle_Z_terre)+Y2*Math.cos(-angle_Z_terre);
		var Z3=Z2;

		var p=Math.sqrt(X3*X3+Y3*Y3);
		var lambda=Math.atan(Y3/X3);
		var phi0=Math.atan(Z3/p);
		var N0=a/(Math.sqrt(1-(e2*Math.sin(phi0)*Math.sin(phi0))));
		var h0=(p/(Math.cos(phi0)))-N0
		var phin;
		var Nn;
		var hn;
		for (var i=0;i<10;i++){
			phin=Math.atan((Z3*(N0+h0))/(p*(N0+h0-N0*e2)));
			Nn=a/(Math.sqrt(1-(e2*Math.sin(phin)*Math.sin(phin))));
			hn=(p/Math.cos(phin))-Nn;
			N0=Nn;
			h0=hn;
		};


		markers.clearLayers();
		latitude=Math.round((phin*180/Math.PI)*1000)/1000;
		longitude=Math.round((lambda*180/Math.PI)*1000)/1000;
		console.log(latitude,longitude);

		var icone = L.icon({iconUrl:'Pictures/ISS.png', iconSize:[50, 50], iconAnchor:[25,25], popupAnchor:[0,-25]});
		var marker = L.marker([latitude, longitude],{icon: icone});
		markers.addLayer(marker);

		var coords=document.getElementById("coordinates");
		if (latitude>=0){var LAT="N"}
		else if (latitude<0){var LAT="S"};
		if (longitude>=0){var LON="E"}
		else if (longitude<0){var LON="W"};
		coords.innerHTML="<p>The ISS' coordinates are :<br> Latitude : "+Math.abs(latitude)+"° "+LAT+" ---- Longitude : "+Math.abs(longitude)+"° "+LON+"</p>";

		if (position_ISS.length!=0 && old_lng<=180 && old_lng>=170 && longitude>=-180 && longitude<=-170){indice_trait.push(position_ISS.length);i=0;};
		i++;
		position_ISS.push(L.latLng(latitude, longitude));
		old_lng=longitude;

		for (var j=0; j<indice_trait.length-1;j++){
			var ligne=L.polyline(position_ISS.slice(indice_trait[j],indice_trait[j+1]-1), {color:'red', weight: 5, opacity:1});
			markers.addLayer(ligne);
		};
		var ligne_current=L.polyline(position_ISS.slice(indice_trait[indice_trait.length-1],indice_trait[indice_trait.length-1]+i), {color:'red', weight: 5, opacity:1});
		markers.addLayer(ligne_current);
		map.addLayer(markers);

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


	var zoom_picture_ISS=document.getElementById("picture_submit");
	zoom_picture_ISS.addEventListener('click',function(ev){
		ev.preventDefault();
		var smartphone_zoom_ISS=document.getElementById("smartphone_zoom_ISS");
		var reflex_zoom_ISS=document.getElementById("reflex_zoom_ISS");
		var teleobjective_zoom_ISS=document.getElementById("teleobjective_zoom_ISS");
		if (smartphone_zoom_ISS.checked){
			zoom=smartphone_zoom_ISS.value;};
		if (reflex_zoom_ISS.checked){
			zoom=reflex_zoom_ISS.value;};
		if (teleobjective_zoom_ISS.checked){
			zoom=teleobjective_zoom_ISS.value;};
		if (zoom!=0){
			var picture_ISS=document.getElementById("picture");
			var height=Math.round(window.innerHeight/2);
			var width=Math.round(window.innerWidth/3);
			picture_ISS.innerHTML="<img src='https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"+longitude+","+latitude+","+zoom+","+Math.random()*360+",50/"+width+"x"+height+"?access_token=pk.eyJ1IjoiZW9sZGFyIiwiYSI6ImNpeW4xOG1hMjAwNGozM3FsYnFheWJzOXYifQ.hZAFQxA9xQWMObZqfWdtog' alt='PictureFromISS'/>"

			var picture_cross=document.getElementById("cross");
			picture_cross.innerHTML="<img id='cross_click' src='Pictures/Cross.png' alt='Exit'>";
			document.getElementById("cross_click").addEventListener('click',function(ev){
				var picture_ISS=document.getElementById("picture");
				var message=document.getElementById("message");
				var exit=document.getElementById("cross");
				picture_ISS.innerHTML="";
				message.innerHTML="";
				exit.innerHTML="";
			});

			var ajax2 = new XMLHttpRequest();
			ajax2.open('GET', "http://api.geonames.org/extendedFindNearby?lat="+latitude+"&lng="+longitude+"&username=eoldar", true);
			ajax2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			ajax2.addEventListener('readystatechange',  function(e) {
				if(ajax2.readyState == 4 && ajax2.status == 200) {
					response=ajax2.responseXML;
					var Json=xmlToJson(response);
					var message=document.getElementById("message");
					if (Json.geonames['#text'].length==2){
						message.innerHTML="Hello "+Json.geonames.ocean.name['#text'];}
					else {
						message.innerHTML="Hello "+Json.geonames.geoname[Json.geonames.geoname.length-1].toponymName['#text']+", "+Json.geonames.geoname[2].toponymName['#text']+", "+Json.geonames.geoname[1].toponymName['#text'];}
				}
			});
			ajax2.send();
		}
	});


	var box_manual_speed=document.getElementById("box_manual_speed");
	box_manual_speed.addEventListener('click', process_speed);
	process_speed();

	function process_speed(){
		if (box_manual_speed.checked){
			var speed_ISS=document.getElementById("speed_ISS");
			speed_ISS.innerHTML="<input id='range_speed_ISS' type='range' value='27600' max='500000' min='-50000' step='100'>"
			var speed_ISS=document.getElementById("range_speed_ISS");
			speed_ISS.addEventListener('change',function(ev){
				var display_speed=document.getElementById("display_speed");
				display_speed.innerHTML="The ISS' speed is : "+speed_ISS.value+" km/h"
			});
			clearInterval(Interval_ISS);
			Interval_Homemade=setInterval(function(){ask_speed(speed_ISS.value,latitude,longitude)},500);
			//ask_speed(speed_ISS.value,latitude,longitude);
		}
		else{
			var speed_ISS=document.getElementById("speed_ISS");
			speed_ISS.innerHTML="";
			var display_speed=document.getElementById("display_speed");
			display_speed.innerHTML="The ISS' speed is : 27600 km/h";
			clearInterval(Interval_Homemade);
			Interval_ISS=setInterval(function(){send_request()},500);
		}
	}

/* Fonction de conversion de XML vers JSON*/
	function xmlToJson(xml) {
		var obj = {};
		if (xml.nodeType == 1) {
			if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType == 3) {
			obj = xml.nodeValue;
		}
		if (xml.hasChildNodes()) {
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (typeof(obj[nodeName]) == "undefined") {
					obj[nodeName] = xmlToJson(item);
				} else {
					if (typeof(obj[nodeName].push) == "undefined") {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(xmlToJson(item));
				}
			}
		}
		return obj;
	};
