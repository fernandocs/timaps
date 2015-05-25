var currentRoute = null;
var coordOfUser;

var isAndroid = Ti.Platform.osname == 'android';

var showRote = function (lat, lng) {
	var dialog = Ti.UI.createOptionDialog({
        title:'Route in:',
        cancel: isAndroid ? 3 : 4,
        options: isAndroid ? ['Google Maps', 'Waze', 'App', 'Cancel'] : ['Apple Maps', 'Google Maps', 'Waze', 'App', 'Cancel'],
    });
 
    dialog.show();
    
    dialog.addEventListener('click', function(e) {
    	
		switch(e.index) {
			case 0:
				if (isAndroid) {
					Ti.Platform.openURL('http://maps.google.com/maps?f=d&daddr=' + lat + ',' + lng);
				} else {
					Ti.Platform.openURL('https://maps.apple.com/?daddr=' + lat + ',' + lng);
               	}
                break;
 
                case 1:
                	if (isAndroid) {
                		if(!Ti.Platform.openURL('waze://?ll=' + lat + ',' + lng + "&navigate=yes")){
	                        Ti.Platform.openURL("https://play.google.com/store/apps/details?id=com.waze");
	                    }
            	} else {
                	Ti.Platform.openURL('http://maps.google.com/maps?f=d&daddr=' + lat + ',' + lng);
                }
                break;
 
                case 2:
                	if (isAndroid) {
                		if (coordOfUser != null) {
	                		var route = {
								points: [{ latitude: lat, 
										   longitude: lng
										 }, 
										 { latitude: coordOfUser.latitude, 
										   longitude: coordOfUser.longitude
										 }
										],
									color:"red",
								width: 4
							};
					
							currentRoute = Alloy.Globals.Map.createRoute(route);
							
	                    	$.mapview.addRoute(currentRoute);
	                   } else {
							alert("Current Location Unavailable");
           		 	   }
            	} else {
                    if(!Ti.Platform.openURL('waze://?ll=' + lat + ',' + lng + "&navigate=yes")) {
                        Ti.Platform.openURL("http://itunes.apple.com/br/app/id323229106");
                    }
                }
            break;
            
            case 3:
				if (!isAndroid) {
					if (coordOfUser != null) {
						var route = {
							points: [{ latitude: lat, 
									   longitude: lng
									 }, 
									 { latitude: coordOfUser.latitude, 
									   longitude: coordOfUser.longitude
									 }
							],
							color:"red",
							width: 4
						};
					
						currentRoute = Alloy.Globals.Map.createRoute(route);
						
	                    $.mapview.addRoute(currentRoute);
                 } else {
                 	alert("Current Location Unavailable");
           		 }
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
	Ti.API.info('report; evt.clicksource = ' + evt.clicksource);
    if (evt.clicksource == "rightButton" || (isAndroid && evt.clicksource == "rightPane")) {
    	if (currentRoute != null) {
    		$.mapview.removeRoute(currentRoute);
    	}
    	
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
	    accuracy: 100,
	    maxAge: 300000,
	    minAge: 10000
	});
	Ti.Geolocation.Android.addLocationRule(gpsRule);
} else {
	Ti.Geolocation.distanceFilter = 100;
}

Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;
Ti.Geolocation.getCurrentPosition(function (e) {
	if (e.success) {
		coordOfUser = e.coords;
		$.mapview.addAnnotations([Alloy.Globals.Map.createAnnotation({
	        latitude: coordOfUser.latitude,
	    	longitude: coordOfUser.longitude,
	        pincolor: Alloy.Globals.Map.ANNOTATION_GREEN,
	        draggable: false,
	        showInfoWindow: false,
	        annotationIndex: i,
	    	animate: true,
		})]);
		$.mapview.setRegion({latitude: coordOfUser.latitude, longitude: coordOfUser.longitude});
	}
});

var locationAdded = false;
var handleLocation = function(e) {
 	if (!e.error && e.coords != null && e.coords.accuracy <= 100) {
        coordOfUser = e.coords;
        removeHandler();
    }
};

var addHandler = function() {
 if (!locationAdded) {
        locationAdded = true;
    }
};
var removeHandler = function() {
 if (locationAdded) {
        locationAdded = false;
    }
};

if (Ti.Geolocation.locationServicesEnabled) {
	addHandler();
} else {
	alert("Location Services Disabled");
}

$.index.open();