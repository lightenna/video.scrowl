/*
 * jQuery UI Videoscroll widget v0.8
 *
 * Copyright 2012, Lightenna Ltd
 * Licenced under the MIT and BSD licences
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 *   video.js
 */
(function($, undefined) {

  $.widget("ui.videoscroll", {
    version : "0.8",
    options : {
      'addHeight' : 0, // additional height to introduce
      'length' : 60, // default length of video file
      'threshold' : 5, // pixel/second threshold for updating
      'changeDelay' : 1000, // shift time between scroll/player
      '_' : false
    },

    'destroy' : function() {
      this.element.removeClass("ui-videoscroll ui-widget").removeAttr("role");
      $.Widget.prototype.destroy.apply(this, arguments);
    },

    _create : function() {
      var ih, context = this;
      // attach to element
      this.element.addClass("ui-videoscroll ui-widget").attr({
        role : "videoscroll"
      });
      // read document dimensions
      ih = $(document).height();
      // optionally inflate document height
      var ihinf = ih + this.options['addHeight'];
      $('body').height(ihinf + 'px');
      // read back difference between window and document height
      this.height = $(document).height() - $(window).height();
      // setup the semaphors
      this.disablePlayerEvent = false;
      this.disableScrollEvent = false;
      // get video API reference to our video
      this.player = VideoJS(this.element.attr('id'));
      this.playerReady = false;
      this.player.ready(this._playerReadyEventAttach(this));
      // bind to window scroll event
      $(window).scroll(this._scrollEventAttach(this));
    },

    _playerReadyEventAttach : function(that) {
      return function() {
        // re-grab the player just in case
        that.player = this;
        // now the video's ready, get its length
        that.options['length'] = that.player.duration();
        that.playerReady = true;
        // bind to player timeupdate event
        that.player.addEvent("timeupdate", that._playerTimeUpdateEventAttach(that));
        // manually fire scroll event to set player position
        that.disablePlayerEvent = true;
        that._scrollEventAttach(that)();
        that.disablePlayerEvent = false;
      };
    },

    _playerTimeUpdateEventAttach : function(that) {
      return function() {
        var time, position;
        // lock critical section to avoid livelock
        if (that.disablePlayerEvent)
          return;
        // check that we've been able to get the player length
        if (that.options['length'] == 0 || isNaN(that.options['length'])) {
          // refresh it now
          that.options['length'] = that.player.duration();
        }
        time = that.player.currentTime();
        position = time * that.height / that.options['length'];
        if (Math.abs($(window).scrollTop() - position) > that.options['threshold']) {
          clearTimeout(that.disableScrollCallback);
          that.disableScrollEvent = true;
          $(window).scrollTop(position);
          console.log('playerEvent: scroll to ' + Math.round(time) + 's, ' + Math.round(position) + 'px');
          // continue to disable scroll updates for changeDelay milliseconds
          that.disableScrollEvent = false;
          that.disableScrollCallback = setTimeout(function() {
          }, that.options['changeDelay']);
        }
      };
    },

    _scrollEventAttach : function(that) {
      return function() {
        var position, video_perc, time;
        // lock critical section to avoid livelock
        if (that.disableScrollEvent)
          return;
        // work out where we are in the scroll
        position = $(document).scrollTop();
        // console.log(Math.round(video_perc) + '%');
        if (that.playerReady) {
          time = position * that.options['length'] / that.height;
          // advance player to position
          if (Math.abs(that.player.currentTime() - time) > that.options['threshold']) {
            clearTimeout(that.disablePlayerCallback);
            that.disablePlayerEvent = true;
            that.player.play();
            that.player.currentTime(time);
            console.log('scrollEvent: seek to ' + Math.round(time) + 's, ' + Math.round(position) + 'px');
            // continue to disable player updates for changeDelay milliseconds
            that.disablePlayerCallback = setTimeout(function() {
              that.disablePlayerEvent = false;
            }, that.options['changeDelay']);
          }
        }
        else {
          // wait for player to wake up
        }
      };
    },

    _last : function() {
    } // no comma
  });

})(jQuery);
