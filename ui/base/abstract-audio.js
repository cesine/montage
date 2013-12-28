/*global require, exports*/

/**
 * @module montage/ui/base/abstract-audio.reel
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    MediaController = require("core/media-controller").MediaController;

/**
 * @class AbstractAudio
 * @extends Component
 */
var AbstractAudio = exports.AbstractAudio = Component.specialize(/** @lends AbstractAudio# */ {

    /**
     * @private
     */
    constructor: {
        value: function AbstractAudio() {
            if (this.constructor === AbstractAudio) {
                throw new Error("AbstractAudio cannot be instantiated.");
            }
            Component.constructor.call(this); // super
        }
    },

    _mediaElement: {
        value: null
    },

    mediaElement: {
        get: function () {
            return this._mediaElement;
        },
        set: function (element) {
            if (this._mediaElement) {
                this._mediaElement.controller = null;
            }
            this._mediaElement = element;
            if (this.audioController) {
                this._mediaElement.controller = this.audioController.mediaController;
            }
        }
    },

    _audioController: {
        value: null
    },

    /**
     * The MediaController instance used by the audio component.
     * @type {module:montage/core/media-controller.MediaController}
     * @default null
     */
    audioController: {
        get: function () {
            return this._audioController;
        },
        set: function (controller) {
            if (controller) {
                this._audioController = controller;
                if (this.mediaElement) {
                    this.mediaElement.controller = controller.mediaController;
                }
            }
        }
    },

    _src: {
        value: null
    },

    /**
     * @type {string}
     * @default null
     */
    src: {
        get: function () {
            return this._src;
        },
        set: function (src) {
            this._src = src;
        }
    },

    /**
     * @private
     */
    _sources: {
        value: []
    },
    /**
     * @type {Array}
     * @default null
     */
    sources: {
        get: function () {
            return this._sources;
        },
        set: function (sources) {
            if (sources && sources.length) {
                var mediaElement = this.element.ownerDocument.createElement("audio");
                for (var i = 0; i < sources.length; i++) {
                    var mediaSrc = sources[i].src,
                        mediaType = sources[i].type;
                    if (mediaType && mediaElement.canPlayType(mediaType)) {
                        this.src = mediaSrc;
                        break;
                    }
                }
                this._sources = sources;
            }
        }
    },

    /**
     * @method
     */
    loadMedia: {
        value: function () {
            this.mediaElement.src = this.src;
            this.mediaElement.load();
        }
    },

    _repeat: {
        value: false
    },

    /**
     * @type {Function}
     * @default {boolean} false
     */
    repeat: {
        get: function () {
            return this._repeat;
        },

        set: function (repeat) {
            if (repeat !== this._repeat) {
                this._repeat = repeat;
                if (repeat) {
                    this.mediaElement.setAttribute("loop", "true");
                } else {
                    this.mediaElement.removeAttribute("loop");
                }
                this.needsDraw = true;
            }
        }
    },

    /**
     * @method
     */
    toggleRepeat: {
        value: function () {
            this.repeat = !this.repeat;
        }
    },

    _posterSrc: {
        value: null
    },

    /**
     * @type {string}
     * @default null
     */
    posterSrc: {
        get: function () {
            return this._posterSrc;
        },
        set: function (posterSrc) {
            this._posterSrc = posterSrc;
        }
    },

    /**
     * @method
     */
    showPoster: {
        value: function () {
            if (this.posterSrc && this.mediaElement) {
                this.mediaElement.poster = this.posterSrc;
            }
        }
    },

    /**
     * Specifies whether the full screen audio is supported.
     * @type {boolean}
     * @default true
     */
    supportsFullScreen: {
        value: true
    },

    _isFullScreen: {
        value: false
    },

    /**
     * @type {boolean}
     */
    isFullScreen: {
        get: function () {
            return this._isFullScreen;
        }
    },

    /**
     * Toggles full-screen playback mode.
     * @method
     */
    toggleFullScreen: {
        value: function () {
            if (this.supportsFullScreen) {
                this._isFullScreen = !this._isFullScreen;
                if (!this._isFullScreen) {
                    if (this.element.webkitExitFullscreen) {
                        this.element.webkitExitFullscreen();
                    } else if (this.element.webkitCancelFullScreen) {
                        this.element.webkitCancelFullScreen();
                    } else if (this.element.ownerDocument.webkitCancelFullScreen && this.element.ownerDocument.webkitCurrentFullScreenElement === this.element) {
                        this.element.ownerDocument.webkitCancelFullScreen()
                    }
                } else {
                    if (this.element.webkitEnterFullScreen) {
                        this.element.webkitEnterFullScreen();
                    } else if (this.element.webkitRequestFullScreen) {
                        this.element.webkitRequestFullScreen();
                    }
                }
                this.needsDraw = true;
            }
        }
    },

    handleControllerStatusChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    handleControllerVolumeChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                // look for src attribute on original element
                if (this.originalElement.hasAttribute("src") && this.originalElement.getAttribute("src")) {
                    this.src = this.originalElement.getAttribute("src");
                } else {
                    // try to grab <source> child elements from original element
                    var sources = this.originalElement.getElementsByTagName("source"),
                        mediaSrc, mediaType;
                    for (var i = 0; i < sources.length; i++) {
                        mediaSrc = sources[i].getAttribute("src");
                        mediaType = sources[i].getAttribute("type");
                        if (mediaType && !this.mediaElement.canPlayType(mediaType)) {
                            continue;
                        }
                        this.src = mediaSrc;
                        break;
                    }
                }

                // try to grab <track> child elements from original element
                var tracks = this.originalElement.getElementsByTagName("track");
                for (var i = 0; i < tracks.length; i++) {
                    var trackKind = tracks[i].getAttribute("kind");
                    if (trackKind == "captions" || trackKind == "subtitles") {
                        var track = document.createElement("track");
                        track.kind = trackKind;
                        track.label = tracks[i].getAttribute("label");
                        track.src = tracks[i].getAttribute("src");
                        track.srclang = tracks[i].getAttribute("srclang");
                        track.default = tracks[i].hasAttribute("default");
                        this.mediaElement.appendChild(track);
                        this.mediaElement.textTracks[this.mediaElement.textTracks.length - 1].mode = "showing";
                    }
                }

                this.addPathChangeListener("audioController.status", this, "handleControllerStatusChange");
                this.addPathChangeListener("audioController.volume", this, "handleControllerVolumeChange");

                if (!this.audioController) {
                    this.audioController = Montage.create(MediaController);
                }
                this.mediaElement.controller = this.audioController.mediaController;
            }
        }
    }

});

