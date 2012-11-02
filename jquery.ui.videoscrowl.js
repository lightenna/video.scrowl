/*
 * jQuery UI videoscrowl widget v0.82
 *
 * Copyright 2012, Lightenna Ltd
 * Licenced under the MIT and BSD licences
 *
 * Depends:
 *   jquery.js (>1.7)
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 *   video.js
 */
(function($, undefined) {

  $.widget("ui.videoscrowl", {
    version : "0.83",
    options : {
      // settings
      'addHeight' : 0, // additional height to introduce
      'length' : 60, // default length of video file
      'thresholdPx' : 5, // pixel threshold for updating scrollbar
      'thresholdMs' : 1000, // millisecond threshold for updating video time
      'changeDelay' : 1000, // shift time between scroll/player
      'jumpRetryWait' : 100, // initial wait time before trying to get the player to change position again
      'jumpRetriesMax' : 7, // number of times to wait for video
      'debug' : true, // show debugging information in the console

      // events
      'videoupdated' : null,
      'scrollupdated' : null,

      '_' : false
    },

    /**
     * External API
     */

    /**
     * Clean up a videoscrowl instance
     */
    'destroy' : function() {
      var that = this;
      that.element.removeClass("ui-videoscrowl ui-widget").removeAttr("role");
      $.Widget.prototype.destroy.apply(that, arguments);
    },

    /**
     * Jump the video to a certain time, updating the scrollbar
     * 
     * @param time
     *          int Time in seconds
     */
    'jumpTo' : function(time) {
      var that = this;
      that._jumpTo(time);
    },

    /**
     * Scroll the scrollbar to a certain position, updating the video
     * 
     * @param position
     *          int Distance from top of page in pixels
     */
    'scrollTo' : function(position) {
      var that = this;
      that._scrollTo(position);
    },

    /**
     * private variables
     * 
     * @param __jumpRetries
     *          int Number of retries to jump to this position
     * @param __jumpLastTime
     *          int The time (s) that we were last asked to jump to
     * @param __disablePlayerEvent
     *          boolean True to stop player from updating scrollbar position
     * @param __disableScrollEvent
     *          boolean True to stop scrollbar from updating player position
     */
    __jumpRetries : 0,
    __jumpLastTime : 0,
    __disablePlayerEvent : false,
    __disableScrollEvent : false,

    /**
     * callback function ID holders (from setTimeout)
     */
    __disablePlayerCallback : null,
    __disableScrollCallback : null,
    __jumpRetryCallback : null,

    _log : function() {
      var that = this;
      return that.options['debug'] && window.console && console.log
          && Function.apply.call(console.log, console, arguments);
    },

    _create : function() {
      var ih, that = this;
      // attach to element
      that.element.addClass("ui-videoscrowl ui-widget").attr({
        role : "videoscrowl"
      });
      // read document dimensions
      ih = $(document).height();
      // optionally inflate document height
      var ihinf = ih + that.options['addHeight'];
      $('body').height(ihinf + 'px');
      // read back difference between window and document height
      that.height = $(document).height() - $(window).height();
      // setup the semaphors
      that.__disablePlayerEvent = false;
      that.__disableScrollEvent = false;
      // get video API reference to our video
      that.player = VideoJS(that.element.attr('id'));
      that.playerReady = false;
      that.player.ready(that._playerReadyEventAttach(that));
      // bind to window scroll event
      $(window).scroll(that._scrollEventAttach(that));
    },

    /**
     * Special jQuery UI method for catching changes to options
     * 
     * @param key
     *          string Name of option being set
     * @param value
     *          mixed New value
     */
    _setOption : function(key, value) {
      this._super(key, value);
    },

    _playerReadyEventAttach : function(that) {
      return function() {
        // re-grab the player just in case from player callback context
        that.player = this;
        // now the video's ready, get its length
        that.options['length'] = that.player.duration();
        that.playerReady = true;
        // bind to player timeupdate event
        that.player.addEvent("timeupdate", that._playerTimeUpdateEventAttach(that));
        // manually fire scroll event to set player position
        that.__disablePlayerEvent = true;
        that._scrollEventAttach(that)();
        that.__disablePlayerEvent = false;
      };
    },

    _playerTimeUpdateEventAttach : function(that) {
      return function() {
        var time, position;
        // lock critical section to avoid livelock
        if (that.__disablePlayerEvent)
          return;
        // check that we've been able to get the player length
        if (that.options['length'] == 0 || isNaN(that.options['length'])) {
          // refresh it now
          that.options['length'] = that.player.duration();
        }
        time = that.player.currentTime();
        position = time * that.height / that.options['length'];
        if (Math.abs($(window).scrollTop() - position) > that.options['thresholdPx']) {
          clearTimeout(that.__disableScrollCallback);
          that.__disableScrollEvent = true;
          // scroll to a position, then re-enable events once it's scrolled (and waited)
          that._scrollTo(position, function() {
            that._log('playerEvent: scroll to ' + Math.round(time) + 's, ' + Math.round(position) + 'px');
            // continue to disable scroll updates for changeDelay milliseconds
            that.__disableScrollEvent = false;
            that.__disableScrollCallback = setTimeout(function() {
              // scrollbar currently re-enabled instantly
            }, that.options['changeDelay']);
          });
        }
      };
    },

    _scrollEventAttach : function(that) {
      return function() {
        var position, video_perc, time;
        // lock critical section to avoid livelock
        if (that.__disableScrollEvent)
          return;
        // work out where we are in the scroll
        position = $(document).scrollTop();
        // that._log(Math.round(video_perc) + '%');
        if (that.playerReady) {
          time = position * that.options['length'] / that.height;
          // advance player to position
          if (Math.abs(that.player.currentTime() - time) > that.options['thresholdPx']) {
            clearTimeout(that.__disablePlayerCallback);
            that.__disablePlayerEvent = true;
            // jump the video to the new time, then proceed once it's set
            that._jumpTo(time, function() {
              that._log('scrollEvent: seek to ' + Math.round(time) + 's, ' + Math.round(position) + 'px');
              // continue to disable player updates for changeDelay milliseconds
              that.__disablePlayerCallback = setTimeout(function() {
                that.__disablePlayerEvent = false;
              }, that.options['changeDelay']);
            });
          }
        }
        else {
          // wait for player to wake up
        }
      };
    },

    /**
     * Advance the scrollbar to a position
     * 
     * @param position
     *          int scrollbar position in pixels
     * @param [callback]
     *          {Function} optional callback once completed
     */
    _scrollTo : function(position) {
      var that = this, callback = null;
      if (arguments.length >= 2) {
        callback = arguments[1];
      }
      // move the scollbar position
      $(window).scrollTop(position);
      // assume that the scroll update was instantaneous
      if (callback != null) {
        callback.call(that);
      }
      // tell any listeners that we've jumped
      that._trigger("scrollupdated");
    },

    /**
     * Jump the video player to a specific time This may involve waiting for the player to get to that point
     * 
     * @param time
     *          int Time in seconds
     * @param [callback]
     *          {Function} Callback function to execute when jump complete
     */
    _jumpTo : function(time) {
      var that = this, wait = 0, callback = null;
      if (arguments.length >= 2) {
        callback = arguments[1];
      }
      that.player.currentTime(time);
      var timeback = that.player.currentTime();
      that._log('jumpTo time[' + time + '] timeback[' + timeback + '] diff['
          + Math.round((Math.abs(timeback - time) * 1000)) + 'ms]');
      // see if we jumped to the right place in the video
      if ((Math.abs(timeback - time) * 1000) > that.options['thresholdMs']) {
        // see if there was a previous jump time set
        if (that.__jumpLastTime != 0) {
          // see if we've been given a new jump time this time
          if (time != that.__jumpLastTime) {
            // reset the number of retries
            that.__jumpRetries == 0;
          }
        }
        // set the last jump time
        that.__jumpLastTime = time;
        // if we haven't retried before, initialise retry vars
        if (that.__jumpRetries == 0) {
          that.__jumpRetries = 1;
        }
        // if we've retried too many times, fail
        else if (that.__jumpRetries == that.options['jumpRetriesMax']) {
          // failed to set video position
          that.__jumpRetries = 0;
          that.__jumpLastTime = 0;
          return;
        }
        // otherwise schedule another retry
        else {
          that.__jumpRetries++;
        }
        // if we still plan to retry the jump
        if (that.__jumpRetries > 0) {
          clearTimeout(that.__jumpRetryCallback);
          wait = that.options['jumpRetryWait'] * Math.pow(2, that.__jumpRetries - 1);
          that.__jumpRetryCallback = setTimeout(that._jumpToRetryAttach(that, time, callback), wait);
        }
      }
      else {
        // perfect result, video jumped straight to right place; clear jump time
        that.__jumpRetries = 0;
        that.__jumpLastTime = 0;
        that.__jumpRetryCallback = null;
        // tell the caller we've jumped the video
        if (callback) {
          callback.call(that);
        }
        // tell any listeners that we've jumped
        that._trigger("videoupdated");
      }
    },

    /**
     * Setup a callback to jumpTo with context
     * 
     * @param that
     *          {object} Context
     * @param time
     * @see _jumpTo:time
     * @param callback
     * @see _jumpTo:callback
     * @returns {Function}
     */
    _jumpToRetryAttach : function(that, time, callback) {
      return (function() {
        that._log('waited ' + that.options['jumpRetryWait'] * Math.pow(2, that.__jumpRetries - 1)
            + 'ms, calling jumpTo again');
        that._jumpTo(time, callback);
      });
    },

    _last : function() {
    } // no comma
  });

})(jQuery);
