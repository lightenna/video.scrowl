videoscrowl
===========

A jQueryUI plugin to make video scrollable

Installation
------------

 +   Simply clone the repo
 +   Run the tests by opening /tests/index.html
 +   Include a script tag in your HTML/AMD loader

jQuery UI
---------

To initialise a `<video>` element

    jQuery('#my_video_object').videoscrowl();

To initialise a `<video>` element with a set of options

    jQuery('#my_video_object').videoscrowl({'addHeight' : 600});

This example adds 600px to the height of the document, which introduces a scrollbar if there isn't one already.

Options
-------

<table>
<th>
<td>Option</td>
<td>Default</td>
<td>Comment</td>
</th>
<tr>
<td>addHeight</td>
<td>0</td>
<td>additional height to introduce</td>
</tr>
<tr>
<td>length</td>
<td>60</td>
<td>default length of video file in seconds, in case the API can't read the length because the video is never 'ready'</td>
</tr>
<tr>
<td>threshold</td>
<td>5</td>
<td>pixel/second threshold for updating scrollbar/video timeline</td>
</tr>
<tr>
<td>changeDelay</td>
<td>1000</td>
<td>shift time between scroll/player in milliseconds.  This locks out the other input device to avoid accidental clicks.</td>
</tr>
</table>