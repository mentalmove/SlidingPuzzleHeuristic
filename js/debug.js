function Bash (win_dow, docu_ment, inner_html) {

    this.limit = 24;

    var debug_zone;
    function set_console () {
        var arguments = set_console.arguments;
        if ( arguments.length ) {
            debug_zone = arguments[0];
            return;
        }

        debug_zone = docu_ment.createElement("div");
        var styles = {
            position: "absolute",
            bottom: "0px",
            left: "26%",
            width: "48%",
            color: "#007700",
            fontFamily: "monospace",
            backgroundColor: "#282828",
            fontSize: "14px",
            textAlign: "left",
            marginLeft: "0px"
        };
        for ( var property in styles )
            debug_zone.style[property] = styles[property];
        docu_ment.body.appendChild(debug_zone);
    }
    this.set_console = set_console;

    function long_numbers (n) {
        if ( n < 10 )
            return "00" + n;
        if ( n < 100 )
            return "0" + n;
        return n;
    }

    var message_count = 0;
    var messages = [];
    this.log = function (message) {

        if ( !debug_zone )
            set_console();
        if ( !debug_zone ) {
            console.log( message );
            return;
        }

        if ( messages.length >= this.limit )
            messages.pop();
        
        messages.unshift(message);
        debug_zone[inner_html] = "";
        
        var count = ++message_count;
        
        for ( var i = 0; i < messages.length; i++ )
            debug_zone[inner_html] += long_numbers(count - i) + " > " + messages[i] + "<br>";
    };
    this.warn = function (message) {
        var stars = "**";
        for ( var i = 0; i < message.length; i++ )
            stars += "*";
        stars += "*";
        var log_function = this.log;
        log_function("");
        log_function( stars + "*" );
        log_function( "* <span style='color: #FF8000'>" + message + "</span> *");
        log_function( "*" + stars);
        log_function("");
    }

}

var bash = new Bash(window, document, "innerHTML");
