/*
Routing.js © Andrew Jameson, 2014, and licensed under the MIT license.
Routing.js is hosted at https://github.com/awj100/Routing.js
Routing.js was forked from PathJS, https://github.com/mtrpcic/pathjs
*/

var Routing = function(win, doc) {

    var self = this,

        doBefore = [],

        doBuild = function(route, params, includeHashbang) {

            if (typeof(includeHashbang) === "undefined") {
                includeHashbang = true;
            }

            // remove the hashbang
            // - as this is optional, removing it means we can be sure to add it before returning
            route = route.replace(/#!?\/?/, "");

            // split each of the segments
            var segments = route.split(/[/|\(/?]+/),
                i = 0,
                iMax = segments.length;

            for (; i < iMax; i++) {

                var segment = segments[i],
                    typ = getSegmentType(segment), // the type of this segment (static, mandatory, optional)
                    nam = getSegmentName(segment, typ), // the name of this segment
                    suppliedParam = params[nam]; // the corresponding value for this segment as supplied in the 'params' object (can be "undefined")

                // we're not interested in type 0 (static) as these don't require any processing
                switch (typ) {
                    case 1: // mandatory segments
                        // replace with the supplied value
                        // - this will insert "undefined" is the value has not been supplied in 'params'
                        route = route.replace(":" + nam, suppliedParam);
                        break;

                    case 2: // optional segments
                        if (typeof(suppliedParam) === "undefined") {

                            // because this is an optional segment, if no value has been supplied then just remove the segment
                            route = route.replace("(/:" + nam + ")", "");

                        } else {

                            route = route.replace("(/:" + nam + ")", "/" + suppliedParam);
                        }
                        break;
                }
            }

            return includeHashbang ?
                "#!/" + route :
                route;
        },

        doLeaving = null,

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

                    self.history.initial = self.history.initial || {};
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

        refreshing = false,

        Route = function(routeTemplate) {

            var thisRoute = this;

            thisRoute.action = null;
            thisRoute.doBefore = [];
            thisRoute.doLeaving = null;
            thisRoute.fromCache = false;
            thisRoute.mandatory = 0;
            thisRoute.mandWithOpts = 0;
            thisRoute.params = {};
            thisRoute.path = routeTemplate;
            thisRoute.segments = [];

            thisRoute.before = function(fns) {

                if (Object.prototype.toString.call(fns) === '[object Array]') {

                    thisRoute.doBefore = thisRoute.doBefore.concat(fns);

                } else {

                    thisRoute.doBefore.push(fns);
                }

                return thisRoute;
            };

            thisRoute.leaving = function(fn) {

                thisRoute.doLeaving = fn;

                return thisRoute;
            };

            thisRoute.run = function() {

                var i = 0,
                    iMax = routes["defined"].length,
                    result,
                    definedRoute;

                for (; i < iMax; i++) {

                    if (routes["defined"][i].path === thisRoute.path) {

                        definedRoute = routes["defined"][i];

                        // handle this route's doBefore functions
                        if (definedRoute.doBefore.length > 0) {

                            for (i = 0, iMax = definedRoute.doBefore.length; i < iMax; i++) {

                                result = definedRoute.doBefore[i].apply(thisRoute, []);

                                if (typeof(result) === "boolean" && !result) {
                                    return false;
                                }
                            }
                        }

                        // handle the global doBefore functions
                        if (doBefore.length > 0) {
                            for (var j = 0, jMax = doBefore.length; j < jMax; j++) {

                                result = doBefore[j].apply(thisRoute, []);

                                if (typeof(result) === "boolean" && !result) {
                                    return false;
                                }
                            }
                        }

                        if (typeof(definedRoute.action) === "function") {
                            definedRoute.action();
                        }

                        break;
                    }
                }
            };

            thisRoute.to = function(fn) {

                thisRoute.action = fn;

                return thisRoute;
            };
        },

        routes = {
            "before": function(fns) {

                if (Object.prototype.toString.call(fns) === '[object Array]') {

                    doBefore = doBefore.concat(fns);

                } else {

                    doBefore.push(fns);
                }

                return this;
            },
            "cache": [],
            "current": null,
            "defined": [], // this will host instances of 'route'
            "fallback": null,
            "leaving": function(fn) {

                doLeaving = fn;

                return this;
            },
            "previous": null,
            "root": null
        },

        checkParamsChanged = function(definedRoute, params) {

            if (routes.current !== null) {

                var previousParams = routes.current.params;
                for (var propertyName in params) {

                    var thisPropVal = params[propertyName]["value"],
                        previousProp = previousParams[propertyName];

                    params[propertyName]["hasChanged"] = typeof(previousProp) !== "undefined" ?
                        previousProp["value"] !== thisPropVal :
                        true;
                }
            }

            definedRoute.params = params;
        },

        doDispatch = function(passedPath) {

            // check if there's a 'refresh' param at the end of the URL - must be at the end
            var params = passedPath.split("/");
            if (params.pop() === "refresh") {

                win.location.hash = params.join("/");
                refreshing = true;

                return false;
            }

            passedPath = passedPath.replace(/#!?\/?/, "");

            if (routes.current === null || routes.current.path !== passedPath || refreshing) {

                routes.previous = routes.current;
                routes.current = doMatch(passedPath);
                refreshing = false;

                if (routes.previous && routes.previous.doLeaving !== null && typeof(routes.previous.doLeaving) === "function") {

                    routes.previous.doLeaving();
                }

                if (doLeaving !== null && typeof(doLeaving) === "function") {
                    doLeaving();
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
                doDispatch(win.location.hash);
            };

            if (win.location.hash === "" && routes.root !== null) {
                win.location.hash = routes.root;
            }

            // The 'doc.documentMode' checks below ensure that PathJS fires the right events
            // even in IE "Quirks Mode".
            if ("onhashchange" in win && (!doc.documentMode || doc.documentMode >= 8)) {
                win.onhashchange = fnDispatch;
            } else {
                setInterval(fnDispatch, 50);
            }

            if (win.location.hash !== "") {
                doDispatch(win.location.hash);
            }
        },

        doMap = function(routeTemplate) {

            routeTemplate = routeTemplate.replace(/#!?\/?/, "");

            // check whether this route has already been declared
            for (var i = 0, iMax = routes["defined"].length; i < iMax; i++) {
                if (routes["defined"][i].path === routeTemplate) {
                    return routes["defined"][i];
                }
            }

            var segments = routeTemplate.split(/[/|\(/?]+/),
                r = new Route(routeTemplate),
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

        doMatch = function(routeTemplate) {

            var definedRoute;

            // check whether we have this path in the cache
            for (var i = 0, iMax = routes.cache.length; i < iMax; i++) {

                if (routes.cache[i].path === routeTemplate) {

                    // this path has been cached

                    definedRoute = routes.cache[i].mappedTo;

                    // check whether each param has been changed since the last route
                    checkParamsChanged(definedRoute, routes.cache[i].params);

                    definedRoute.fromCache = true;

                    return definedRoute;
                }
            }

            // no match was found in the cache

            var i = 0,
                iMax = routes["defined"].length,
                segments = routeTemplate.split("/");

            // loop through each route
            // - remember that the routes are ordered from the most params to the least
            for (; i < iMax; i++) {

                definedRoute = routes["defined"][i];

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

                    // cache this route
                    routes.cache.push({
                        params: params,
                        path: routeTemplate,
                        mappedTo: definedRoute
                    });

                    definedRoute.fromCache = false;

                    // check whether each param has been changed since the last route
                    checkParamsChanged(definedRoute, params);

                    return definedRoute;
                }
            }

            return null;
        },

        doRefresh = function() {

            var current = win.location.hash;

            if (current === null || current.length === 0) {
                return false;
            }

            win.location.hash = current + (current.charAt(current.length - 1) === "/" ?
                "refresh" :
                "/refresh");

            return true;
        },

        doRoot = function(routeTemplate) {

            routes.root = routeTemplate;
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

            return segment.charAt(0) === ":" ?
                segment.charAt(segment.length - 1) === ")" ?
                2 // optional param
                :
                1 // param
                :
                0; // static (text) segment
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
        /**
         * Builds a route from the given template and parameters.
         * param {string} route - The route template into which the parameters should be inserted.
         * param {object} params - An object containing the parameters which should replace the segments in the route.
         * param {boolean} includeHashbang (Optional) - Indicates whether the returned (populated) route should include the hashbang.
         */
        "build": doBuild,

        /**
         * Adds a function which will handle missing routes.
         * @param  {function} fn - A function which will be called when the browser has navigated to a route which has not been declared.
         */
        "fallback": doFallback,

        "history": history,

        /**
         * Starts Routing.js listening to changes in the URL
         */
        "listen": doListen,

        /**
         * Adds a route to the collection of handled routes.
         * @param  {string} routeTemplate - The template of the route to be added.
         */
        "map": doMap,

        /**
         * A function which forces the current route to be reloaded. Has no effect if there is no current client-side route.
         */
        "refresh": doRefresh,

        /**
         * The default route to be used if a user lands on a page without a cllient-side route. 
         * @param {string} - routeTemplate - The default route.
         */
        "root": doRoot,

        /**
         * The current collection of routes.
         * @returns {object} An object containing details of the declared routes.
         */
        "routes": routes,

        /**
         * This version of Routing.js.
         */
        "version": "0.9.4"
    };
}(window, document);