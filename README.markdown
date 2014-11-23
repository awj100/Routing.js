# PathJS #

PathJS is a lightweight, client-side routing library that allows you to create "single page" applications using Hashbangs and/or HTML5 pushState.

# Features #
* Lightweight
* Supports the HTML5 History API, the 'onhashchange' method, and graceful degredation
* Supports root routes, fallback methods, paramaterised routes, optional route components (dynamic routes), and Aspect Oriented Programming
* Well Tested (tests available in the `./tests` directory)
* Compatible with all major browsers (Tested on Firefox 3.6, Firefox 4.0, Firefox 5.0, Chrome 9, Opera 11, IE7, IE8, IE9)
* Independant of all third party libraries, but plays nice with all of them

# Using PathJS - A Brief Example #

    function clearPanel(){
        // You can put some code in here to do fancy DOM transitions, such as fade-out or slide-in.
    }
    
    Path.map("#/users").to(function(){
        alert("Users!");
    });
    
    Path.map("#/comments").to(function(){
        alert("Comments!");
    }).before(clearPanel);
    
    Path.map("#/posts").to(function(){
        alert("Posts!");
    }).before(clearPanel);
    
    Path.root("#/posts");
    
    Path.listen();

# Documentation and Tips #
Any of the examples above confuse you?  Read up on the details in the [wiki](https://github.com/mtrpcic/pathjs/wiki).

# Examples #
You can find examples on the official [Github Page](http://mtrpcic.github.com/pathjs).

# Running Tests #
To run the tests, simply navigate to the `./tests` folder and open the HTML file in your browser.  Please note that the HTML5 History API is not compatible with the
`file://` protocol.

# Next Steps #
* Adding support for "after" callbacks
* Deprecating the "enter" callback in favour of "before"

# Pull Requests #
To make a pull request, please do the following:

* Mention what specific version of PathJS you were using when you encountered the issue/added the feature.  This can be accessed by doing `Path.version` in a debugger console
* Provide a [pastie](http://pastie.org/) or [gist](https://gist.github.com/) that demonstrates the bug/feature
* Make sure you update the test suite with your changes.  **All tests must pass**
* Make sure to update the minified version of the source
* Do **not** modify the `Path.version` attribute.  I will modify that manually when merging the request

# Disclaimer #
This script is provided without warranty. As is, the script currently passes all its tests and so is believed to be fit for use. However, it is possible that the tests do not fulfil all possible scenarios and consequently further changes may be made which may break backwards compatibility. It should also be remembered that this script is not yet at version 1.

# Copyright and Licensing #
Copyright (c) 2014 Andrew Jameson, released under the MIT license.
