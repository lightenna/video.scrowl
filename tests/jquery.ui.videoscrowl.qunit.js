// run tests in order
QUnit.config.reorder = false;

module("setup/teardown");
var vq, vj;

/**
 * Setup other tests, which run sequentially after this
 */
test("setup", function() {
  expect(1);
  // find video on page
  vq = $('#test_video');
  vj = VideoJS('#test_video');
  // bind terminate button to remove video
  $('#terminate').click(function() {
    $(document).scrollTop(0);
    vj.pause();
    $('#test_video').remove();
  });
  // wait for video ready
  QUnit.stop();
  vj.ready(function() {
    ok(vq.length, 'Video.js ready on <video> object');
    // almost silence the video
    vj.volume(0.05);
    QUnit.start();
  });
});

/**
 * Initialise Video.js video as videoscrowl resize document to add a scrollbar
 */
test("convert HTML5 video to videoscrowl", function() {
  expect(4);
  ok(vq.length, "HTML5 video element exists");
  equal(vq.hasClass('ui-videoscrowl'), false, "HTML5 video is not yet a videoscrowl");
  vq.videoscrowl({
    'addHeight' : 600
  });
  // check that the window has a scrollbar
  ok($(document).height() > $(window).height(), "window has a scrollbar");
  // check that the video got turned into a videoscrowl
  ok(vq.hasClass('ui-videoscrowl'), "HTML5 video is now a videoscrowl");
});

module("async");

/**
 * Play the video for 5 seconds and check that the scrollbar is updated
 */
test("play video for 5s using API", function() {
  var start;
  expect(3);
  start = vj.currentTime();
  // check scrollbar at top of page
  ok($(document).scrollTop() == 0, "scrollbar at top of page");
  // play the video
  vj.play();
  QUnit.stop();
  setTimeout(function() {
    var finish = vj.currentTime();
    // check that the counter advanced
    ok((finish - start) != 0, "video played " + Math.round(finish - start) + " seconds");
    vj.pause(); // pause the video
    // check that the scroll bar started moving
    ok($(document).scrollTop() > 0, "scrollbar has moved to " + Math.round($(document).scrollTop()) + "px");
    vj.pause();
    // kick of QUnit again
    QUnit.start();
  }, 5000);
});

/**
 * Advance the player to 66% and check that the scrollbar updates and scrollupdated event triggers
 */
test("player jump forward while playing", function() {
  var time, timepc, timetarget, duration, pagelen, pagetarget, pagepos, pagepc;
  expect(2);
  pagelen = $(document).height() - $(window).height();
  vj.play();

  // jump to 66% (30 seconds) in using video.js API (simulated timeline click)
  duration = vj.duration();
  timetarget = duration * 66 / 100;
  vj.currentTime(timetarget);
  QUnit.stop();

  // bind to the scrollupdated event
  vq.videoscrowl('option', 'scrollupdated', function() {
    // stop listening to event
    vq.videoscrowl('option', 'scrollupdated', null);
    // verify the video time
    time = vj.currentTime();
    timepc = time * 100 / duration;
    // check video jumped to the right place
    ok((time >= (timetarget - 0.5)) && (time <= (timetarget + 0.5)), "video time jumped to " + Math.round(timetarget)
        + "s (" + Math.round(timepc) + "%)");
    // verify scroll position
    pagepos = $(document).scrollTop(), pagelen = $(document).height() - $(window).height();
    pagepc = pagepos * 100 / pagelen;
    // check that the scroll bar moved to the right place (within 5%)
    ok(Math.abs(pagepc - timepc) < 5, "scrollbar has moved to " + Math.round($(document).scrollTop()) + "px ("
        + Math.round(pagepc) + "%)");
    vj.pause();
    // restart the tests
    QUnit.start();
  });
});

/**
 * Set the scrollbar back to 33% and check that the video updates and the videoupdated event fires
 */
test("scrollbar jump back while playing", function() {
  var time, timepc, timetarget, duration, pagelen, pagetarget, pagepos, pagepc;
  expect(2);
  pagelen = $(document).height() - $(window).height();
  vj.play();

  // aim for 33% (200px) in
  pagetarget = pagelen * 33 / 100;
  QUnit.stop();

  // bind to the videoupdated event
  vq.videoscrowl('option', 'videoupdated', function() {
    console.log('video updated');
    // stop listening to event
    vq.videoscrowl('option', 'videoupdated', null);
    // verify the page position
    pagepos = $(document).scrollTop();
    pagepc = pagepos * 100 / pagelen;
    // check the scrollbar jumped to the right place
    ok(Math.abs(pagepos - pagetarget) < 5, "page scrolled to " + Math.round(pagepos) + "px (" + Math.round(pagepc)
        + "%)");
    // verify video time
    duration = vj.duration();
    time = vj.currentTime();
    timepc = time * 100 / duration;
    ok(Math.abs(pagepc - timepc) < 5, "video time jumped to " + Math.round(time) + "s (" + Math.round(timepc) + "%)");
    vj.pause();
    // restart QUnit
    QUnit.start();
  });

  // mimic using scrollbar (simulated scroll click)
  $(document).scrollTop(pagetarget);
  $(document).trigger('scroll');

});

module("setup/teardown");

/**
 * Clean up to ensure that failed tests don't leave any video playing in the background
 */
test("teardown", function() {
  expect(0);
  // jump back up to see the results
  $('#test_video').videoscrowl('destroy');
});
