/* Google Maps Routing jQuery plugin
 * Allows use of google maps to determine route and distance between two addresses for the purpose of
 * calculating mileage for expense claims. Attaches to a div to render map and requires additional
 * DOM elements for route, total distance and total time details.
 *
 * Copyright (C) 2011 smoothcontract ltd
 * MIT licensed - http://creativecommons.org/licenses/MIT/
 */
(function($){

	var map = null,
			info = null,
			infoOpen = false,
			geocoder = null,
			renderer = null,
			directions = null,
			originMarker = null,
			originContent = null,
			destinationMarker = null,
			destinationContent = null,
			totalDistance = 0,
			totalDuration = 0,
			
			// Default settings
			settings = {
				routeDisplay: '#directions',
				distanceDisplay: '#distance',
				timeDisplay: '#time',
				copyrightDisplay: '#copyright',
				warningsDisplay: '#warnings',
				originIcon: 'images/map-origin.png',
				destinationIcon: 'images/map-destination.png',
				showError: null,
				errors: {
					routeNotFound: { title: 'Route not found', message: 'Sorry, no route could be found between the specified addresses.' },
					routeError: { title: 'Routing error', message: 'Sorry, there was a problem calculating the route. Please try later.' },
					originNotFound: { title: 'Origin not found', message: 'Sorry, the origin address could not be found.' },
					originError: { title: 'Origin error', message: 'Sorry, there was a problem trying to locate the origin address. Please try later.' },
					destinationNotFound: { title: 'Destination not found', message: 'Sorry, the destination address could not be found.' },
					destinationError: { title: 'Destination error', message: 'Sorry, there was a problem trying to locate the destination address. Please try later.' }
				}
			},
						
			// Public API
			methods = {
				init: function(options) { 
					if (options) { $.extend(settings, options); };
					return this.each(function() {					
						initialise(this);
					});
				},
				route: function(origin, destination) {
					calculateRoute(origin, destination);
					return this;
				},
				overview: function() {
					showWholeRoute();
					return this;
				},
				clear: function() {
					clearRoute();
					return this;
				},
				distance: function() {
					return Math.round(totalDistance * 2) / 2;
				},
				duration: function() {
					return Math.round(totalDuration / 60);
				},
				formatDistance: function(distance) {
					return prettyDistance(distance);
				},
				formatDuration: function(duration) {
					return prettyDuration(duration);
				}
			};


	// Create required google map objects
	function initialise(element) {
		var mapOptions, renderOptions,
				uk = new google.maps.LatLng(53.9728, -3.054199);
		
		info = new google.maps.InfoWindow();
		geocoder = new google.maps.Geocoder();
		directions = new google.maps.DirectionsService();
		
		mapOptions = {
			center: uk,
			zoom: 5,
			maxZoom: 16,
			mapTypeControl: false,
			streetViewControl: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};

		map = new google.maps.Map(element, mapOptions);
			
		renderOptions = {
			map: map,
			draggable: true,
			hideRouteList: true,
			suppressMarkers: true,
			markerOptions: { visible: false }
		};
		
		renderer = new google.maps.DirectionsRenderer(renderOptions);
					
		google.maps.event.addListener(renderer, 'directions_changed', function() { routeChanged(); });
		google.maps.event.addListener(info, 'closeclick', function() { infoOpen = false; });
		$(settings.routeDisplay).click(function(event) { showRouteSegment(event); });
	};


	// Render route and markers for origin and destination locations
	function calculateRoute(origin, destination) {
		var originLocn, destinationLocn, routeRequest, routeOverview;

		clearRoute();

		if (origin.address && destination.address) {
			// Origin and destination both provided so we can calculate a route
			routeRequest = {
				origin: origin.address,
				destination: destination.address,
				travelMode: google.maps.DirectionsTravelMode.DRIVING,
				unitSystem: google.maps.DirectionsUnitSystem.IMPERIAL,
				provideRouteAlternatives: false
			};

			directions.route(routeRequest, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					routeOverview = response.routes[0].overview_path;
					renderer.setDirections(response);
					renderer.setMap(map);
					setOrigin(origin.title, origin.description, routeOverview[0]);
					setDestination(destination.title, destination.description, routeOverview[routeOverview.length - 1]);
					showOriginInfo();
				} else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
					showError(settings.errors.routeNotFound);
				} else {
					showError(settings.errors.routeError);
				}
			});
		} else if (origin.address) {
			// Geocode and show a marker for origin address
			geocoder.geocode({ 'address': origin.address }, function(response, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					setOrigin(origin.title, origin.description, response[0].geometry.location);
					showOriginInfo();
				} else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
					showError(settings.errors.originNotFound);
				} else {
					showError(settings.errors.originError);
				}
			});
		} else if (destination.address) {
			// Geocode and show a marker for destination address
			geocoder.geocode({ 'address': destination.address }, function(response, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					setDestination(destination.title, destination.description, response[0].geometry.location);
					showDestinationInfo();
				} else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
					showError(settings.errors.destinationNotFound);
				} else {
					showError(settings.errors.destinationError);
				}
			});
		}
	};


	// Clear down previous markers, route and info window
	function clearRoute() {
		if (originMarker) { originMarker.setMap(null); }
		if (destinationMarker) { destinationMarker.setMap(null); }
		renderer.setMap(null);
		closeInfo();
	}

	// Google event handler for any modifications to the route (or for a new route calculation)
	function routeChanged() {
		var i, leg, step, hours, unit, unit2,
				distance = 0,
				duration = 0,
				steps = $('<ol></ol>'),
				warnings = '',
				route;

		// Iterate over route to calculate total duration and distance and to list instructions
		if (renderer.directions) {
			route = renderer.directions.routes[0];
			leg = route.legs[0];
			distance = leg.distance.value;
			duration = leg.duration.value;

			for (i = 0; i < leg.steps.length; i++) {
				step = leg.steps[i];
				steps.append('<li data-step="' + i + '">' + step.instructions + '<span class="distance">' + step.distance.text + '</span>' + '</li>');
			}
			
			// Enumerate warnings (typically only shown for cycle routes but required to meet TOS)
			for (i = 0; i < route.warnings.length; i++) {
				warnings += '<p>' + route.warnings[i] + '</p>';
			}
		}

		// Convert distance to miles (returned in metres for each route step)
		totalDistance = distance / 1000 * 0.621371192;
		totalDuration = duration;

		// Display total distance and duration
		$(settings.distanceDisplay).text(prettyDistance());
		$(settings.timeDisplay).text(prettyDuration());
 
		// Display route steps
		$(settings.routeDisplay).html(steps);

		// Include copyright notice to comply with google maps TOS
		$(settings.copyrightDisplay).text(route.copyrights);
		
		// Show warnings only if present
		$(settings.warningsDisplay).html(warnings);
		if (warnings != '') {
			$(settings.warningsDisplay).show();
		} else {
			$(settings.warningsDisplay).hide();
		}
	};


	// jQuery event handler to display detail for clicked section of route in directions list
	function showRouteSegment(event) {
		var step,
				segment = $(event.target).closest('li'),
				i = segment.attr('data-step'),
				bounds = new google.maps.LatLngBounds();
				
		if (i && renderer.directions) {
			step = renderer.directions.routes[0].legs[0].steps[i];
			
			// Ensure this step of the route is visible
			bounds.extend(step.start_location);
			bounds.extend(step.end_location);
			map.fitBounds(bounds);
			
			showInfo({ position: step.start_location, content: step.instructions, pixelOffset: null });
		}
		
		return false;
	};


	// Helper function to display route overview - fits whole route into visible map
	function showWholeRoute() {
		if (renderer.directions) {
			map.fitBounds(renderer.directions.routes[0].bounds);
			showOriginInfo();
		}
	};
	

	// Helper function to store origin details and create associated map marker
	function setOrigin(title, content, location) {
		originContent = content;
		
		originMarker = new google.maps.Marker({ title: title, icon: settings.originIcon, position: location, map: map, animation: google.maps.Animation.DROP });
		google.maps.event.addListener(originMarker, 'click', function(event) {
			if (infoOpen) {
				closeInfo();
			} else {
				showOriginInfo();
			}
		});
	};

	// Helper function to store destination details and create associated map marker
	function setDestination(title, content, location) {
		destinationContent = content;
		
		destinationMarker = new google.maps.Marker({ title: title, icon: settings.destinationIcon, position: location, map: map, animation: google.maps.Animation.DROP });
		google.maps.event.addListener(destinationMarker, 'click', function(event) {
			if (infoOpen) {
				closeInfo();
			} else {
				showDestinationInfo();
			}
		});
	};

	
	// Helper function to show info window for route origin
	function showOriginInfo() {
		var offset = new google.maps.Size(0, -18);
		
		showInfo({ position: originMarker.getPosition(), content: originContent, pixelOffset: offset });
	};
	
	// Helper function to show info window for route destination
	function showDestinationInfo() {
		var offset = new google.maps.Size(0, -18);
		
		showInfo({ position: destinationMarker.getPosition(), content: destinationContent, pixelOffset: offset });
	};

	// Helper function to show info window with specified options
	function showInfo(options) {
		info.setOptions(options);
		info.open(map);
		infoOpen = true;
	};

	// Helper function to close info window
	function closeInfo() {
		info.close();
		infoOpen = false;
	};

	// Convert distance to pretty format (rounded to nearest half mile).
	function prettyDistance(distance) {
		var calc = Math.round((distance || totalDistance) * 2) / 2,
				unit = (calc >= 0.5) && (calc < 1.5) ? " mile" : " miles";

		return calc + unit;
	};

	// Convert duration to pretty format (rounded to nearest minute)
	function prettyDuration(duration) {
		var hours, unit2,
				calc = Math.round((duration || totalDuration) / 60),
				unit = (calc % 60) == 1 ? " minute" : " minutes"
		
		if (calc < 60) {
			return calc + unit;
		} else {
			hours = Math.floor(calc / 60);
			unit2 = hours == 1 ? " hour " : " hours "
			return hours + unit2 + (calc % 60) + unit;
		}
	};
	
	// Pass error message via callback
	function showError(error) {
		if (settings.showError) {
			settings.showError(error.title, error.message);
		} else {
			alert(error.title + ' - ' + error.message);
		}
	}
	
	
	// Define jQuery namespace for plugin
  $.fn.xmap = function(method) {
	
    // Method calling logic
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.xmap');
    }    
  };

})( jQuery );