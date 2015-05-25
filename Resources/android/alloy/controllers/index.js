function __processArg(obj, key) {
    var arg = null;
    if (obj) {
        arg = obj[key] || null;
        delete obj[key];
    }
    return arg;
}

function Controller() {
    function report(evt) {
        Ti.API.info("report; evt.clicksource = " + evt.clicksource);
        if ("rightButton" == evt.clicksource || isAndroid && "rightPane" == evt.clicksource) {
            null != currentRoute && $.mapview.removeRoute(currentRoute);
            showRote(data[evt.annotation.annotationIndex].latitude, data[evt.annotation.annotationIndex].longitude);
        }
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "index";
    this.args = arguments[0] || {};
    if (arguments[0]) {
        {
            __processArg(arguments[0], "__parentSymbol");
        }
        {
            __processArg(arguments[0], "$model");
        }
        {
            __processArg(arguments[0], "__itemTemplate");
        }
    }
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.index = Ti.UI.createWindow({
        backgroundColor: "white",
        id: "index"
    });
    $.__views.index && $.addTopLevelView($.__views.index);
    $.__views.mapview = (require("ti.map").createView || Alloy.Globals.Map.createView)({
        id: "mapview"
    });
    $.__views.index.add($.__views.mapview);
    report ? $.__views.mapview.addEventListener("click", report) : __defers["$.__views.mapview!click!report"] = true;
    exports.destroy = function() {};
    _.extend($, $.__views);
    var currentRoute = null;
    var coordOfUser;
    var isAndroid = true;
    var showRote = function(lat, lng) {
        var dialog = Ti.UI.createOptionDialog({
            title: "Route in:",
            cancel: isAndroid ? 3 : 4,
            options: isAndroid ? [ "Google Maps", "Waze", "App", "Cancel" ] : [ "Apple Maps", "Google Maps", "Waze", "App", "Cancel" ]
        });
        dialog.show();
        dialog.addEventListener("click", function(e) {
            switch (e.index) {
              case 0:
                Ti.Platform.openURL(isAndroid ? "http://maps.google.com/maps?f=d&daddr=" + lat + "," + lng : "https://maps.apple.com/?daddr=" + lat + "," + lng);
                break;

              case 1:
                isAndroid ? Ti.Platform.openURL("waze://?ll=" + lat + "," + lng + "&navigate=yes") || Ti.Platform.openURL("https://play.google.com/store/apps/details?id=com.waze") : Ti.Platform.openURL("http://maps.google.com/maps?f=d&daddr=" + lat + "," + lng);
                break;

              case 2:
                if (isAndroid) if (null != coordOfUser) {
                    var route = {
                        points: [ {
                            latitude: lat,
                            longitude: lng
                        }, {
                            latitude: coordOfUser.latitude,
                            longitude: coordOfUser.longitude
                        } ],
                        color: "red",
                        width: 4
                    };
                    currentRoute = Alloy.Globals.Map.createRoute(route);
                    $.mapview.addRoute(currentRoute);
                } else alert("Current Location Unavailable"); else Ti.Platform.openURL("waze://?ll=" + lat + "," + lng + "&navigate=yes") || Ti.Platform.openURL("http://itunes.apple.com/br/app/id323229106");
                break;

              case 3:
                if (!isAndroid) if (null != coordOfUser) {
                    var route = {
                        points: [ {
                            latitude: lat,
                            longitude: lng
                        }, {
                            latitude: coordOfUser.latitude,
                            longitude: coordOfUser.longitude
                        } ],
                        color: "red",
                        width: 4
                    };
                    currentRoute = Alloy.Globals.Map.createRoute(route);
                    $.mapview.addRoute(currentRoute);
                } else alert("Current Location Unavailable");
            }
        });
    };
    var data = [ {
        title: "Point 1 - Title",
        subTitle: "Point 1 - SubTitle",
        latitude: -23.0807,
        longitude: -47.2056
    }, {
        title: "Point 2 - Title",
        subTitle: "Point 2 - SubTitle",
        latitude: -22.9008,
        longitude: -47.0572
    }, {
        title: "Point 3 - Title",
        subTitle: "Point 3 - SubTitle",
        latitude: -23.1531,
        longitude: -47.0578
    }, {
        title: "Point 4 - Title",
        subTitle: "Point 4 - SubTitle",
        latitude: -23.5017,
        longitude: -47.4581
    }, {
        title: "Point 5 - Title",
        subTitle: "Point 5 - SubTitle",
        latitude: -23.2642,
        longitude: -47.2992
    }, {
        title: "Point 6 - Title",
        subTitle: "Point 6 - SubTitle",
        latitude: -23.2008,
        longitude: -47.2869
    } ];
    var annotations = [];
    for (var i = 0; i < data.length; i++) annotations.push(Alloy.Globals.Map.createAnnotation({
        latitude: data[i].latitude,
        longitude: data[i].longitude,
        title: data[i].title,
        subtitle: data[i].subTitle,
        pincolor: Alloy.Globals.Map.ANNOTATION_RED,
        draggable: true,
        showInfoWindow: true,
        annotationIndex: i,
        rightButton: "/images/ic_action_directions.png",
        animate: true
    }));
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
            maxAge: 3e5,
            minAge: 1e4
        });
        Ti.Geolocation.Android.addLocationRule(gpsRule);
    } else Ti.Geolocation.distanceFilter = 100;
    Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
    Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;
    Ti.Geolocation.getCurrentPosition(function(e) {
        if (e.success) {
            coordOfUser = e.coords;
            $.mapview.addAnnotations([ Alloy.Globals.Map.createAnnotation({
                latitude: coordOfUser.latitude,
                longitude: coordOfUser.longitude,
                pincolor: Alloy.Globals.Map.ANNOTATION_GREEN,
                draggable: false,
                showInfoWindow: false,
                annotationIndex: i,
                animate: true
            }) ]);
            $.mapview.setRegion({
                latitude: coordOfUser.latitude,
                longitude: coordOfUser.longitude
            });
        }
    });
    var locationAdded = false;
    var addHandler = function() {
        locationAdded || (locationAdded = true);
    };
    Ti.Geolocation.locationServicesEnabled ? addHandler() : alert("Location Services Disabled");
    $.index.open();
    __defers["$.__views.mapview!click!report"] && $.__views.mapview.addEventListener("click", report);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;