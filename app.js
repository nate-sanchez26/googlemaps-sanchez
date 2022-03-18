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
const cebu = {
  lat:10.318813401005881, 
  lng:123.90501611051401
};

const cebuAirport = {
  lat:10.310663148480833, 
  lng:123.98020184706628
};

//map options
const mapOptions = {
  zoom: 14,
  center: cebu,
  disableDefaultUI: true,
};

//variables for directions service and display
var directionsService;
var directionsDisplay;
var drawingManager;
var pieChart;

//
var originLat;
var originLng;

//chart variables
var content;
var myChart;

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

//data calculation variables
var fastFoodCount = 0;
var chineseCount = 0; 
var filipinoCount = 0; 
var japaneseCount = 0; 
var koreanCount = 0; 
var americanCount = 0; 
var beverageCount = 0;

var Total;

var fastFoodPct = 0;
var chinesePct = 0; 
var filipinoPct = 0; 
var japanesePct = 0; 
var koreanPct = 0; 
var americanPct = 0; 
var beveragePct = 0;

var chartData = [];
var visitClicked = false;

//INITIALIZERS-START

//initialize map
function initMap() {
  //variables for google maps and libraries
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();

  infoWindow = new google.maps.InfoWindow({
    maxWidth: 295
  });

  //initialize custom control panels on the map
  restaurantTypeControl = document.getElementById("restaurantTypeContainer");
  directionControl = document.getElementById("directionControl");
  directionPanel = document.getElementById("output");
  polygonPanel = document.getElementById("polygonInfo");

  //drawing manager for polygon drawing
  initializePolygon();

  //creates a new polygon and listener for drawing polygons
  setCountArea();

  //create Draggable
  createDragMarker();
  
  //get data from external JSON file
  $.getJSON('./restaurants.json', function(result) {
    restoData = result.restaurants; 
    //plot multiple restaurants across Cebu City
    for (let i = 0; i < restoData.length; i++) {
      plotMarkers(restoData[i], infoWindow, i);
    };
  });

  window.onload = function() {
    //setup the chart
    loadPieChart();
    //push custom controls to the map
    setMapControls();
  };  
  
};

//function to plot markers and infoWindows
function plotMarkers(result, infoWindow, index) {

  //private variables for EACH marker to be pushed in array
  var restaurantTitle = result.name;
  var restaurantPosition = result.coor;
  var restaurantVisits = result.visits;
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

    "<button id='visitRestaurant' class='btn btn-outline-primary infoWindowButton' onclick='visitRestaurant("+index+");'>Visit Restaurant</button>" +
    
  '</div>';
  
    marker = new google.maps.Marker({
      title: restaurantTitle,
      position: restaurantPosition,
      icon:icon,
      map:map,
      type:restaurantType,
      animation:google.maps.Animation.DROP
    });

    marker.description = restaurantDescription;
    marker.specialty = restaurantSpecialty;
    marker.visits = restaurantVisits;
    marker.isEdited = false;

    //add a click event that pops up an infowindow and sets destination
    google.maps.event.addListener(marker, 'click', function(evt) {

      infoWindow.close();

      if(markers[index].isEdited) {
        reloadInfoWindow(index);
      } else {
        infoWindow.setContent(restaurantInfo);
      }
      
      infoWindow.open(map, this);
      map.panTo(restaurantPosition);
      map.setZoom(15);

      setNavigation (restaurantTitle, restaurantPosition, currentMarkerName);

    });
    //push marker to markers array
    markers.push(marker);
};

//create the pie chart
function loadPieChart() {

  computeData();
  
  pieChart = document.getElementById('pieChart');

  content = document.getElementById('myChart').getContext('2d');

  var options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    }
  };

  myChart = new Chart(content, {
      type: 'doughnut',
      data: {
          labels: [
            'FastFood',
            'Chinese', 
            'Filipino', 
            'Japanese', 
            'Korean', 
            'American/Western',
            'Beverage Shop'
          ],
          datasets: [{
            label: 'Visits',
            data: chartData,
            backgroundColor: [
                'rgba(44, 252, 3, 0.2)',
                'rgba(9, 7, 54, 0.2)',
                'rgba(23, 255, 228, 0.2)',
                'rgba(215, 237, 17, 0.2)',
                'rgba(237, 17, 17, 0.2)',
                'rgba(63, 12, 89, 0.2)',
                'rgba(240, 0, 216, 0.2)'

            ],
            borderColor: [
                'rgba(44, 252, 3, 1)',
                'rgba(9, 7, 54, 1)',
                'rgba(23, 255, 228, 1)',
                'rgba(215, 237, 17, 1)',
                'rgba(237, 17, 17, 1)',
                'rgba(63, 12, 89, 1)',
                'rgba(240, 0, 216, 1)',
            ],
            borderWidth: 1
          }]
      },
      options: options,
    })
};

//create polygon
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
};

//create drag marker to simulate user location
function createDragMarker() {
  var vMarker = new google.maps.Marker({
    position: cebuAirport,
    draggable: true,
    icon: 'http://maps.google.com/mapfiles/kml/shapes/man.png'
  });
  // adds a listener to the marker
  // gets the coords when drag event ends
  // then updates the input with the new coords
  google.maps.event.addListener(vMarker, 'dragend', function (evt) {
    
    originLat = parseFloat(evt.latLng.lat());
    originLng = parseFloat(evt.latLng.lng());
    console.log(evt);
    console.log(originLat);
    console.log(originLng);

    geocodePosition(originLat, originLng);

    map.panTo(evt.latLng);
  });

  // adds the marker on the map
  vMarker.setMap(map);
}

//INITIALIZERS-END

//EVENT HANDLERS-START

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

//calculate route and set path
function calcRoute() {

  directionsDisplay.setMap(map);

  routeRequest = {
    origin: {
      lat: originLat, 
      lng: originLng
    },
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

//handle visit restaurant button click
function visitRestaurant(index) {

  markers[index].visits++;
  markers[index].isEdited = true;
  visitClicked = true;

  updatePieChartData(index);

  reloadInfoWindow(index);  
}

//EVENT HANDLERS-END

//HELPER FUNCTIONS-START

//set the polygon area
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
}

//add the points of the drawing manager polygon to the polygon object
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

//reset the marker counter polygon
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
  closePanel();
};

//set navigation origin and destination
function setNavigation (restaurantTitle, restaurantPosition, currentMarkerName) {
  currentMarkerName = restaurantTitle;
  currentMarkerLat = restaurantPosition.lat;
  currentMarkerLng = restaurantPosition.lng;

  //set destination
  const toInput = document.getElementById("to");
  toInput.value=currentMarkerName;
}

//close directions panel
function closePanel() {
  directionPanel.innerHTML = null;
  directionPanel.style.display = "none";
  infoWindow.close();
  directionsDisplay.setMap(null);
  map.panTo(cebu);
  map.setZoom(14);

  document.getElementById('from').value = "Drag human marker anywhere.";
  document.getElementById('to').value = "Click on a marker to set.";
};

//set map controls
function setMapControls () {
  //push custom controls to the map
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(leftControl);

  map.controls[google.maps.ControlPosition.RIGHT].push(directionPanel);
  directionPanel.style.display = 'none';

  map.controls[google.maps.ControlPosition.LEFT].push(polygonPanel);

  map.controls[google.maps.ControlPosition.LEFT].push(visitsPanel);

  map.controls[google.maps.ControlPosition.LEFT].push(pieChart);
}

function reloadInfoWindow(index) {

  var modifiedRestaurantInfo = 
  "<div class = 'infoWindow'>" +
    '<h4>' + markers[index].title + '</h4>' +
    '<br./>' +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Restaurant Type:  </b></p>" +
      "<p style='display:inline'>" + markers[index].type + '</p>' +
    "</div>" +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Description:  </b></p>" +
      "<p style='display:inline'>" + markers[index].description + '</p>' +
    "</div>" +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Specialty:  </b></p>" +
      "<p style='display:inline'>" + markers[index].specialty + '</p>' +
    "</div>" +

    "<div class='infoDivs'>" +
      "<p style='display:inline'><b>Visits:  </b></p>" +
      "<p style='display:inline'>" + markers[index].visits + '</p>' +
    "</div>" +
    
    "<button id='getDirections' class='btn btn-outline-primary infoWindowButton' onclick='calcRoute();'>Get Directions</button>" +

    "<button id='visitRestaurant' class='btn btn-outline-primary infoWindowButton' onclick='visitRestaurant("+index+");'>Visit Restaurant</button>" +
    
  '</div>';

  this.infoWindow.setContent(modifiedRestaurantInfo);
}

//compute data for analytics
function computeData(index) {

  if (!visitClicked) {
    for (i = 0; i < markers.length; i++) {
      if (markers[i].type === "FastFood") {
        fastFoodCount = fastFoodCount+markers[i].visits;
      } else if (markers[i].type === "Chinese") {
        chineseCount = chineseCount+markers[i].visits;
      } else if (markers[i].type === "Filipino") {
        filipinoCount = filipinoCount+markers[i].visits;
      } else if (markers[i].type === "Japanese") {
        japaneseCount = japaneseCount+markers[i].visits;
      } else if (markers[i].type === "Korean") {
        koreanCount = koreanCount+markers[i].visits;
      } else if (markers[i].type === "American/Western") {
        americanCount = americanCount+markers[i].visits;
      } else if (markers[i].type === "Beverage Shop") {
        beverageCount = beverageCount+markers[i].visits;
      }
    };
  } else {
    if (markers[index].type === "FastFood") {
      fastFoodCount++;
    } else if (markers[index].type === "Chinese") {
      chineseCount++;
    } else if (markers[index].type === "Filipino") {
      filipinoCount++;
    } else if (markers[index].type === "Japanese") {
      japaneseCount++;
    } else if (markers[index].type === "Korean") {
      koreanCount++;
    } else if (markers[index].type === "American/Western") {
      americanCount++;
    } else if (markers[index].type === "Beverage Shop") {
      beverageCount++;
    }
  }

  chartData = [];

  chartData.push(fastFoodCount);
  chartData.push(chineseCount);
  chartData.push(filipinoCount);
  chartData.push(japaneseCount);
  chartData.push(koreanCount);
  chartData.push(americanCount);
  chartData.push(beverageCount);

  Total =  chartData.reduce((a, b) => a + b, 0);
  console.log(Total);
}

//update the pie chart when visit data is updated
function updatePieChartData(index) {
  computeData(index);

  myChart.data.datasets[0].data = chartData;
  myChart.update();
};

function geocodePosition(latitude, longitude) {
  const fromInput = document.getElementById("from");
  geocoder = new google.maps.Geocoder();
  geocoder.geocode
   ({
       latLng: {lat:latitude, lng:longitude}
   }, 
       function(results, status) 
       {
         console.log(results[0].formatted_address);
           if (status == google.maps.GeocoderStatus.OK) 
           {
            fromInput.value = results[0].formatted_address;
           }
       }
   );
}

//HELPER FUNCTIONS-END