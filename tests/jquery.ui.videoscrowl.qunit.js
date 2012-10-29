// run tests in order
QUnit.config.reorder = false;

module("setup/teardown");

test("setup", function() {
  expect(0);
  // bind terminate button to remove video
  $('#terminate').click(function() {
    var vj = VideoJS('#test_video');
    $(document).scrollTop(0);
    vj.pause();
    $('#test_video').remove();
  });
});
  
// setup first module
module("simple tests");

test("convert HTML5 video to videoscrowl", function() {
  var vq;
  expect(4);
  vq = $('video');
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

test("play video using API", function() {
  var vj, start;
  expect(3);
  vj = VideoJS('#test_video');
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

test("player jump forward while playing", function() {
  var time, timepc, timetarget, duration, vj, pagelen, pagetarget, pagepos, pagepc;
  expect(2);
  vj = VideoJS('#test_video');
  pagelen = $(document).height() - $(window).height();
  vj.play();
  // jump to 66% (30 seconds) in
  duration = vj.duration();
  timetarget = duration * 66 / 100;
  vj.currentTime(timetarget);
  time = vj.currentTime();
  timepc = time * 100 / duration;
  // check video jumped to the right place
  ok((time >= (timetarget - 0.5)) && (time <= (timetarget + 0.5)), "video time jumped to " + Math.round(timetarget)
      + "s (" + Math.round(timepc) + "%)");
  // verify scroll position within a few milliseconds
  QUnit.stop();
  setTimeout(function() {
    pagepos = $(document).scrollTop(), pagelen = $(document).height() - $(window).height();
    pagepc = pagepos * 100 / pagelen;
    // check that the scroll bar moved to the right place (within 5%)
    ok(Math.abs(pagepc - timepc) < 5, "scrollbar has moved to " + Math.round($(document).scrollTop()) + "px ("
        + Math.round(pagepc) + "%)");
    vj.pause();
    // kick of QUnit again
    QUnit.start();
  }, 10);
});

test("scrollbar jump back while playing", function() {
  var time, timepc, timetarget, duration, vj, pagelen, pagetarget, pagepos, pagepc;
  expect(2);
  vj = VideoJS('#test_video');
  pagelen = $(document).height() - $(window).height();
  vj.play();
  // jump to 33% (200px) in
  pagetarget = pagelen * 33 / 100;
  $(document).scrollTop(pagetarget);
  $(document).trigger('scroll');
  pagepos = $(document).scrollTop();
  pagepc = pagepos * 100 / pagelen;
  // check the scrollbar jumped to the right place
  ok(Math.abs(pagepos - pagetarget) < 5, "page scrolled to " + Math.round(pagepos) + "px (" + Math.round(pagepc) + "%)");
  // verify player position within a few milliseconds
  QUnit.stop();
  setTimeout(function() {
    duration = vj.duration();
    time = vj.currentTime();
    timepc = time * 100 / duration;
    ok(Math.abs(pagepc - timepc) < 5, "video time jumped to " + Math.round(time)
        + "s (" + Math.round(timepc) + "%)");
    vj.pause();
    // kick of QUnit again
    QUnit.start();
  }, 10);
});

module("setup/teardown");

test("teardown", function() {
  expect(0);
  // jump back up to see the results
  $('video').videoscrowl('destroy');
  // $(document).scrollTop(0);
  // vj = VideoJS('#test_video');
  // vj.pause();
});
