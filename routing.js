/*
Routing.js © Andrew Jameson, 2014, and licensed under the MIT license.
Routing.js is hosted at https://github.com/awj100/Routing.js
Routing.js was forked from PathJS, https://github.com/mtrpcic/pathjs
*/

var Routing = function (win, doc) {

    var self = this,

        refreshing = false,

        history = {
            "initial": {}, // Empty container for "Initial Popstate" checking variables.
            "pushState": function(state, title, path) {

                if (self.history.supported) {

                    if (doDispatch(path)) {

                        win.history.pushState(state, title, path);
                    }

                } else {

                    if (self.history.fallback) {

                        win.location.hash = "#" + path;
                    }
                }
            },
            "popState": function() {

                var initialPop = !self.history.initial.popped && location.href == self.history.initial.URL;
                self.history.initial.popped = true;
                if (initialPop) {
                    return;
                }
                doDispatch(doc.location.pathname);
            },
            "listen": function(fallback) {

                self.history.supported = !!(win.history && win.history.pushState);
                self.history.fallback = fallback;

                if (self.history.supported) {

                    self.history.initial.popped = ("state" in win.history), self.history.initial.URL = location.href;
                    win.onpopstate = self.history.popState;

                } else {

                    if (self.history.fallback) {

                        for (var i = 0, iMax = routes["defined"].length; i < iMax; i++) {

                            var route = routes["defined"][i];
                            if (route.path.charAt(0) != "#") {
                                route.path = "#" + route.path;
                            }
                        }

                        doListen();
                    }
                }
            }
        },

        route = function(path) {

            var self = this;

            self.path = path;
            self.action = null;
            self.do_before = [];
            self.do_exit = null;
            self.params = {};
            self.segments = [];
            self.mandatory = 0;
            self.mandWithOpts = 0;

            self.before = function(fns) {

                if (fns instanceof Array) {

                    this.do_before = this.do_before.concat(fns);

                } else {

                    this.do_before.push(fns);
                }

                return this;
            };

            self.leaving = function(fn) {

                this.do_exit = fn;
                return this;
            };

            self.partition = function() {

                var parts = [],
                    options = [],
                    re = /\(([^}]+?)\)/g,
                    text,
                    i = 0;

                while (text = re.exec(this.path)) {
                    parts.push(text[1]);
                }

                options.push(this.path.split("(")[0]);

                for (; i < parts.length; i++) {
                    options.push(options[options.length - 1] + parts[i]);
                }

                return options;
            };

            self.run = function() {

                var haltExecution = false,
                    i = 0,
                    iMax = routes["defined"].length,
                    result,
                    definedRoute;

                for (; i < iMax; i++) {

                    if (routes["defined"][i].path === this.path) {

                        definedRoute = routes["defined"][i];

                        if (definedRoute.do_before.length > 0) {
                            for (i = 0, iMax = definedRoute.do_before.length; i < iMax; i++) {

                                result = definedRoute.do_before[i].apply(this, []);

                                if (result === false) {
                                    haltExecution = true;
                                    break;
                                }
                            }
                        }

                        if (!haltExecution) {
                            definedRoute.action();
                        }

                        break;
                    }
                }
            };

            self.to = function(fn) {

                this.action = fn;
                return this;
            };
        },

        routes = {
            "current": null,
            "root": null,
            "fallback": null,
            "previous": null,
            "defined": []   // this will host instances of 'route'
        },

        addOrGetRoute = function(path) {

            // check whether this route has already been declared
            for (var i = 0, iMax = routes["defined"].length; i < iMax; i++) {
                if (routes["defined"][i].path === path) {
                    return routes["defined"][i];
                }
            }

            // .slice(1) removes the first character, '#'
            var segments = path.slice(1).split(/[/|\(/?]+/),
                r = new route(path),
                i = 0,
                iMax = segments.length;

            for (; i < iMax; i++) {

                var segment = segments[i],
                    typ = getSegmentType(segment),
                    nam = getSegmentName(segment, typ);

                r.segments.push({
                    "segment": nam,
                    "type": typ
                });

                if (typ === 0 || typ === 1) {
                    r.mandatory++;
                }
                r.mandWithOpts++;
            }

            routes["defined"].push(r);

            // re-order the routes to prioritise those with more segments
            routes["defined"].sort(orderBySegments);

            return r;
        },

        doDispatch = function(passedPath) {

            // check if there's a 'refresh' param at the end of the URL - must be at the end
            var params = passedPath.split("/");
            if (params.pop() === "refresh") {

                win.location.hash = params.join("/");
                refreshing = true;
                return false;
            }

            if (routes.current === null || routes.current.path !== passedPath || refreshing) {

                routes.previous = routes.current;
                routes.current = doMatch(passedPath);
                refreshing = false;

                if (routes.previous && routes.previous.do_exit !== null) {

                    routes.previous.do_exit();
                }

                if (routes.current !== null) {

                    routes.current.run();
                    return true;

                } else {

                    if (routes.fallback !== null) {
                        routes.fallback();
                    }
                }
            }

            return true;
        },

        doFallback = function(fn) {

            routes.fallback = fn;
        },

        doListen = function() {
            var fnDispatch = function() {
                doDispatch(location.hash);
            };

            if (location.hash === "") {
                if (routes.root !== null) {
                    location.hash = routes.root;
                }
            }

            // The 'doc.documentMode' checks below ensure that PathJS fires the right events
            // even in IE "Quirks Mode".
            if ("onhashchange" in win && (!doc.documentMode || doc.documentMode >= 8)) {
                win.onhashchange = fnDispatch;
            } else {
                setInterval(doDispatch, 50);
            }

            if (location.hash !== "") {
                fnDispatch();
            }
        },

        doMap = function(path) {

            return addOrGetRoute(path);
        },

        doMatch = function(path) {

            var i = 0,
                iMax = routes["defined"].length,
                segments = path.slice(1).split("/");

            // loop through each route
            // - remember that the routes are ordered from the most params to the least
            for (; i < iMax; i++) {

                var definedRoute = routes["defined"][i];

                // ensure that the current defined route has
                // - the same or less mandatory segments than the current URL segments
                // - the same or more mandatory-with-options segments than the current URL segments
                // i.e., [defined mandatory] <= [current URL segments] <= [defined mandatory with options]
                // if not then ignore this current defined route and check the next defined route
                if (segments.length < definedRoute.mandatory || segments.length > definedRoute.mandWithOpts) {
                    continue;
                }

                // now loop through each of the segments in the current defined route
                // - check if the static (text) segments match
                // if the segment is a param then add it to the 'params' object
                // - we won't assign this 'params' object unless the segments match
                var matchSoFar = true,
                    params = {},
                    j = 0,
                    jMax = definedRoute.segments.length;

                for (; j < jMax; j++) {

                    var definedSegment = definedRoute.segments[j],
                        possibleSegment = segments[j];

                    // if this segment is a parameter-type segment (i.e., not a static (text) segment) then record the name and value;
                    if (definedSegment["type"] !== 0) {

                        params[definedSegment.segment] = {
                            "value": possibleSegment,
                            "hasChanged": true
                        };

                    } else {

                        // this is a static (text) segment, so check that we have a match
                        if (definedSegment.segment !== possibleSegment) {

                            // if the segment text doesn't match then this 'route' object isn't a match
                            matchSoFar = false;
                            break;
                        }
                    }
                }

                if (matchSoFar) {

                    // if the path template of the matched route is the same as the path template of the previous route
                    // then check which params have changed
                    if (routes.current !== null && routes.current.path === definedRoute.path) {

                        var previousParams = routes.current.params;
                        for (var propertyName in params) {

                            var thisPropVal = params[propertyName]["value"],
                                previousProp = previousParams[propertyName];

                            params[propertyName]["hasChanged"] = typeof (previousProp) !== "undefined"
                                                                     ? previousProp["value"] !== thisPropVal
                                                                     : true;
                        }
                    }

                    // only assign the params object if it pertains to this route
                    definedRoute.params = params;

                    return definedRoute;
                }
            }

            return null;
        },

        doRefresh = function() {

            var params = routes !== null && routes.current !== null
                             ? routes.current.split("/")
                             : [];

            params.push("refresh");
            win.location.hash = params.join("/");

            return true;
        },

        doRoot = function(path) {

            routes.root = path;
        },

        getSegmentName = function(segment, typ) {

            switch (typ) {

                case 1:
                    return segment.slice(1);

                case 2:
                    return segment.substr(1, segment.length - 2);

                default:
                    return segment;
            }
        },

        getSegmentType = function(segment) {

            // eg, /hello/:world(/:opt-param)
            // "hello" = 0  - static (text) segment
            // "world" = 1  - param
            // " opt-param = 2  - optional param

            return segment.charAt(0) === ":"
                       ? segment.charAt(segment.length - 1) === ")"
                             ? 2 // optional param
                             : 1 // param
                       : 0; // static (text) segment
        },

        orderBySegments = function compare(a, b) {

            if (a.mandWithOpts < b.mandWithOpts) {
                return -1;
            }

            if (b.mandWithOpts < a.mandWithOpts) {
                return 1;
            }

            // if the .mandWithOpts are equal then compare .mandatory

            if (a.mandatory < b.mandatory) {
                return -1;
            }
            if (a.mandatory > b.mandatory) {
                return 1;
            }

            return 0;
        };
    
    return {
        "version": "0.9.0",
        "map": doMap,
        "root": doRoot,
        "fallback": doFallback,
        "history": history,
        "listen": doListen,
        "refresh": doRefresh,
        "routes": routes
    };
}(window, document);
