var currentRoute = null;
var coordOfUser = null;
var points = [];
var isAndroid = Ti.Platform.osname == 'android';
var sourcePosition = null;
var locationAdded = false;
var userAnnotation = null;

var removeCurrentRoute = function () {
	if (currentRoute != null) {
		$.mapview.removeRoute(currentRoute);
		return true;
	}
	return false;
};

var decodeLine = function (encoded, points) {
	var len = encoded.length;
    var index = 0;
    
    var lat = 0;
    var lng = 0;
 
    while(index < len) {
        var b;
        var shift = 0;
        var result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
 
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
 
        // Create new Vars for the created lats and lng
        var newLat = lat * 1e-5;
        var newLon = lng * 1e-5;
 
        // push them into the array at the end (thus adding it to the correct place)
        points.push({
            latitude: newLat,
            longitude: newLon
        });
    }
};

var traceRoteWithGetDirection = function (origin, destination) {
	removeCurrentRoute();
	
	var url = "https://maps.googleapis.com/maps/api/directions/json?sensor=false&mode=driving&alternatives=true&units=imperial&origin=" + origin.latitude + "," + origin.longitude + "&destination="+ destination.latitude + "," + destination.longitude + "&key=" + Alloy.CFG.googlekey;
    			
    var xhr = Ti.Network.createHTTPClient();
    xhr.setTimeout(15000);
    xhr.open('GET', url);
    
    xhr.onload = function() {
        var result = JSON.parse(this.responseText);
        
        if (result.status != 'OK') {
        	alert("Mapping Error - Cannot find a valid route");
            return;
        }
        
        var params = [], 
        routes = result.routes;
        points = [];
        for (var i = 0, ii = routes.length; i < 1; i++) {
            var leg = routes[i].legs[0]; 
			
            for(var j = 0, jj = leg.steps.length; j < jj; j++){
                var step = leg.steps[j],  point = step.start_location;
                
                points.push({ latitude: point.lat, longitude: point.lng });
                
                decodeLine(step.polyline.points, points);
            };
            
            var lastPoint = leg.end_location;
            points.push({ latitude: lastPoint.lat,  longitude: lastPoint.lng });
            
        }
         
        var route = {
                name:"route",
                points: points,
                color:"blue",
                width:4
        };
 
        currentRoute = Alloy.Globals.Map.createRoute(route);
        $.mapview.addRoute(currentRoute);
    };  
    
    xhr.send();
};

var showRoteInAppleMaps = function (lat, lng) {
	Ti.Platform.openURL("http://maps.apple.com/?daddr=" + lat + ',' + lng + "&saddr=" + coordOfUser.latitude + ',' + coordOfUser.longitude);
};

var showRoteInGoogleMaps = function (lat, lng) {
	if (isAndroid) {
		Ti.Platform.openURL('http://maps.google.com/maps?f=d&daddr=' + lat + ',' + lng);
	} else {
		Ti.Platform.openURL("comgooglemaps://?saddr=" + coordOfUser.latitude + ',' + coordOfUser.longitude + "&daddr=" + lat + ',' + lng + "&directionsmode=transit");
	}
};

var showRoteInWaze = function (lat, lng) {
	if (!Ti.Platform.openURL('waze://?ll=' + lat + ',' + lng + "&navigate=yes")) {
		if (isAndroid) {
			Ti.Platform.openURL("https://play.google.com/store/apps/details?id=com.waze");
		} else {
			Ti.Platform.openURL("http://itunes.apple.com/us/app/id323229106");
		}
	}
};

var showRote = function (lat, lng) {
	var dialog = Ti.UI.createOptionDialog({
        title:'Route in:',
        cancel: isAndroid ? 3 : 4,
        options: isAndroid ? [ 'Google Maps', 'Waze', 'Own App', 'Cancel'] : ['Apple Maps', 'Google Maps', 'Waze', 'Own App' ,'Cancel'],
    });
 
    dialog.show();
    
    dialog.addEventListener('click', function(e) {
    	
		switch(e.index) {
			case 0:
				if (isAndroid) {
					showRoteInGoogleMaps(lat, lng);
				} else {
					showRoteInAppleMaps(lat, lng);
               	}
            break;
 
            case 1:
            	if (isAndroid) {
        			showRoteInWaze(lat, lng);
        		} else {
            		showRoteInGoogleMaps(lat, lng);
            	}
            break;
 
            case 2:
				if (isAndroid) {
					sourcePosition = { latitude: lat, longitude: lng };
					traceRoteWithGetDirection({ latitude: lat, longitude: lng }, { latitude: coordOfUser.latitude, longitude: coordOfUser.longitude });
				} else {
					showRoteInWaze(lat, lng);
				}
            break;
            
            case 3:
            	if (!isAndroid) {
            		sourcePosition = { latitude: lat, longitude: lng };
            		traceRoteWithGetDirection({latitude: lat, longitude: lng}, {latitude: coordOfUser.latitude, longitude: coordOfUser.longitude});
            	}
            break;
        }
    });
};

var data = [ { title: "Point 1 - Title", subTitle: "Point 1 - SubTitle", latitude: -23.0807, longitude: -47.2056 },
		     { title: "Point 2 - Title", subTitle: "Point 2 - SubTitle", latitude: -22.9008, longitude: -47.0572 },
		     { title: "Point 3 - Title", subTitle: "Point 3 - SubTitle", latitude: -23.1531, longitude: -47.0578 },
		     { title: "Point 4 - Title", subTitle: "Point 4 - SubTitle", latitude: -23.5017, longitude: -47.4581 },
		     { title: "Point 5 - Title", subTitle: "Point 5 - SubTitle", latitude: -23.2642, longitude: -47.2992 },
		     { title: "Point 6 - Title", subTitle: "Point 6 - SubTitle", latitude: -23.2008, longitude: -47.2869 } 
		   ];

function report(evt) {
    if (evt.clicksource == "rightButton" || (isAndroid && evt.clicksource == "rightPane")) {
    	showRote(data[evt.annotation.annotationIndex].latitude, data[evt.annotation.annotationIndex].longitude);
    }
}

var annotations = [];

for (var i = 0 ; i < data.length ; i++ ) {
	
	annotations.push(Alloy.Globals.Map.createAnnotation({
        latitude: data[i].latitude,
    	longitude: data[i].longitude,
        title: data[i].title,
        subtitle: data[i].subTitle,
        pincolor: Alloy.Globals.Map.ANNOTATION_RED,
        draggable: true,
        showInfoWindow: true,
        annotationIndex: i,
        rightButton: "/images/ic_action_directions.png",
    	animate: true,
	}));
}

$.mapview.addAnnotations(annotations);

if (isAndroid) {
	var gpsProvider = Ti.Geolocation.Android.createLocationProvider({
	    name: Ti.Geolocation.PROVIDER_GPS,
	    minUpdateTime: 60, 
	    minUpdateDistance: 100
	});
	
	Ti.Geolocation.Android.addLocationProvider(gpsProvider);
	
	var gpsRule = Ti.Geolocation.Android.createLocationRule({
	    provider: Ti.Geolocation.PROVIDER_GPS,
	    accuracy: 10,
	    maxAge: 300000,
	    minAge: 10000
	});
	Ti.Geolocation.Android.addLocationRule(gpsRule);
} else {
	Ti.Geolocation.distanceFilter = 10;
}

Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;

var handleLocation = function(e) {
 	if (!e.error && e.coords != null && e.coords.accuracy <= 10 && (coordOfUser == null || coordOfUser.latitude !== e.coords.latitude || coordOfUser.longitude !== e.coords.longitude)) {
        coordOfUser = e.coords;
        
        if (userAnnotation != null) {
        	$.mapview.removeAnnotation(userAnnotation);
        	if (removeCurrentRoute()) {
        		traceRoteWithGetDirection({latitude: sourcePosition.latitude, longitude: sourcePosition.longitude}, {latitude: coordOfUser.latitude, longitude: coordOfUser.longitude});
        	}
        } else {
        	$.mapview.setRegion({latitude: coordOfUser.latitude, longitude: coordOfUser.longitude});
        }
        
        userAnnotation = Alloy.Globals.Map.createAnnotation({
	        latitude: coordOfUser.latitude,
	    	longitude: coordOfUser.longitude,
	        pincolor: Alloy.Globals.Map.ANNOTATION_GREEN,
	        draggable: false,
	        showInfoWindow: false,
	    	animate: true,
		});
        
        $.mapview.addAnnotation(userAnnotation);
    }
};

var addHandler = function() {
 if (!locationAdded) {
        locationAdded = true;
        Ti.Geolocation.addEventListener('location', handleLocation);
    }
};

var removeHandler = function () {
 	if (locationAdded) {
        locationAdded = false;
        Ti.Geolocation.removeEventListener('location', handleLocation);
    }
};

if (Ti.Geolocation.locationServicesEnabled) {
    Ti.Geolocation.getCurrentPosition(function (e) {
		addHandler();
	});
	if (isAndroid) {
		var activity = Ti.Android.currentActivity;
	    activity.addEventListener('destroy', removeHandler);
	}
    
} else {
    alert('Please enable location services');
}

$.index.open();