let map;
//markers array to be used for filtering
var markers = [];
var restoData = {};

//will keep the value of the current marker
var currentMarkerID;
var currentMarkerName;
var currentMarkerLat;
var currentMarkerLng;

//map center
const cebu = {lat:10.318813401005881, lng:123.90501611051401};

//map options
const mapOptions = {
  zoom: 14,
  center: cebu,
  disableDefaultUI: true,
};

//variables for directions service and display
var directionsService;
var directionsDisplay;
var placesService;
var drawingManager;

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
var visitsPanel;

//initialize map
function initMap() {
  //variables for google maps and libraries
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();
  infoWindow = new google.maps.InfoWindow({
    maxWidth: 295
  });
  placesService = new google.maps.places.PlacesService(map);

  //variables for custom control panels on the map
  restaurantTypeControl = document.getElementById('restaurantTypeContainer');
  directionControl = document.getElementById('directionControl');
  directionPanel = document.getElementById('output');
  polygonPanel = document.getElementById('polygonInfo');
  visitsPanel = document.getElementById('placeVisits');

  //retrieve all restaurants within 2200 radius
  // markerRequest = {
  //   location: cebu,
  //   radius: 2200,
  //   type: "restaurant",
  // };

  //drawing manager for polygon drawing
  initializePolygon();

  //creates a new polygon and listener for drawing polygons
  setCountArea();
  
  //plot multiple restaurants across Cebu City
  $.getJSON('./restaurants.json', function(result) {
    restoData = result.restaurants; 
    console.log(restoData);

    for (let i = 0; i < restoData.length; i++) {
      plotMarkers(restoData[i], infoWindow, i);
    };
    
  });

  console.log(markers);

  //push custom controls to the map
  setMapControls ();
};

function calcRoute() {

  directionsDisplay.setMap(map);

  routeRequest = {
    origin: "Mactan-Cebu International Airport",
    destination: {
      lat: currentMarkerLat, 
      lng: currentMarkerLng
    },

    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.IMPERIAL,
  }

  directionsService.route(routeRequest, (result,status) => {
    if (status == google.maps.DirectionsStatus.OK) {
      
      directionPanel.innerHTML = null;

      //display waypoint panel
      directionsDisplay.setPanel(directionPanel);
      directionPanel.style.display = "block";

      directionPanel.innerHTML = 
      "<div class='col-md-1 offset-md-11'>" + 
        "<button type='button' class='btn-close' onclick='closePanel();'>" +
        '</button>' + 
      '</div>';

      //draw polyline on map
      directionsDisplay.setDirections(result);

    } else {
      //when there is an error retrieving route
      directionsDisplay.setDirections({ routes: []});

      map.panTo(cebu);

      directionPanel.innerHTML =
      "<div class='alert-danger'><p1>Error Retrieving Directions</p></div>";
    }
  });
};

//function to plot markers and infoWindows
function plotMarkers(result, infoWindow, index) {

  //private variables for EACH marker to be pushed in array
  //var restaurantID = result.place_id;
  var restaurantTitle = result.name;
  var restaurantPosition = result.coor;
  var restaurantVisits = result.visits;
  var i = index;
  console.log(index)



  var restaurantType = result.info.type;
  var restaurantDescription = result.info.description;
  var restaurantSpecialty = result.info.specialty;
  
  var icon = 'http://maps.google.com/mapfiles/kml/pal2/icon46.png';
  
  var restaurantInfo = 
  "<div class = 'infoWindow'>" +
    '<h4>' + restaurantTitle + '</h4>' +
    '<br./>' +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Restaurant Type:  </b></p>" +
      "<p style='display:inline'>" + restaurantType + '</p>' +
    "</div>" +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Description:  </b></p>" +
      "<p style='display:inline'>" + restaurantDescription + '</p>' +
    "</div>" +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Specialty:  </b></p>" +
      "<p style='display:inline'>" + restaurantSpecialty + '</p>' +
    "</div>" +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Visits:  </b></p>" +
      "<p style='display:inline'>" + restaurantVisits + '</p>' +
    "</div>" +
    
    "<button id='getDirections' class='btn btn-outline-primary infoWindowButton' onclick='calcRoute();'>Get Directions</button>" +

    "<button id='visitRestaurant' class='btn btn-outline-primary infoWindowButton'>Visit Restaurant</button>" +
    
  '</div>';
  
    marker = new google.maps.Marker({
      title: restaurantTitle,
      position: restaurantPosition,
      icon:icon,
      map:map,
      type:restaurantType,
      animation:google.maps.Animation.DROP
    });

    marker.visits = restaurantVisits;

    //add a click event that pops up an infowindow and sets destination
    google.maps.event.addListener(marker, 'click', function(evt) {
      infoWindow.close();
      infoWindow.setContent(restaurantInfo);
      infoWindow.open(map, this);
      map.panTo(restaurantPosition);
      map.setZoom(15);

      setNavigation (restaurantTitle, restaurantPosition, currentMarkerName);

    });

    markers.push(marker);
};

function setCountArea() {

  polygon = new google.maps.Polygon({
    strokeColor: "#1E41AA",
    strokeOpacity: 1.0,
    strokeWeight: 3,
    map: map,
    fillColor: "#FF0000",
    fillOpacity: 0.6
  });

  google.maps.event.addListener(drawingManager, 'overlaycomplete', addPolyPoints);

  // google.maps.event.addListener(map, 'click', addPolyPoints);
}

//filter restaurants according to type
function filterMarkers(category) {
  console.log("category=" + category);
  switch (category) {
    case "FastFood":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "FastFood"
        if (marker.type === "FastFood") {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
    case "Chinese":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "Chinese"
        if (marker.type === "Chinese") {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
    case "Filipino":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "Filipino"
        if (marker.type === "Filipino") {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
      case "Japanese":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "Japanese"
        if (marker.type === "Japanese") {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
      case "Korean":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "Korean"
        if (marker.type === "Korean") {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      
      break;
      case "American/Western":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "American/Western"
        if (marker.type === "American/Western") {
          marker.setVisible(true);
        }
        // Categories don't match 
        else {
          marker.setVisible(false);
        }
      }
      break;
      case "Beverage Shop":
      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        // if category is "Beverage Shop"
        if (marker.type === "Beverage Shop") {
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

//helper functions
function addPolyPoints(e) {
  poly = e.overlay.getPath();

  polygon.setPaths(poly);

  e.overlay.setMap(null);

  var markerCnt = 0;

  for (var i=0; i < markers.length; i++) {
    if (google.maps.geometry.poly.containsLocation(markers[i].getPosition(), polygon) && 
    markers[i].visible == true) {
      markerCnt++;
    }
  }

  polygonPanel.innerHTML = 
  "<h5>Restaurants in Area:</h5> "+
  '<p>'+
  markerCnt +
  '</p>'+
  "<button class='btn btn-outline-primary' onclick='resetCounter();'>Reset</button>";
};

function setNavigation (restaurantTitle, restaurantPosition, currentMarkerName) {
  currentMarkerName = restaurantTitle;
  currentMarkerLat = restaurantPosition.lat;
  currentMarkerLng = restaurantPosition.lng;
  
  console.log(currentMarkerName);

  //set destination
  const toInput = document.getElementById("to");
  toInput.value=currentMarkerName;
  //set origin 
  const fromInput = document.getElementById("from");
  fromInput.value="Mactan-Cebu International Airport";
}

function resetCounter() {
    polygon.setMap(null);
    markerCnt = 0;

    polygonPanel.innerHTML = 
      "<h5>Restaurants in Area:</h5> "+
      '<p>'+
      markerCnt +
      '</p>'+
      "<button class='btn btn-outline-primary' onclick='resetCounter();'>Reset</button>";

    setCountArea();
    map.panTo(cebu);
    map.setZoom(14);
};

function closePanel() {
  directionPanel.innerHTML = null;
  directionPanel.style.display = "none";
  infoWindow.close();
  directionsDisplay.setMap(null);
  map.panTo(cebu);
  map.setZoom(14);
};

function initializePolygon () {
  //drawing manager for polygon drawing
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,
      ],
    },
  });

  drawingManager.setMap(map);
}

function setMapControls () {
  //push custom controls to the map
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(leftControl);

  map.controls[google.maps.ControlPosition.RIGHT].push(directionPanel);
  directionPanel.style.display = 'none';

  map.controls[google.maps.ControlPosition.LEFT].push(polygonPanel);

  map.controls[google.maps.ControlPosition.LEFT].push(visitsPanel);
}

function saveDataToSessionStorage(data)
{
    var a = [];
    // Parse the serialized data back into an aray of objects
    a = JSON.parse(sessionStorage.getItem('session')) || [];
    // Push the new data (whether it be an object or anything else) onto the array
    a.push(data);
    // Alert the array value
    console.log(a);  // Should be something like [Object array]
    // Re-serialize the array back into a string and store it in localStorage
    sessionStorage.setItem('session', JSON.stringify(a));
}