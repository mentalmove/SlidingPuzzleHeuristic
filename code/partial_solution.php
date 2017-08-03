<?php
    header("Content-Type: text/javascript");

    error_reporting(E_STRICT | E_ALL);

    if ( !isset($_GET['puzzle']) || !$_GET['puzzle'] )
        bash.log( "personal_debug( 'No vaild puzzle data' );" );

    /**
     * Human-readable vardump
     * An invention of O. Schwarten, osdata.org
     */
    function v ($x) {
        echo "<pre>";
        print_r($x);
        echo "</pre>";
    }
    function c ($x) {
        echo "console.log(\"";
        if ( !is_array($x) )
            echo $x;
        elseif ( !empty($x) )
            echo implode (" | ", $x);
        echo "\");";
    }
    
    /*  */
    
    function next_step ($new_piece_line, $new_moves_made, $new_preferred_pieces, $new_tabu_pieces) {
        
        $statement = "if ( " . CALLBACK . "_allowed ) ";
        $statement .= "lS('";
        $statement .= "code/partial_solution.php?puzzle=" . implode(";", $new_piece_line);
        $statement .= "&moves_made=" . implode(";", $new_moves_made);
        $statement .= "&preferred_pieces=" . implode(";", $new_preferred_pieces);
        $statement .= "&tabu_pieces=" . implode(";", $new_tabu_pieces);
        $statement .= "&offset=" . (OFFSET + 1);
        $statement .= "&callback=" . CALLBACK;
        $statement .= "&row_or_col=" . ROW_OR_COL;
        $statement .= "' );";
        

        die( $statement );
    }
    
    
    function would_be_closer ($actual, $eventual, $wanted) {
        
        $actual_horizontal = abs(($actual % COLS) - ($wanted % COLS));
        $actual_vertical = abs( (int) ($actual / COLS) - (int) ($wanted / COLS) );
        $actual_distance = $actual_horizontal + $actual_vertical;
        
        $eventual_horizontal = abs(($eventual % COLS) - ($wanted % COLS));
        $eventual_vertical = abs( (int) ($eventual / COLS) - (int) ($wanted / COLS) );
        $eventual_distance = $eventual_horizontal + $eventual_vertical;
        
        return ($eventual_distance < $actual_distance) ? 1 : 0;
    }
    
    function eventually_continue_search ($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $tabu_pieces) {
        if ( empty($moves_made) || $situation[$moving_piece_position] != $moves_made[count($moves_made) - 1] ) {
            $better = would_be_closer($moving_piece_position, $black_position, ($situation[$moving_piece_position] - 1));
            if ( $better || $allowed_faults > 0 ) {
                
                $tmp_moves_made = $moves_made;
                $tmp_moves_made[] = $situation[$moving_piece_position];
                
                $tmp_situation = $situation;
                $tmp_situation[$black_position] = $situation[$moving_piece_position];
                $tmp_situation[$moving_piece_position] = $situation[$black_position];
                
                if ( $better ) {
                    stack_search($tmp_situation, $moving_piece_position, $tmp_moves_made, $allowed_faults, $preferred_pieces, $tabu_pieces);
                    return 1;
                }
                else
                    stack_search($tmp_situation, $moving_piece_position, $tmp_moves_made, --$allowed_faults, $preferred_pieces, $tabu_pieces);
            }
        }
        return 0;
    }
    
    function stack_search ($situation, $black_position, $moves_made, $allowed_faults, $preferred_pieces, $tabu_pieces) {
        
        $found_something_good = 0;
        
        // move black piece up, other piece down
        if ( ($black_position - COLS) >= 0 ) {
            $moving_piece_position = $black_position - COLS;

            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        // move black piece to right, other piece to left
        if ( ($black_position % COLS) != (COLS - 1) ) {
            $moving_piece_position = $black_position + 1;
            
            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        // move black piece down, other piece up
        if ( ($black_position + COLS) < (COLS * COLS) ) {
            $moving_piece_position = $black_position + COLS;
            
            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        // move black piece to left, other piece to right
        if ( ($black_position % COLS) != 0 ) {
            $moving_piece_position = $black_position - 1;
            
            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        if ( !$found_something_good ) {
            $solution_is_found = 1;
            
            for ( $i = 0; $i < count($preferred_pieces); $i++ ) {
                if ( $situation[$preferred_pieces[$i] - 1] != $preferred_pieces[$i] ) {
                    $solution_is_found = 0;
                    break;
                }
            }

            if ( $solution_is_found )
                die( CALLBACK . "( [" . implode(", ", $moves_made) . "], [" . implode(", ", $situation) . "], '" . ROW_OR_COL . "' );" );
        }
    }
    
    /*  */
    
    $sent_puzzle = $_GET['puzzle'];
    $piece_line = explode(";", $sent_puzzle);
    for ( $i = 0; $i < count($piece_line); $i++ ) {
        if ( !$piece_line[$i] ) {
            $black_index = $i;
            break;
        }
    }
    
    define("COLS", sqrt(count($piece_line)));
    if ( isset($_GET['offset']) && $_GET['offset'] )
        define("OFFSET", $_GET['offset']);
    else
        define("OFFSET", 0);
    
    define("CALLBACK", $_GET['callback']);
    define("ROW_OR_COL", $_GET['row_or_col']);
    
    
    $moves_made = Array();
    if ( isset($_GET['moves_made']) && $_GET['moves_made'] ) {
        $moves_made = explode(";", $_GET['moves_made']);
    }

    $preferred_pieces = Array();
    if ( isset($_GET['preferred_pieces']) && $_GET['preferred_pieces'] ) {
        $preferred_pieces = explode(";", $_GET['preferred_pieces']);
    }
    // tabu_pieces
    $tabu_pieces = Array();
    if ( isset($_GET['tabu_pieces']) && $_GET['tabu_pieces'] ) {
        $tabu_pieces = explode(";", $_GET['tabu_pieces']);
    }
    
    
    stack_search($piece_line, $black_index, $moves_made, OFFSET, $preferred_pieces, $tabu_pieces);
    
    next_step($piece_line, $moves_made, $preferred_pieces, $tabu_pieces);
?>
