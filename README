#Overview

This plugin provides a simple wrapper around the Google maps API to perform address lookup and routing between two locations in the UK and to calculate driving distance and time.

It uses the new V3 maps API and makes full use of asynchronous communication with Google to give a responsive user experience. The plugin has been deliberately kept minimal and lightweight to work well for the specific purpose of calculating mileage.

A comprehensive example is included showing how to use the plugin within your own site. Very little specific markup is required to work with the plugin although certain defaults have been set in the plugin options to allow it to be dropped in if the markup conventions are followed.

#Usage

Before using the plugin, the Google maps API and jQuery must be loaded. This can be achieved by including the following in your document `head` section.

		<script type="text/javascript">
			var jqHost = (("https:" == document.location.protocol) ? "https://ajax.googleapis.com" : "http://ajax.googleapis.com");
			var gmHost = "http://maps.google.co.uk";
			document.write(unescape("%3Cscript src='" + jqHost + "/ajax/libs/jquery/1.4.4/jquery.min.js' type='text/javascript'%3E%3C/script%3E"));
			document.write(unescape("%3Cscript src='" + gmHost + "/maps/api/js?sensor=false&region=GB' type='text/javascript'%3E%3C/script%3E"));
		</script>

The plugin then needs to be loaded using a normal `script` tag. Make sure you include the plugin after both jQuery and the Google maps scripts.

Your document will then need a block of code to start the plugin when ready. You can use jQuery to do this as shown below. Note that all calls to the map plugin use the `xmap` function.

    <script type="text/javascript">
      $(document).ready(function(){
        $('#map').xmap({ showError: function(title, message) {
					alert(title + ' - ' + message);
				}});
      )};
    </script>

This example shows how the plugin should be initialised. Your document should include a `div` for the map window to be displayed in - this is also where the plugin is attached. The `div` must have explicit coordinates set either inline or via CSS to ensure the Google maps plugin works. If no dimensions are set for the containing `div` then nothing will be displayed.

The plugin also supports various options to customise the default settings as defined in the next section. To use the defaults just call the plugin with no parameters.

#Options

All configuration settings are optional and sensible defaults are provided.

##routeDisplay

This specifies a jQuery selector expression for the element that shows the route details. Your page markup would typically include a `div` for this purpose. Once a route has been calculated the element is populated with turn by turn directions for the route. A click handler is also installed so that clicking on individual route steps shows the relevant section of the route in the map window.

The route steps are returned within ordered list tags. Each step of the route is returned as a list item with additional markup to display the textual and distance parts. See the example page for further details of the markup format.

    routeDisplay: '#directions'

##distanceDisplay

This specifies a jQuery selector expression for the element that shows total distance for the calculated route. Your page markup would typically include a `div` or `span` for this purpose. Once a route has been calculated the element is populated with the total distance of the route in miles.

This is formatted as a simple text string so may be wrapped as required with your own markup.

    distanceDisplay: '#distance'

##timeDisplay

This specifies a jQuery selector expression for the element that shows total time (or duration) for the calculated route. Your page markup would typically include a `div` or `span` for this purpose. Once a route has been calculated the element is populated with the total time of the route in hours and minutes.

This is formatted as a simple text string so may be wrapped as required with your own markup.

    timeDisplay: '#time'

##copyrightDisplay

This specifies a jQuery selector expression for the element that shows map copyright information. The Google terms of service require that copyright information returned from the map API is displayed to the user. Once a route has been calculated the element is populated with a copyright message.

This is formatted as a simple text string so may be wrapped as required with your own markup.

    copyrightDisplay: #copyright'

##warningsDisplay

This specifies a jQuery selector expression for the element that shows map warning information. The Google terms of service require that warning information returned from the routing API is displayed to the user, although this is rarely populated by Google. Once a route has been calculated the element is populated with any warnings returned from the routing request.

Multiple warnings may be returned with each wrapped in a paragraph tag.

    warningsDisplay: '#warnings'

##originIcon

If required a custom icon may be shown to indicate the origin of the route. Specify a filename (ideally a PNG file) to a custom marker image.

    originIcon: 'images/map-origin.png'

##destinationIcon

If required a custom icon may be shown to indicate the destination of the route. Speciy a filename (ideally a PNG file) to a custom marker image.

    destinationIcon: 'images/map-destination.png'

##showError

Any errors encountered by the map plugin or returned by the Google API are not normally shown to the user. If required this option may be used to specify a function to call to display error messages to the user. It should expect two arguments for `title` and `message`. If not required this option may be set to `null`.

    showError: function(title, message) {
			alert(title + ' - ' + message);
		}

##errors

The plugin supports custom error messages for various scenarios. Defaults are set in English for each error but these may be overridden for other locales or specific requirements. Error messages should be specified as a hash with each error entry containing a `title` and `message` attribute.

		errors: {
			routeNotFound: { title: 'Route not found', message: 'Sorry, no route could be found between the specified addresses.' },
			routeError: { title: 'Routing error', message: 'Sorry, there was a problem calculating the route. Please try later.' },
			originNotFound: { title: 'Origin not found', message: 'Sorry, the origin address could not be found.' },
			originError: { title: 'Origin error', message: 'Sorry, there was a problem trying to locate the origin address. Please try later.' },
			destinationNotFound: { title: 'Destination not found', message: 'Sorry, the destination address could not be found.' },
			destinationError: { xtitle: 'Destination error', xmessage: 'Sorry, there was a problem trying to locate the destination address. Please try later.' }
		}


#Methods

The plugin exposes a number of methods to interact with the map and calculated route.

##route

This method performs the route calculation and if successful triggers the update of the map and directions display. Pass both an `origin` and `destination` parameter - these should be simple text strings for the corresponding location and would typically be an address or place name.

If either parameter is blank (i.e. an empty string) the plugin will instead try to resolve the other location and show it on the map. If both parameters are blank an error message will be returned to the user via the `showError` function.

If the route cannot be calculated, either because of a problem with Google maps or a location that cannot be found again an error message will be returned to the user.

    $('#map').xmap('route', 'Solihull', 'Hampton in Arden')

##overview

If the map has been zoomed or panned so that the whole route is no longer visible, this method may be called to zoom the map out so that the whole route is visible at once. No parameters are expected.

    $('#map').xmap('overview')

##clear

Call this function to clear the currently displayed route and direction steps. No parameters are expected.

    $('#map').xmap('clear')

##distance

This function returns the total distance of the calculated route in numeric format. The distance is expressed in miles and is rounded to the nearest half mile.

    var totalMiles = $('#map').xmap('distance')

##duration

This function returns the total time of the calculated route in numeric format. The time is expressed in minutes and is rounded to the nearest minute.

    var totalTime = $('#map').xmap('duration')

##formatDistance

This function applies formatting to a specified distance to display the distance as a text string including a `mile` or `miles` suffix. A `distance`parameter may optionally be passed to format a specific distance. If this parameter is omitted the total distance for the current route is formatted and returned instead.

    var prettyDistance = $('#map').xmap('formatDistance', 30.5)

##formatDuration

This function applies formatting to a specified duration to display the duration as a text string including `hour` and `minute` parts. A `duration` parameter may optionally be passed to format a specific duration in minutes. If this parameter is omitted the total duration for the current route is formatted and returned instead.

    var prettyDuration = $('#map').xmap('formatDuration', 90)

#Help

We'll be happy to help with any questions or guidance with using the plugin - just send us a message here on Github or to our [Support site](http://getsatisfaction.com/smoothcontract).