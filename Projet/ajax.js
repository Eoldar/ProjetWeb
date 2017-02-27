//Execution code
//Load the leaflet map and chose a personal style, set the view at (20,0) with a zoom of 3
var map = L.map('map').setView([20, 0], 3);
L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {maxZoom: 17, attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'}).addTo(map);
L.control.scale().addTo(map);

//Define all the variable used in the code
var markers = new L.FeatureGroup(); //Layer of markers in the map
var old_lng = 0; //Old longitude, used in the test between -180 and 180 or 180 and -180
var position_ISS = []; //All the coordinates of the ISS stored in a single table
var indice_trait = [0]; //The index used to draw the lines
var latitude = 0; //Current latitude of the ISS
var longitude = 0; //Current longitude of the ISS
var zoom = 0; //Zoom used to display the picture taken
var i = 0; //Iteratable index used to draw the lines
var Interval_ISS; //The loop to update the position of the ISS with the API
var Interval_Homemade; //The loop to update the position of the ISS with our service

var earth_radius = 6371; //The radius of the earth in km
var earth_speed = 1 / 240; //The speed of the earth
var earth_rotation = 0;

var iss_speed = 7 + 2 / 3;
var iss_altitude = 400; //The altitude of the ISS
var iss_angle = 51.64; //The angle of rotation
var iss_latitude = null; //The current latitude of the ISS
var iss_longitude = null; //The current longitude of the ISS
var iss_polar = Math.PI / 2; //The polar angle of the ISS (90°=Equator)
var iss_azimuth = 0; //The azimuth angle of the ISS
var iss_time = 0; //The time since the first connection

//Check if the box is checked to know which model to use: personal or API
var box_manual_speed = document.getElementById("box_manual_speed");
process_speed();
box_manual_speed.addEventListener('click', process_speed);

//The tweet part of the application, Display the picture and the text
var zoom_picture_ISS = document.getElementById("picture_submit");
zoom_picture_ISS.addEventListener('click', function (ev) { //EventListener on the "Tweet like Pesquet"-button
	ev.preventDefault();
	var smartphone_zoom_ISS = document.getElementById("smartphone_zoom_ISS");
	var reflex_zoom_ISS = document.getElementById("reflex_zoom_ISS");
	var teleobjective_zoom_ISS = document.getElementById("teleobjective_zoom_ISS");
	//Check which zoom is selected
	if (smartphone_zoom_ISS.checked){
		zoom = smartphone_zoom_ISS.value;};
	if (reflex_zoom_ISS.checked){
		zoom = reflex_zoom_ISS.value;};
	if (teleobjective_zoom_ISS.checked){
		zoom = teleobjective_zoom_ISS.value;};
	//Be sure not to display a picture when no zoom is selected
	if (zoom != 0){
		var picture_ISS = document.getElementById("picture");
		var height = 450; //The height of the picture
		var width = 600; //The width of the picture
		picture_ISS.innerHTML = "<img src='https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"+longitude+","+latitude+","+zoom+","+Math.random()*360+",50/"+width+"x"+height+"?access_token=pk.eyJ1IjoiZW9sZGFyIiwiYSI6ImNpeW4xOG1hMjAwNGozM3FsYnFheWJzOXYifQ.hZAFQxA9xQWMObZqfWdtog' alt='PictureFromISS'/>"
		var picture_cross = document.getElementById("cross");
		picture_cross.innerHTML = "<img id='cross_click' src='Pictures/Cross.png' alt='Exit'>"; //Display a little cross to destroy the picture
		document.getElementById("cross_click").addEventListener('click',function(ev){ //EventListener on the cross
			var picture_ISS = document.getElementById("picture");
			var message = document.getElementById("message");
			var exit = document.getElementById("cross");
			picture_ISS.innerHTML = "";
			message.innerHTML = "";
			exit.innerHTML = "";
		});
		var ajax2 = new XMLHttpRequest();
		ajax2.open('GET', "http://api.geonames.org/extendedFindNearby?lat="+latitude+"&lng="+longitude+"&username=eoldar", true); //Ask for the nearby place
		ajax2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		ajax2.addEventListener('readystatechange',  function(e) {
			if(ajax2.readyState == 4 && ajax2.status == 200) {
				response=ajax2.responseXML;
				var Json=xmlToJson(response); //Convert the XML to a JSON format
				var message=document.getElementById("message");
				if (Json.geonames['#text'].length==2){ //If the length is 2, we are above an ocean
					message.innerHTML="Hello "+Json.geonames.ocean.name['#text'];}
				else { //Otherwise we are above land, and we display "Hello City, Country, Continent"
					message.innerHTML="Hello "+Json.geonames.geoname[Json.geonames.geoname.length-1].toponymName['#text']+", "+Json.geonames.geoname[2].toponymName['#text']+", "+Json.geonames.geoname[1].toponymName['#text'];}
			}
		});
		ajax2.send();
	}
});



//Load all the Functions
function process_speed() { //Function which calculate the new position of the ISS
 var box_manual_speed = document.getElementById("box_manual_speed");
 if (box_manual_speed.checked){ //If the box is checked, we calculate the position with our own function
		var speed_ISS=document.getElementById("speed_ISS");
		speed_ISS.innerHTML="<input id='range_speed_ISS' type='range' value='1' max='100' min='-100' step='1'>" //Display the range selector (select the speed of the ISS)
		var speed_ISS=document.getElementById("range_speed_ISS");
		speed_ISS.addEventListener('mousemove',function(ev){ //Change the text of the actual speed
			var display_speed=document.getElementById("display_speed");
			display_speed.innerHTML="The ISS' speed is : "+speed_ISS.value*27600+" km/h" //Calculate the normal speed of the ISS (27600km/h)*speed factor
		});
		clearInterval(Interval_ISS); //We clear the API speed interval
		position_ISS=[]; //We clear the lines drawn until then
		indice_trait=[0];
		Interval_Homemade=setInterval(function(){personnal_speed(speed_ISS.value)},500); //We begin a new Personal speed interval each 500ms
	}
	else{ //If the box is not checked we calculate the position by askinkg the API
		var speed_ISS=document.getElementById("speed_ISS");
		speed_ISS.innerHTML=""; //We delete the range bar because we cannot chose the speed anymore
		var display_speed=document.getElementById("display_speed");
		display_speed.innerHTML="The ISS' speed is : 27600 km/h"; //We display the by default speed of the ISS
		clearInterval(Interval_Homemade); //We clear the Personne speed interval
		position_ISS=[]; //We clear the lines drawn until then
		indice_trait=[0];
		Interval_ISS=setInterval(function(){api_speed()},500); //We begin a new API speed interval each 500ms
	}
}


function api_speed(){ //The function which asks the API for the position of the ISS
	var ajax = new XMLHttpRequest();
	ajax.open('GET', "https://api.wheretheiss.at/v1/satellites/25544", true);
	ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	ajax.addEventListener('readystatechange',  function(e) {
		if(ajax.readyState == 4 && ajax.status == 200) {
			response=JSON.parse(ajax.responseText);
			markers.clearLayers(); //We clear the markers
			latitude = Math.round(response.latitude*1000)/1000; //Update the latitude with the response latitude rounded at 3 caracteristic numbers
			longitude = Math.round(response.longitude*1000)/1000;	//Update the longitude with the response longitude rounded at 3 caracteristic numbers
			display_iss(); //Update the map
		};});
	ajax.send();
	var box_follow_ISS=document.getElementById("box_follow_ISS");
	box_follow_ISS.addEventListener('click',function(ev){ //EventListener on the box to follow or not the ISS
		if (box_follow_ISS.checked){ //If we do want to follow the ISS, we set the view centered on the ISS with a 5 zoom
			map.setView([latitude, longitude],5);
		}
		else{ //If we do not want to follow the ISS anymore, we set the zoom to 3 (dezoom)
			map.setView([latitude, longitude],3);
		}
	});
	if (box_follow_ISS.checked){ //We check if the box is checked each time we update the position of the ISS
		map.setView([latitude, longitude],5);
	};
};


function personnal_speed(speed_factor=1){ //The function which calculate the position of the ISS dependeing on the time with a speed factor
  if(iss_time==0){ //If it is the first time we ask, we initiate the position
		init();
	};
  var time=Date.now(); //The current time
  var delta_time=(time-iss_time)/1000; //The difference time between when we ask and the current time
  iss_time=time; //Update the time when we ask

  iss_azimuth+=speed_factor*delta_time*iss_speed/(iss_altitude+earth_radius); //First rotation of the ISS depending on the speed factor and the time
  iss_azimuth=iss_azimuth%(2*Math.PI); //Updating the azimuth angle in radians

  var x=earth_radius*Math.cos(iss_azimuth)*Math.sin(iss_polar); //transformation of the coordinates lat,lng --> x,y,z
  var y=earth_radius*Math.sin(iss_azimuth)*Math.sin(iss_polar);
  var z=earth_radius*Math.cos(iss_polar);

  var rot_angle=(iss_angle*Math.PI/180)%(2*Math.PI); //Second rotation of 51.64° on the Y axis
  var rotation=rotate(x,y,z,rot_angle,'y');
  x=rotation[0]; //Updating the x,y,z coordinates
	y=rotation[1];
	z=rotation[2];

	if (speed_factor==0){
		earth_rotation+=delta_time*2*Math.PI/86400;
	}
	else {
		earth_rotation+=speed_factor*delta_time*2*Math.PI/86400; //Third rotation of the earth during the time delta_time on the Z axis
	}
  earth_rotation=earth_rotation%(2*Math.PI);
  rotation=rotate(x,y,z,earth_rotation,'z');
  x=rotation[0]; //Updating the x,y,z coordinates
	y=rotation[1];
	z=rotation[2];

  var tmp=(z/earth_radius); //temp variable to transform back the x,y,z coordinates
  iss_latitude=(Math.asin(tmp)*180/Math.PI)%360; //Transformation from x,y,z --> lat,lng
  iss_longitude=(Math.atan2(y,x)*180/Math.PI)%360;

	markers.clearLayers(); //Clear the former marker on the map
	latitude=Math.round(iss_latitude*1000)/1000; //Update the current latitude of the ISS
	longitude=Math.round(iss_longitude*1000)/1000; //Update the current longitude of the ISS

	display_iss(); //Update the map

	var box_follow_ISS=document.getElementById("box_follow_ISS");
	box_follow_ISS.addEventListener('click',function(ev){ //EventListener to check if we want to follow the ISS (same as before)
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


function rotate(x1,y1,z1,angle,axis){ //Rotation function, with a certain angle in a certain direction (axis)
  var x2;
	var y2;
	var z2;
  switch(axis){ //Switch depending on the axis
    case 'x': //Rotation matrix for a X-axis
      x2=x1;
      y2=y1*Math.cos(angle)-z1*Math.sin(angle);
      z2=y1*Math.sin(angle)+z1*Math.cos(angle)
      break;
    case 'y': //Rotation matrix for a Y-axis
      x2=z1*Math.sin(angle)+x1*Math.cos(angle);
      y2=y1;
      z2=z1*Math.cos(angle)-x1*Math.sin(angle);
      break;
    case 'z': //Rotation matrix for a Z-axis
      x2=x1*Math.cos(angle)-y1*Math.sin(angle);
      y2=x1*Math.sin(angle)+y1*Math.cos(angle);
      z2=z1;
      break;
  }
  return [x2,y2,z2];
}


function init(){ //Function which initiate the position of the ISS
  iss_latitude = 0;
  iss_longitude = 0;
  iss_polar = Math.PI/2;
  iss_azimuth = 0;
  iss_time = Date.now();
}


function display_iss(){ //Function to display the changes on the map
	var icone = L.icon({iconUrl:'Pictures/ISS.png', iconSize:[50, 50], iconAnchor:[25,25], popupAnchor:[0,-25]}); //Icon of the ISS, size 50x50
	var marker = L.marker([latitude, longitude],{icon: icone}); //Create a marker at the position of the ISS
	markers.addLayer(marker); //Add the marker to the "markers" layer

	var coords=document.getElementById("coordinates");
	if (latitude>=0){var LAT="N"} //If latitude positive --> North
	else if (latitude<0){var LAT="S"}; //If latitude negative --> South
	if (longitude>=0){var LON="E"} //If longitude positive --> East
	else if (longitude<0){var LON="W"}; //If longitude negative --> West
	coords.innerHTML="<p>The ISS' coordinates are :<br> Latitude : "+Math.abs(latitude)+"° "+LAT+" ---- Longitude : "+Math.abs(longitude)+"° "+LON+"</p>"; //Update the text displaying the coordinates of the ISS (Sorry for the br but there was no other way)

	if (position_ISS.length!=0 && old_lng<=180 && old_lng>=170 && longitude>=-180 && longitude<=-170){indice_trait.push(position_ISS.length);i=0;}; //Handling the 180->-180 longitude passage by adding the position in indice_trait
	if (position_ISS.length!=0 && old_lng<=-170 && old_lng>=-180 && longitude>=170 && longitude<=180){indice_trait.push(position_ISS.length);i=0;}; //Handling the -180->180 longitude passage
	i++; //Incrementing the i index to get the coordinates in the big table of coordinates
	position_ISS.push(L.latLng(latitude, longitude)); //Adding the current coordinates of the ISS to the big table of coordinates
	old_lng=longitude; //Changing the old longitude into the current longitude

	for (var j=0; j<indice_trait.length-1;j++){ //Drawing the lines, we draw a line between each indice_trait element.
		var ligne=L.polyline(position_ISS.slice(indice_trait[j],indice_trait[j+1]-1), {color:'red', weight: 5, opacity:1}); //A polyline is drawn with multiples coordinates. We draw one polyline between each element of indice_trait
		markers.addLayer(ligne); //We add all the finish lines to the markers layer
	};
	var ligne_current=L.polyline(position_ISS.slice(indice_trait[indice_trait.length-1],indice_trait[indice_trait.length-1]+i), {color:'red', weight: 5, opacity:1}); //We draw the current polyline which is not ended and will be bigger
	markers.addLayer(ligne_current); //We add this line to the markers layer
	map.addLayer(markers); //And we add the layer to the map
}


// Transformation function from XML to JSON from internet
// Source site : https://davidwalsh.name/convert-xml-json
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
