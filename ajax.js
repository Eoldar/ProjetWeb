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


	  var earth = {
	    radius: 6371,   // km
	    speed: 1/240,   // deg/sec
	    rotation: 0
	  };

	  var iss = {
	    speed: 7+2/3,    // km/sec
	    altitude: 400,
	    angle: 51.64,       // deg

	    latitude: null,     // deg
	    longitude: null,    // deg

	    polar: Math.PI/2,   // rad
	    azimuth: 0,         // rad
	    time: 0
	  };

	  function update_iss(time_factor=1){
	    if(iss.time == 0){ init(); }

	    var time = Date.now();
	    var dt = (time - iss.time)/1000;    // sec
	    iss.time = time;

	    iss.azimuth += time_factor*dt * iss.speed/(iss.altitude + earth.radius);
	    iss.azimuth = iss.azimuth%(2*Math.PI);

	    var x = earth.radius * Math.cos(iss.azimuth)*Math.sin(iss.polar);   //coordonnées dans le repère lié à l'ISS
	    var y = earth.radius * Math.sin(iss.azimuth)*Math.sin(iss.polar);
	    var z = earth.radius * Math.cos(iss.polar);

	    var rot_angle = deg_rad(iss.angle);   // rotation pour l'inclinaison de l'ISS
	    var rotation = rotate(x,y,z,rot_angle,'y');
	    x = rotation[0], y = rotation[1], z = rotation[2];

	    earth.rotation += time_factor*dt * 2*Math.PI/86400;   // rotation de la Terre
	    earth.rotation = earth.rotation%(2*Math.PI);
	    rotation = rotate(x,y,z,earth.rotation,'z');
	    x = rotation[0], y = rotation[1], z = rotation[2];

	    var temp = (z/earth.radius);
	    iss.latitude = rad_deg( Math.asin(temp) );
	    iss.longitude = rad_deg( Math.atan2(y,x) );

			markers.clearLayers();
			latitude=Math.round(iss.latitude*1000)/1000;
			longitude=Math.round(iss.longitude*1000)/1000;

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
	  }

	  function rotate(x,y,z,angle,axis){
	    var x_, y_, z_;
	    switch(axis){
	      case 'x':
	        x_ = x;
	        y_ = y*Math.cos(angle) - z*Math.sin(angle);
	        z_ = y*Math.sin(angle) + z*Math.cos(angle)
	        break;

	      case 'y':
	        x_ = z*Math.sin(angle) + x*Math.cos(angle);
	        y_ = y;
	        z_ = z*Math.cos(angle) - x*Math.sin(angle);
	        break;

	      case 'z':
	        x_ = x*Math.cos(angle) - y*Math.sin(angle);
	        y_ = x*Math.sin(angle) + y*Math.cos(angle);
	        z_ = z;
	        break;
	    }
	    return [x_,y_,z_];
	  }

	  function init(){
	    iss.latitude = 0;
	    iss.longitude = 0;
	    iss.polar = Math.PI/2;
	    iss.azimuth = 0;
	    iss.time = Date.now();
	  }

	  function rad_deg(rad){ return (rad*180/3.141592653589793)%360; }    //convertis les radians en degrés
	  function deg_rad(deg){ return (deg*3.141592653589793/180)%(2*Math.PI); }    // et inversement



	/*function ask_speed(v,lat,lon){
		console.log(lat,lon,v);
		azimuth=lon*Math.PI/180;
		polar=90;
		var earth_radius=6371000;
		var iss_altitude=400000;

		var angle_movement=((2*3*Math.PI*v)/(3600*(40000+400)))%(2*Math.PI);
		azimuth=azimuth+angle_movement*180/Math.PI;

		var X0=(earth_radius)*Math.cos(azimuth)*Math.sin(polar);
		var Y0=(earth_radius)*Math.sin(azimuth)*Math.sin(polar);
		var Z0=(earth_radius)*Math.cos(polar);

		var angle_ISS=(51.64*Math.PI/180)%(2*Math.PI);
		var X1=X0*Math.cos(angle_ISS)+Z0*Math.sin(angle_ISS);
		var Y1=Y0
		var Z1=-X0*Math.sin(angle_ISS)+Z0*Math.cos(angle_ISS);

		var angle_Z_terre=(2*3*Math.PI/86400)%(2*Math.PI);
		var X2=X1*Math.cos(angle_Z_terre)-Y1*Math.sin(angle_Z_terre);
		var Y2=X1*Math.sin(angle_Z_terre)+Y1*Math.cos(angle_Z_terre);
		var Z2=Z1;

		lat=(Math.asin(Z2/earth_radius)*180/Math.PI)%360;
		lon=(Math.atan2(Y2,X2)*180/Math.PI)%360;

		markers.clearLayers();
		latitude=Math.round(lat*1000)/1000;
		longitude=Math.round(lon*1000)/1000;
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
	};*/


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
			speed_ISS.innerHTML="<input id='range_speed_ISS' type='range' value='1' max='100' min='-100' step='1'>"
			var speed_ISS=document.getElementById("range_speed_ISS");
			speed_ISS.addEventListener('change',function(ev){
				var display_speed=document.getElementById("display_speed");
				display_speed.innerHTML="The ISS' speed is : "+speed_ISS.value*27600+" km/h"
			});
			clearInterval(Interval_ISS);
			Interval_Homemade=setInterval(function(){update_iss(speed_ISS.value)},500);
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
