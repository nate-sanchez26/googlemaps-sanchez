let map;
//markers array to be used for filtering
var markers = [];
//will keep the value of the current marker
var currentMarker;

//map center
const cebu = {lat:10.318813401005881, lng:123.90501611051401};

//map options
const mapOptions = {
  zoom: 15,
  center: cebu,
  disableDefaultUI: true,
};

//variables for directions service and display
var directionsService;
var directionsDisplay;
var placesService;

//request body variables
var markerRequest;
var routeRequest;

//polygons and infowindows
var polygon;
var poly;
var infoWindow;

//variables for custom control panels on the map
var polygonPanel;
var restaurantTypeControl;
var directionControl;
var directionPanel;

//list of restaurants
// var restaurants = [
//   {
//     name:'Jollibee',  
//     coor:{
//       lat:10.315496186027332, 
//       lng:123.8851858195529
//     }, 
//     info:{
//       specialty:["chicken", "burger"], 
//       type:"fastfood"
//     }
//   },

//   {
//     name:'Dimsum Break', 
//     coor:{
//       lat:10.315189144810086, 
//       lng:123.88434384468515
//     },
//     info:{
//       specialty:["dimsum", "noodles-"], 
//       type:"chinese"
//     }
//   },

//   {
//     name:"Malou's Pochero", 
//     coor:{
//       lat:10.315125826718594, 
//       lng:123.89013099800937
//     }, 
//     info:{
//       specialty:["pochero"], 
//       type:"filipino"
//     }
//   },

//   {
//     name:"Chowking", 
//     coor:{
//       lat:10.316004131634337, 
//       lng:123.88567504297937
//     }, 
//     info:{
//       specialty:["chinese food"], 
//       type:"chinese"
//     }
//   },

//   {
//     name:"McDonald's", 
//     coor:{
//       lat:10.310680876301069, 
//       lng:123.89307523346073
//     }, 
//     info:{
//       specialty:["burger"], 
//       type:"fastfood"
//     }
//   },
// ];

//initialize map
function initMap() {
  //variables for google maps and libraries
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();
  infoWindow = new google.maps.InfoWindow();
  placesService = new google.maps.places.PlacesService(map);

  //variables for custom control panels on the map
  restaurantTypeControl = document.getElementById('restaurantTypeContainer');
  directionControl = document.getElementById('directionControl');
  directionPanel = document.getElementById('output');
  polygonPanel = document.getElementById('polygonInfo');

  //retrieve all restaurants within 2200 radius
  markerRequest = {
    location: cebu,
    radius: 10000,
    type: "restaurant",
  };
  
  placesService.nearbySearch(markerRequest, (result) => {
    //plot multiple restaurants across Cebu City
    for (let i = 0; i < result.length; i++) {
      plotMarkers(result[i], infoWindow);
    }
  });

  console.log(markers);

  //push custom controls to the map
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(restaurantTypeControl);

  map.controls[google.maps.ControlPosition.LEFT].push(directionControl);

  map.controls[google.maps.ControlPosition.RIGHT].push(directionPanel);

  map.controls[google.maps.ControlPosition.TOP].push(polygonPanel);

  countArea();
  
};

function calcRoute() {

  directionsDisplay.setMap(map);

  routeRequest = {
    origin: document.getElementById("from").value,
    destination: document.getElementById("to").value,
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.IMPERIAL,
  }

  directionsService.route(routeRequest, (result,status) => {
    if (status == google.maps.DirectionsStatus.OK) {
      
      const output = document.querySelector('#output');
      output.innerHTML = null;

      //display waypoint panel
      directionsDisplay.setPanel(document.getElementById('output'));
      
      //draw polyline on map
      directionsDisplay.setDirections(result);

    } else {
      //when there is an error retrieving route
      directionsDisplay.setDirections({ routes: []});

      map.setCenter(cebu);

      output.innerHTML =
      "<div class='alert-danger'><p1>Error Retrieving Directions</p></div>";
    }
  });
};

//function to plot markers and infoWindows
function plotMarkers(restaurants, infoWindow) {

  var restaurantType = restaurants.types;
  var restaurantTitle = restaurants.name;
  var restaurantPosition = restaurants.geometry.location;
  var icon = 'https://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png'
  var restaurantInfo = 
  '<h4>' + restaurantTitle + '</h4>' +
	'<p>' + restaurantType +
		'<br />' +
	'</p>';
  
    marker = new google.maps.Marker({
      title: restaurantTitle,
      position: restaurantPosition,
      icon:icon,
      map:map,
      type:restaurantType
    });

    //add a click event that pops up an infowindow and sets destination
    google.maps.event.addListener(marker, 'click', function(evt) {
      infoWindow.close();
      infoWindow.setContent(restaurantInfo);
      infoWindow.open(map, this);
      currentMarker = restaurantTitle;
      console.log(currentMarker);
      const toInput = document.getElementById("to");
      toInput.value=currentMarker;

      const fromInput = document.getElementById("from");
      fromInput.value="Mactan-Cebu International Airport";
    });

    markers.push(marker);
};

//filter restaurants according to type
function filterMarkers(category) {
  console.log("category=" + category);
  switch (category) {
    case "hotel":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "hotel"
        if (marker.type.includes("lodging")) {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
    case "bar":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "bar"
        if (marker.type.includes("bar")) {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
    case "cafe":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "cafe"
        if (marker.type.includes("cafe") || marker.type.includes("health")) {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
      case "bakery":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "bakery"
        if (marker.type.includes("bakery")) {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
    default:
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        marker.setVisible(true);
      }
  }
};

function countArea() {
  polygon = new google.maps.Polygon({
    strokeColor: "#1E41AA",
    strokeOpacity: 1.0,
    strokeWeight: 3,
    map: map,
    fillColor: "#FF0000",
    fillOpacity: 0.6
  });

  poly = polygon.getPath();

  function addPolyPoints(e) {
    poly.push(e.latLng);
    var markerCnt = 0;
    for (var i=0; i<markers.length; i++) {
      if (google.maps.geometry.poly.containsLocation(markers[i].getPosition(), polygon) && markers[i].visible == true) {
      markerCnt++;
      }
    }
    polygonPanel.innerHTML = 
    "<p>(Click multiple points on the map to plot area!)</p>" +
    "<h5>Restaurants in Area:</h5> "+markerCnt;
  };

  google.maps.event.addListener(map, 'click', addPolyPoints);

  google.maps.event.addListener(polygon, 'click', function() {
    this.setMap(null);
  });
}