<?php
    define("COLS", 4);
    
    $cell_size = (128 - (COLS * 16));
    $font_size = $cell_size / 2;
    
    /**
     * Human-readable vardump
     * An invention of O. Schwarten, osdata.org
     */
    function v ($x) {
        echo "<pre>";
        print_r($x);
        echo "</pre>";
    }
    
    /*  */
    
    function make_colour ($min = 0, $max = 15) {
	$colours = Array();
	
	for ( $i = 0; $i < 6; $i++)
	    if ( $i % 2 )
		$colours[$i] = dechex(rand(0, 15));
	    else
		$colours[$i] = dechex(rand($min, $max));
	
	$colour = implode("", $colours);
	
	return "#" . $colour;
    }
    $colours = Array( "black" );
    for ( $i = 0; $i < (COLS * COLS); $i++ )
        $colours[] = make_colour(12);
    
    function create_table () {
        $table = "<table cellspacing='0'>";
        for ( $i = 0; $i < COLS; $i++ ) {
            $table .= "<tr>";
            for ( $j = 0; $j < COLS; $j++ ) {
                $number = $i * COLS + $j + 1;
                /**
                 * When used with 'js/oop.js', the second parameter can be omitted
                 */
                $table .= "<td id='cell" . $number . "' onmousedown='move_piece(" . ($number - 1) . ", 1)'>";
                $table .= "</td>";
            }
            $table .= "</tr>";
        }
        $table .= "</table>";
        
        return $table;
    }
    
    function create_js_basic_values ($colours) {
        $return = "var PIECES = " . (COLS * COLS) . ";\n";
        $return .= "var COLS = " . COLS . ";\n";
        $return .= "var colours = [ \"" . $colours[0] . "\"";
        for ( $i = 1; $i < count($colours); $i++ )
            $return .= ", \"" . $colours[$i] . "\"";
        $return .= " ];\n";
        
        return $return;
    }
?>
