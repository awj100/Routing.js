# Routing.js #

Routing.js is a lightweight, client-side routing library that allows you to create "single page" applications using Hashbangs and/or HTML5 pushState.

# Features #
* Lightweight
* Supports the HTML5 History API, the 'onhashchange' method, and graceful degredation
* Supports root routes, fallback methods, paramaterised routes, optional route components (dynamic routes), and Aspect Oriented Programming
* Well Tested (tests available in the `./tests` directory)
* Compatible with all major browsers (Tested on Firefox 3.6, Firefox 4.0, Firefox 5.0, Chrome 9, Opera 11, IE7, IE8, IE9)
* Independant of all third party libraries, but plays nice with all of them

Routing.js is a fork of [PathJS](https://github.com/mtrpcic/pathjs) the primary differences are
* Internal logic for route-matching
* Parameters are returned as objects rather than the simple value from the URL

# Using Routing.js - A Brief Example #

```
function clearPanel(){
    // You can put some code in here to do fancy DOM transitions, such as fade-out or slide-in.
}
    
Routing.map("#/users")
        .to(function(){
            alert("Users!");
        });
    
Routing.map("#/comments")
        .to(function(){
            alert("Comments!");
        })
        .before(clearPanel);
    
Routing.map("#/posts")
        .to(function(){
            alert("Posts!");
        })
        .before(clearPanel);
    
Routing.root("#/posts");
    
Routing.listen();
```


# Running Tests #
To run the tests, simply navigate to the `./tests` folder and open the HTML file in your browser.  Please note that the HTML5 History API is not compatible with the
`file://` protocol.


# Pull Requests #
To make a pull request, please do the following:

* Mention what specific version of Routing.js you were using when you encountered the issue/added the feature.  This can be accessed by doing `Routing.version` in a debugger console
* Provide a [pastie](http://pastie.org/) or [gist](https://gist.github.com/) that demonstrates the bug/feature
* Make sure you update the test suite with your changes.  **All tests must pass**
* Make sure to update the minified version of the source
* Do **not** modify the `Routing.version` attribute.  I will modify that manually when merging the request

# Disclaimer #
This script is provided without warranty. As is, the script currently passes all its tests and so is believed to be fit for use. However, it is possible that the tests do not fulfil all possible scenarios and consequently further changes may be made which may break backwards compatibility. It should also be remembered that this script is not yet at version 1.

# Copyright and Licensing #
Copyright © 2014 Andrew Jameson, released under the MIT license.
