var Montage = require("montage").Montage,
    AbstractAudio = require("montage/ui/base/abstract-audio").AbstractAudio,
    MockDOM = require("mocks/dom");

AbstractAudio.prototype.hasTemplate = false;

describe("test/base/abstract-audio-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractAudio();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var AbstractAudioSubtype = AbstractAudio.specialize({});
            var aAbstractAudioSubtype = null;
            expect(function () {
                aAbstractAudioSubtype = new AbstractAudioSubtype();
            }).not.toThrow();
            expect(aAbstractAudioSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var AudioPlayer = AbstractAudio.specialize({}),
            anAudioPlayer;

        describe("mediaElement", function () {
            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
                anAudioPlayer.enterDocument(true);
            });

            it("should have controller after creation", function() {
                expect(anAudioPlayer.mediaElement.controller).not.toBeNull();
            });
            
            it("should unlink native media controller when changed", function() {
                var oldMediaElement = anAudioPlayer.mediaElement;
                anAudioPlayer.mediaElement = MockDOM.element();
                expect(anAudioPlayer.audioController.mediaController).not.toEqual(oldMediaElement.controller);
            });

            it("should link native media controller to new element when changed", function() {
                var newMediaElement = MockDOM.element()
                anAudioPlayer.mediaElement = newMediaElement;
                expect(anAudioPlayer.audioController.mediaController).toEqual(newMediaElement.controller);
            });

            it("should link new native media controller when changed", function() {
                var newMediaController = {};
                anAudioPlayer.audioController = {
                    mediaController : newMediaController
                };
                expect(anAudioPlayer.mediaElement.controller).toEqual(newMediaController);
            });

        });
        
        describe("audioController", function () {
            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
                anAudioPlayer.enterDocument(true);
            });

            it("should be set after enterDocument()", function() {
                expect(anAudioPlayer.audioController).not.toBeNull();
            });
            
            it("should link native media controller to media element", function() {
                expect(anAudioPlayer.audioController.mediaController).toEqual(anAudioPlayer.mediaElement.controller);
            });

            it("should unlink native media controller when changed", function() {
                var oldMediaController = anAudioPlayer.audioController.mediaController;
                anAudioPlayer.audioController = {
                    mediaController : {}
                };
                expect(anAudioPlayer.mediaElement.controller).not.toEqual(oldMediaController);
            });

            it("should link new native media controller when changed", function() {
                var newMediaController = {};
                anAudioPlayer.audioController = {
                    mediaController : newMediaController
                };
                expect(anAudioPlayer.mediaElement.controller).toEqual(newMediaController);
            });

        });
        
        describe("src", function () {
            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
            });

            it("should read initial value from original element", function() {
                anAudioPlayer.originalElement.setAttribute("src", "sample.mov");
                anAudioPlayer.enterDocument(true);

                expect(anAudioPlayer.src).toBe("sample.mov");
            });

            it("should read initial value from child source elements", function() {
                var sourceElements = [
                    MockDOM.element(),
                    MockDOM.element()
                ];
                sourceElements[0].tagName = "source";
                sourceElements[0].setAttribute("src", "movie1.ogg");
                sourceElements[0].setAttribute("type", "audio/ogg");
                sourceElements[1].tagName = "source";
                sourceElements[1].setAttribute("src", "movie2.ogg");
                sourceElements[1].setAttribute("type", "audio/ogg");
                anAudioPlayer.originalElement.childNodes = sourceElements;
                anAudioPlayer.mediaElement.canPlayType = function(type) {
                    if (type === "audio/ogg") {
                        return "maybe";
                    }
                };
                anAudioPlayer.enterDocument(true);

                expect(anAudioPlayer.src).toBe("movie1.ogg");
            });

            it("should read initial value from child source elements only with valid type", function() {
                var sourceElements = [
                    MockDOM.element(),
                    MockDOM.element()
                ];
                sourceElements[0].tagName = "source";
                sourceElements[0].setAttribute("src", "movie1.ogg");
                sourceElements[0].setAttribute("type", "invalid/type");
                sourceElements[1].tagName = "source";
                sourceElements[1].setAttribute("src", "movie2.ogg");
                sourceElements[1].setAttribute("type", "audio/ogg");
                anAudioPlayer.originalElement.childNodes = sourceElements;
                anAudioPlayer.mediaElement.canPlayType = function(type) {
                    if (type === "audio/ogg") {
                        return "maybe";
                    }
                };
                anAudioPlayer.enterDocument(true);

                expect(anAudioPlayer.src).toBe("movie2.ogg");
            });
        });

        describe("sources", function () {
            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.element = MockDOM.element();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
                anAudioPlayer.element.ownerDocument.createElement = function() {
                    var element = MockDOM.element();
                    element.canPlayType = function(type) {
                        if (type === "audio/ogg") {
                            return "maybe";
                        }
                    };
                    return element;
                };
                anAudioPlayer.enterDocument(true);
            });

            it("should use first source with known/valid media type", function() {
                anAudioPlayer.sources = [
                    {src: "movie1.ogg", type: "audio/ogg"},
                    {src: "movie2.ogg", type: "audio/ogg"}
                ];
                expect(anAudioPlayer.src).toBe("movie1.ogg");
            });

            it("should skip sources with unknown/invalid media type", function() {
                anAudioPlayer.sources = [
                    {src: "movie1.ogg", type: "invalid/type"},
                    {src: "movie2.ogg", type: "audio/ogg"}
                ];
                expect(anAudioPlayer.src).toBe("movie2.ogg");
            });

            it("should save all sources", function() {
                var sources = [
                    {src: "movie1.ogg", type: "invalid/type"},
                    {src: "movie2.ogg", type: "audio/ogg"}
                ];
                anAudioPlayer.sources = sources;
                expect(anAudioPlayer.sources).toEqual(sources);
            });
        });

        describe("repeat", function () {
            var AudioPlayer = AbstractAudio.specialize({}),
                anAudioPlayer;

            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
                anAudioPlayer.enterDocument(true);
            });

            it("should have default value 'false'", function () {
                expect(anAudioPlayer.repeat).toBeFalsy();
            });

            it("can be set directly", function () {
                anAudioPlayer.repeat = true;
                expect(anAudioPlayer.repeat).toBeTruthy();
            });

            it("can be toggled", function () {
                anAudioPlayer.toggleRepeat();
                expect(anAudioPlayer.repeat).toBeTruthy();
            });

            it("can be toggled back", function () {
                anAudioPlayer.toggleRepeat();
                anAudioPlayer.toggleRepeat();
                expect(anAudioPlayer.repeat).toBeFalsy();
            });

        });


        describe("isFullScreen", function () {
            var AudioPlayer = AbstractAudio.specialize({}),
                anAudioPlayer;

            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.element = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
                anAudioPlayer.supportsFullScreen = true;
                anAudioPlayer.enterDocument(true);
            });

            it("should have default value 'false'", function () {
                expect(anAudioPlayer.isFullScreen).toBeFalsy();
            });

            it("can not be set directly", function() {
                anAudioPlayer.isFullScreen = true;
                expect(anAudioPlayer.isFullScreen).toBeFalsy();
            });

            it("can be toggled", function() {
                anAudioPlayer.toggleFullScreen();
                expect(anAudioPlayer.isFullScreen).toBeTruthy();
            });

            it("can not be toggled if fullscreen is not supported", function() {
                anAudioPlayer.supportsFullScreen = false;
                anAudioPlayer.toggleFullScreen();
                expect(anAudioPlayer.isFullScreen).toBeFalsy();
            });

            it("can be toggled back", function() {
                anAudioPlayer.toggleFullScreen();
                anAudioPlayer.toggleFullScreen();
                expect(anAudioPlayer.isFullScreen).toBeFalsy();
            });
        });

        describe("supportsFullScreen", function () {
            var AudioPlayer = AbstractAudio.specialize({}),
                anAudioPlayer;

            beforeEach(function () {
                anAudioPlayer = new AudioPlayer();
                anAudioPlayer.originalElement = MockDOM.element();
                anAudioPlayer.element = MockDOM.element();
                anAudioPlayer.mediaElement = MockDOM.element();
                anAudioPlayer.enterDocument(true);
            });

            it("should have default value 'true'", function () {
                expect(anAudioPlayer.supportsFullScreen).toBeTruthy();
            });

            it("can be set", function() {
                anAudioPlayer.supportsFullScreen = false;
                expect(anAudioPlayer.supportsFullScreen).toBeFalsy();
            });

        });

    });

    describe("draw", function () {
        var AudioPlayer = AbstractAudio.specialize(),
            anAudioPlayer;

        beforeEach(function () {
            anAudioPlayer = new AudioPlayer();
            anAudioPlayer.originalElement = MockDOM.element();
            anAudioPlayer.mediaElement = MockDOM.element();
            anAudioPlayer.enterDocument(true);
        });
        
        it("should be requested after repeat state is changed", function () {
            anAudioPlayer.repeat = !anAudioPlayer.repeat;
            expect(anAudioPlayer.needsDraw).toBeTruthy();
        });

        it("should be requested after controller volume is changed", function () {
            anAudioPlayer.audioController.volume = 47;
            expect(anAudioPlayer.needsDraw).toBeTruthy();
        });

        it("should be requested after controller status is changed", function () {
            anAudioPlayer.audioController.status = anAudioPlayer.audioController.PLAYING;
            expect(anAudioPlayer.needsDraw).toBeTruthy();
        });

    });

});
