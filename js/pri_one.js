/* scripts for the viz */
/* globals */
var schoolCoords = []
var clickCircle1;
var clickCircle2;
var clickCircleCentre;

/* basic address search, simply returns the first entry */
function SearchAddress() {
	searchVal = document.getElementById("searchVal").value;
    var xhr = new XMLHttpRequest();
	xhr.open("GET","https://developers.onemap.sg/commonapi/search?searchVal=" + searchVal + "&returnGeom=Y&getAddrDetails=Y&pageNum=1",true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				var response = JSON.parse(xhr.responseText);
				if (response.results.length > 0) {
					resultlatlng = [response.results[0].LATITUDE, response.results[0].LONGITUDE];
					listSchools(resultlatlng);
				} else {
					alert("Could not find this address, building or postal code!");
				}				
			} else if (searchVal == '') {
				alert("Please input an address or postal code."); 
			} else {
				alert("Search request failed - Try again later please.");
			}
		}
	}
	xhr.send(null);   
}

/* school popup function */
function schoolPopup(feature, layer) {
	var mtM = feature.properties.MT.includes('M') ? 'Malay':'';
	var mtC = feature.properties.MT.includes('C') ? 'Chinese':'';
	var mtT = feature.properties.MT.includes('T') ? 'Tamil':'';
	var years = [2017,2016,2015,2014];
	var Y0_features = feature.properties.Y0.split(',');
	var Y1_features = feature.properties.Y1.split(',');
	var Y2_features = feature.properties.Y2.split(',');
	var Y3_features = feature.properties.Y3.split(',');
	var p_name = ['Phase 1','Phase 2A1','Phase 2A2','','','Phase 2B','','Phase 2C','','Phase 2C(S)'];
	// stuff coordinates into an array for distance calculations later.  Reversed coordinates again cos of GeoJSON
	schoolCoords.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);

	function displayYear(x) {
		var ret = '<th>';
		ret = ret + x + ' (' + zodiac(x) + ')';
		ret = ret + '</th>';
		return ret;
	}
	
	function displayPlace(x) {
		var ret = '<td class="td1">';
		ret = ret + ((x == 0) ? '-' : '<b>' + x + '</b>');
		ret = ret + '</td>';
		return ret;
	}
		
	function displayOcc(x) {
		var ret = '<td class="td1">';
		if (x == 0) {
			ret = ret + '-';
		} else ret = ret + ((x >= 100) ? '<b>' + x + '%</b></td>' : x + '%</td>');
		return ret;
	}

	function displayOccApp(x, y) {
		var ret = '<td class="td1">';
		if (x == 0 && y <= 0.01) {
			ret = ret + '-</td>'; 
		} else {
			ret = ret + '<div style="width:50%; float:left">';
			if (x == 0) {
				ret = ret + '-';
			} else ret = ret + ((x >=100) ? '<b>' + x + '%</b>': x + '%'); 
	
			ret = ret + '</div><div style="width:50%; float:right">';	
						
			if (y > 1.00) {
				ret = ret + '<b>(' + y + ')</b>';
			} else ret = ret + ((y <= 0.01) ? '( - )' : '(' + y + ')');
			ret = ret + '</div></td>';
		}
		return ret;
	}
						
	var sch_data = '<div><span id="schoolname">'+feature.properties.School+'</span></div>';
	sch_data = sch_data + '<div id="schoolinfo">';
	sch_data = sch_data + '<span id="highlight1">' + feature.properties.Nature + '</span>';
	if (feature.properties.HFac == 'YES') {
		sch_data = sch_data + '<span id="highlight1">HANDICAP FACILITIES</span>';
	}	
	if (feature.properties.GEP == 'YES') {
		sch_data = sch_data + '<span id="highlight1">GEP</span>';
	}
	if (feature.properties.SAP == 'YES') {
		sch_data = sch_data + '<span id="highlight1">SAP</span>';
	}
	sch_data = sch_data + '</div><div="schoolinfo">'
	if (feature.properties.MT.includes('M')) {
		sch_data = sch_data + '<span id="highlight2">MALAY</span>';
	}
	if (feature.properties.MT.includes('C')) {
		sch_data = sch_data + '<span id="highlight2">CHINESE</span>';
	}
	if (feature.properties.MT.includes('T')) {
		sch_data = sch_data + '<span id="highlight2">TAMIL</span>';
	}
	sch_data = sch_data + '</div>';
	
	sch_data = sch_data + '<table id="stats_table">';
	sch_data = sch_data + '<tr><th></th>' + displayYear(years[0]) + displayYear(years[1]) + displayYear(years[2]) + displayYear(years[3]) + '</tr>';		
	
	sch_data = sch_data + '<tr><td class="td0">Places</td>' + displayPlace(Y0_features[0]) + displayPlace(Y1_features[0]) + displayPlace(Y2_features[0]) + displayPlace(Y3_features[0]) + '</tr>';
	
	for (i=1;i<4;i++) {
		sch_data = sch_data + '<tr><td class="td0">' + p_name[i-1] + '</td>' + displayOcc(Y0_features[i]) + displayOcc(Y1_features[i]) + displayOcc(Y2_features[i]) + displayOcc(Y3_features[i]) + '</tr>';
	}
	
	for (i=5;i<10;i+=2) {
		sch_data = sch_data + '<tr><td class="td0">' + p_name[i] + '</td>' + displayOccApp(Y0_features[i], Y0_features[i-1]) + displayOccApp(Y1_features[i], Y1_features[i-1]) + displayOccApp(Y2_features[i], Y2_features[i-1]) + displayOccApp(Y3_features[i], Y3_features[i-1]);
	}
	
	sch_data = sch_data + '</table>';

	layer.bindPopup(sch_data, {maxWidth: '400', className: 'custom-popup'});

	/* marker functionality */
	/* enable marker highlighting on mouseovers */
	var mapIcon = L.Icon.Default.extend({});
	var regIcon = new mapIcon({ iconUrl: "marker-icon.png" });
	var highIcon = new mapIcon({ iconUrl: "marker-icon2.png" });
	layer.on('mouseover', function(e) { layer.openPopup(); e.target.setIcon(highIcon); });
	layer.on('mouseout', function(e) { e.target.setIcon(regIcon); layer.closePopup(); });
	}

/* function to identify schools within 2km of clicked/searched point */
function listSchools(latlng) {
	var origin = L.latLng(latlng);
	
	// clear existing circles
	if (clickCircleCentre != undefined) {
		map.removeLayer(clickCircle1);
		map.removeLayer(clickCircle2);
		map.removeLayer(clickCircleCentre);
	}
	// draw circles
	clickCircle1 = L.circle(origin, 2000, {
		color: '#f07300',
		opacity: 0.3
	}).addTo(map);
	
	clickCircle2 = L.circle(origin, 1000, {
		color: '#f07300',
		opacity: 0.5
	}).addTo(map);		
	
	clickCircleCentre = L.circle(origin, 2, {
		color: '#000000',
		opacity: 0.75
	}).addTo(map);		
	
	map.setView(origin, 14);
	
	/* iterate through the list of schools to check if they are within the circles*/		
	nearbySchools = [];
			
	for (i=0;i<schoolCoords.length;i++) {
		dist = origin.distanceTo(schoolCoords[i]);
		if (dist<=2000) {
			nearbySchools.push({ sch_index: i, sch_dist: dist });
		}
	}
	nearbySchools = nearbySchools.sort(function(a,b) { return a.sch_dist - b.sch_dist});
	
	var sch_list = document.getElementById("sch_list");
	while(sch_list.firstChild) {
		sch_list.removeChild(sch_list.firstChild);
	}
	if (nearbySchools.length == 0) {
		var sch_text = document.createElement("em");
		sch_text.appendChild(document.createTextNode("No schools within 2km of specified point"));
		document.getElementById("sch_list").appendChild(sch_text);
	} else {
		for (i=0;i<nearbySchools.length;i++) {
			var sch_text = document.createElement("button");
			sch_text.setAttribute("class","buttonResults");
			var sch_text_name = document.createElement("b");
			sch_text_name.appendChild(document.createTextNode(schools.features[nearbySchools[i].sch_index].properties.School));
			sch_text.appendChild(sch_text_name);
			sch_text.appendChild(document.createElement("br"));
			sch_text.appendChild(document.createTextNode((nearbySchools[i].sch_dist/1000).toFixed(1) + ' km'));
			sch_text.setAttribute("onclick","buttonClick(" + nearbySchools[i].sch_index + ")");
			sch_text.setAttribute("ondblclick","dblbuttonClick(" + nearbySchools[i].sch_index + ")");
			sch_text.setAttribute("title","Click once to show school statistics.  Double-click to open school webpage in a new tab.");
			document.getElementById("sch_list").appendChild(sch_text);
		}
	}	
}

/* show popup when school in list is clicked on */
function buttonClick(x) {
	geoJSONLayer.getLayers()[x].openPopup()
}

/* when double-clicked, open a new browser window and go to school URL */
function dblbuttonClick(x) {
	window.open('http://' + schools.features[x].properties.url, '_blank');
}

/* helper function */
function onMapClick(e) {
	listSchools(e.latlng);
}
	
/* zodiac year computation*/
function zodiac(x) {
	var zodiac = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Sheep','Monkey','Rooster','Dog','Pig'];
	var refYear = 1996;
	var priSchoolAge = 6;
	whichZodiac = zodiac[(x - refYear + priSchoolAge)%12];
	return whichZodiac;
}
	


