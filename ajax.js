	var map = L.map('map').setView([20,0], 3);
	L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }).addTo(map);
	L.control.scale().addTo(map);

	var markers = new L.FeatureGroup();
	var old_lng=0;
	var position_ISS=[];
	var indice_trait=[0];
	var latitude=0;
	var longitude=0;
	var zoom=0;
	var i=0;
	var Interval_ISS;
	var Interval_Homemade;

	var earth_radius=6371;
	var earth_speed=1/240;
	var earth_rotation=0;

	var iss_speed=7+2/3;
	var iss_altitude=400;
	var iss_angle=51.64;
	var iss_latitude=null;
	var iss_longitude=null;
	var iss_polar=Math.PI/2;
	var iss_azimuth=0;
	var iss_time=0;

	var box_manual_speed=document.getElementById("box_manual_speed");
	process_speed();
	box_manual_speed.addEventListener('click', process_speed);

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



	function process_speed(){
		if (box_manual_speed.checked){
			var speed_ISS=document.getElementById("speed_ISS");
			speed_ISS.innerHTML="<input id='range_speed_ISS' type='range' value='1' max='100' min='-100' step='1'>"
			var speed_ISS=document.getElementById("range_speed_ISS");
			speed_ISS.addEventListener('mousemove',function(ev){
				var display_speed=document.getElementById("display_speed");
				display_speed.innerHTML="The ISS' speed is : "+speed_ISS.value*27600+" km/h"
			});
			clearInterval(Interval_ISS);
			position_ISS = [];
			indice_trait = [0];
			Interval_Homemade=setInterval(function(){personnal_speed(speed_ISS.value)},500);
		}
		else{
			var speed_ISS=document.getElementById("speed_ISS");
			speed_ISS.innerHTML="";
			var display_speed=document.getElementById("display_speed");
			display_speed.innerHTML="The ISS' speed is : 27600 km/h";
			clearInterval(Interval_Homemade);
			position_ISS = [];
			indice_trait = [0];
			Interval_ISS=setInterval(function(){api_speed()},500);
		}
	}


	function api_speed(){
		var ajax = new XMLHttpRequest();
		ajax.open('GET', "https://api.wheretheiss.at/v1/satellites/25544", true);
		ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		ajax.addEventListener('readystatechange',  function(e) {
			if(ajax.readyState == 4 && ajax.status == 200) {
				response=JSON.parse(ajax.responseText);
				markers.clearLayers();
				latitude = Math.round(response.latitude*1000)/1000;
				longitude = Math.round(response.longitude*1000)/1000;
				display_iss();
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
		};
	};


	function personnal_speed(speed_factor=1){
	  if(iss_time==0){
			init();
		};
	  var time=Date.now();
	  var delta_time=(time-iss_time)/1000;
	  iss_time=time;

	  iss_azimuth+=speed_factor*delta_time*iss_speed/(iss_altitude+earth_radius);
	  iss_azimuth=iss_azimuth%(2*Math.PI);

	  var x=earth_radius*Math.cos(iss_azimuth)*Math.sin(iss_polar);
	  var y=earth_radius*Math.sin(iss_azimuth)*Math.sin(iss_polar);
	  var z=earth_radius*Math.cos(iss_polar);

	  var rot_angle=(iss_angle*Math.PI/180)%(2*Math.PI);
	  var rotation=rotate(x,y,z,rot_angle,'y');
	  x=rotation[0];
		y=rotation[1];
		z=rotation[2];

	  earth_rotation+=speed_factor*delta_time*2*Math.PI/86400;
	  earth_rotation=earth_rotation%(2*Math.PI);
	  rotation=rotate(x,y,z,earth_rotation,'z');
	  x=rotation[0];
		y=rotation[1];
		z=rotation[2];

	  var tmp=(z/earth_radius);
	  iss_latitude=(Math.asin(tmp)*180/Math.PI)%360;
	  iss_longitude=(Math.atan2(y,x)*180/Math.PI)%360;

		markers.clearLayers();
		latitude=Math.round(iss_latitude*1000)/1000;
		longitude=Math.round(iss_longitude*1000)/1000;

		display_iss();

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
		};
	 };

	  function rotate(x1,y1,z1,angle,axis){
	    var x2;
			var y2;
			var z2;
	    switch(axis){
	      case 'x':
	        x2=x1;
	        y2=y1*Math.cos(angle)-z1*Math.sin(angle);
	        z2=y1*Math.sin(angle)+z1*Math.cos(angle)
	        break;

	      case 'y':
	        x2=z1*Math.sin(angle)+x1*Math.cos(angle);
	        y2=y1;
	        z2=z1*Math.cos(angle)-x1*Math.sin(angle);
	        break;

	      case 'z':
	        x2=x1*Math.cos(angle)-y1*Math.sin(angle);
	        y2=x1*Math.sin(angle)+y1*Math.cos(angle);
	        z2=z1;
	        break;
	    }
	    return [x2,y2,z2];
	  }

	  function init(){
	    iss_latitude = 0;
	    iss_longitude = 0;
	    iss_polar = Math.PI/2;
	    iss_azimuth = 0;
	    iss_time = Date.now();
	  }

	function display_iss(){
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
		if (position_ISS.length!=0 && old_lng<=-170 && old_lng>=-180 && longitude>=170 && longitude<=180){indice_trait.push(position_ISS.length);i=0;};
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
