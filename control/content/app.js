'use strict';

(function (angular,buildfire) {
  angular.module('eventsManualPluginContent', ['ngRoute', 'ui.tinymce', 'ui.bootstrap', 'ui.sortable', 'infinite-scroll', 'ngAnimate'])
    //injected ngRoute for routing
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/', {
          templateUrl: 'templates/home.html',
          controllerAs: 'ContentHome',
          controller: 'ContentHomeCtrl'
        })
        .when('/event', {
          templateUrl: 'templates/event.html',
          controllerAs: 'ContentEvent',
          controller: 'ContentEventCtrl'
        })
        .when('/event/:id', {
          templateUrl: 'templates/event.html',
          controllerAs: 'ContentEvent',
          controller: 'ContentEventCtrl'
        })
        .otherwise('/');
    }])
    .directive('googleLocationSearch', function () {
      return {
        restrict: 'A',
        scope: {setLocationInController: '&callbackFn'},
        link: function (scope, element, attributes) {
          var options = {
            types: ['geocode']
          };
          var autocomplete = new google.maps.places.Autocomplete(element[0], options);
          google.maps.event.addListener(autocomplete, 'place_changed', function () {
            var location = autocomplete.getPlace().formatted_address;
            if (autocomplete.getPlace().geometry) {
              var coordinates = [autocomplete.getPlace().geometry.location.lng(), autocomplete.getPlace().geometry.location.lat()];
              scope.setLocationInController({
                data: {
                  location: location,
                  coordinates: coordinates
                }
              });
            }
          });
        }
      };
    })
    .directive("googleMap", function () {
      return {
        template: "<div></div>",
        replace: true,
        scope: {coordinates: '=', draggedGeoData: '&draggedFn'},
        link: function (scope, elem, attrs) {
          var geocoder = new google.maps.Geocoder();
          var location;
          scope.$watch('coordinates', function (newValue, oldValue) {
            if (newValue) {
              scope.coordinates = newValue;
              if (scope.coordinates.length) {
                var map = new google.maps.Map(elem[0], {
                  center: new google.maps.LatLng(scope.coordinates[1], scope.coordinates[0]),
                  zoomControl: false,
                  streetViewControl: false,
                  mapTypeControl: false,
                  zoom: 15,
                  mapTypeId: google.maps.MapTypeId.ROADMAP
                });
                var marker = new google.maps.Marker({
                  position: new google.maps.LatLng(scope.coordinates[1], scope.coordinates[0]),
                  map: map,
                  draggable: true
                });

                var styleOptions = {
                  name: "Report Error Hide Style"
                };
                var MAP_STYLE = [
                  {
                    stylers: [
                      {visibility: "on"}
                    ]
                  }];
                var mapType = new google.maps.StyledMapType(MAP_STYLE, styleOptions);
                map.mapTypes.set("Report Error Hide Style", mapType);
                map.setMapTypeId("Report Error Hide Style");
              }
              google.maps.event.addListener(marker, 'dragend', function (event) {
                scope.coordinates = [event.latLng.lng(), event.latLng.lat()];
                geocoder.geocode({
                  latLng: marker.getPosition()
                }, function (responses) {
                  if (responses && responses.length > 0) {
                    scope.location = responses[0].formatted_address;
                    scope.draggedGeoData({
                      data: {
                        location: scope.location,
                        coordinates: scope.coordinates
                      }
                    });
                  } else {
                    location = 'Cannot determine address at this location.';
                  }

                });
              });
            }

          }, true);
        }
      }
    })
    .directive('ngEnter', function () {
      return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
          if (event.which === 13) {
            var val = $(element).val(),
              regex = /^[0-9\-\., ]+$/g;
            if (regex.test(val)) {
              scope.$apply(function () {
                scope.$eval(attrs.ngEnter);
              });

              event.preventDefault();
            }
          }
        });
      };
    })
    .filter('getImageUrl', function () {
      return function (url, width, height, type) {
        if (type == 'resize')
          return buildfire.imageLib.resizeImage(url, {
            width: width,
            height: height
          });
        else
          return buildfire.imageLib.cropImage(url, {
            width: width,
            height: height
          });
      }
    })
    .run(['Location', '$rootScope', function (Location, $rootScope) {
      // Handler to receive message from widget
      buildfire.messaging.onReceivedMessage = function (msg) {
        switch (msg.type) {
          case 'OpenItem':
            Location.goTo("#/event/" + msg.id);
            break;
          default:
            Location.goToHome();
        }

      };

        buildfire.history.onPop(function(data, err){
           if(data.label !=  "Event" ){
            Location.goToHome();
          }
        })
    }]);
})(window.angular,window.buildfire);