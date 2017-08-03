<?php
    header("Content-Type: text/javascript");
    /**
     * Used only when javascript file 'js/functional.js' is embedded
     * Easier to read version would be 'prepare_oop.php'
     */
    error_reporting(E_STRICT | E_ALL);

    if ( !isset($_GET['puzzle']) || !$_GET['puzzle'] || ( !isset($_GET['preferred_row']) && !isset($_GET['preferred_col']) ) )
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

    function restart ($new_piece_line, $new_moves_made, $new_row_or_col, $new_offset = 0) {
        
        $statement = "lS('";
        
        $statement .= "code/prepare.php?puzzle=" . implode(";", $new_piece_line);
        $statement .= "&preferred_" . $new_row_or_col . "=" . $_GET["preferred_" . $new_row_or_col];
        $statement .= "&moves_made=" . implode(";", $new_moves_made);
        if ( $new_offset )
            $statement .= "&offset=" . $new_offset;
        
        $statement .= "' );";
        
        die( $statement );
    }
    
    function next_step ($new_piece_line, $new_moves_made, $new_preferred_pieces, $new_deprecated_positions) {
        
        $tabu_pieces = Array();
        for ( $i = 0; $i < COLS; $i++ )
            $tabu_pieces[] = $new_piece_line[$new_deprecated_positions[$i]];
        
        $statement = "lS('";
        $statement .= "code/partial_solution.php?puzzle=" . implode(";", $new_piece_line);
        $statement .= "&moves_made=" . implode(";", $new_moves_made);
        $statement .= "&preferred_pieces=" . implode(";", $new_preferred_pieces);
        $statement .= "&tabu_pieces=" . implode(";", $tabu_pieces);
        $statement .= "&callback=first_line";
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
    
    function eventually_continue_search ($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) {
        if ( empty($moves_made) || $situation[$moving_piece_position] != $moves_made[count($moves_made) - 1] ) {
            $better = would_be_closer($moving_piece_position, $black_position, ($situation[$moving_piece_position] - 1));
            if ( $better || $allowed_faults > 0 ) {
                
                $tmp_moves_made = $moves_made;
                $tmp_moves_made[] = $situation[$moving_piece_position];
                
                $tmp_situation = $situation;
                $tmp_situation[$black_position] = $situation[$moving_piece_position];
                $tmp_situation[$moving_piece_position] = $situation[$black_position];
                
                if ( $better ) {
                    stack_search($tmp_situation, $moving_piece_position, $tmp_moves_made, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces);
                    return 1;
                }
                else
                    stack_search($tmp_situation, $moving_piece_position, $tmp_moves_made, --$allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces);
            }
        }
        return 0;
    }
    
    function stack_search ($situation, $black_position, $moves_made, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) {
        
        $found_something_good = 0;
        
        // move black piece up, other piece down
        if ( ($black_position - COLS) >= 0 ) {
            $moving_piece_position = $black_position - COLS;

            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        // move black piece to right, other piece to left
        if ( ($black_position % COLS) != (COLS - 1) ) {
            $moving_piece_position = $black_position + 1;
            
            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        // move black piece down, other piece up
        if ( ($black_position + COLS) < (COLS * COLS) ) {
            $moving_piece_position = $black_position + COLS;
            
            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        // move black piece to left, other piece to right
        if ( ($black_position % COLS) != 0 ) {
            $moving_piece_position = $black_position - 1;
            
            if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                if ( eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) )
                    $found_something_good = 1;
            }
        }
        
        
        if ( !$found_something_good ) {
            $solution_is_found = 1;
            for ( $i = 0; $i < COLS; $i++ ) {
                if ( !$situation[$deprecated_positions[$i]] || in_array($situation[$deprecated_positions[$i]], $preferred_pieces) ) {
                    $solution_is_found = 0;
                    break;
                }
            }
            if ( $solution_is_found )
                next_step($situation, $moves_made, $preferred_pieces, $deprecated_positions);
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
    
    
    $moves_made = Array();
    if ( isset($_GET['moves_made']) && $_GET['moves_made'] ) {
        $moves_made = explode(";", $_GET['moves_made']);
    }
    
    
    $preferred_positions = Array();
    $deprecated_positions = Array();
    $change_add = 0;
    $row_or_col = "";
    if ( isset($_GET['preferred_row']) ) {
        $row_or_col = "row";
        
        $deprecated_add = COLS * COLS - COLS;
        $deprecated_add *= ($_GET['preferred_row'] == 1) ? 1 : -1;
        
        $start_position = ($_GET['preferred_row'] - 1) * COLS;
        for ( $i = $start_position; $i < ($start_position + COLS); $i++ ) {
            $preferred_positions[] = $i;
            $deprecated_positions[] = $i + $deprecated_add;
        }
        
        if ( in_array($black_index, $preferred_positions) )
            $change_add = ($_GET['preferred_row'] == 1) ? 4 : -4;
    }
    if ( isset($_GET['preferred_col']) ) {
        $row_or_col = "col";
        
        $deprecated_add = COLS - 1;
        $deprecated_add *= ($_GET['preferred_col'] == 1) ? 1 : -1;
        
        $start_position = ($_GET['preferred_col'] - 1);
        for ( $i = $start_position; $i < count($piece_line); $i += COLS ) {
            $preferred_positions[] = $i;
            $deprecated_positions[] = $i + $deprecated_add;
        }
        
        if ( in_array($black_index, $preferred_positions) )
            $change_add = ($_GET['preferred_col'] == 1) ? 1 : -1;
    }
    
    if ( $change_add ) {
        for ( $i = 0; $i < COLS; $i++ ) {
            if ( !$piece_line[$preferred_positions[$i]] ) {
                $moved_piece = $piece_line[$preferred_positions[$i] + $change_add];
                $piece_line[$preferred_positions[$i] + $change_add] = 0;
                $piece_line[$preferred_positions[$i]] = $moved_piece;
                $moves_made[] = $moved_piece;
                break;
            }
        }
        
        restart($piece_line, $moves_made, $row_or_col);
    }
    
    
    define("ROW_OR_COL", $row_or_col);
    
    
    $tabu_pieces = Array();
    for ( $i = 0; $i < COLS; $i++ )
        $tabu_pieces[] = $piece_line[$preferred_positions[$i]];
    
    $preferred_pieces = Array();
    for ( $i = 0; $i < COLS; $i++ )
        $preferred_pieces[] = $preferred_positions[$i] + 1;
    
    
    stack_search($piece_line, $black_index, $moves_made, OFFSET, $preferred_pieces, $deprecated_positions, $tabu_pieces);
    
    restart($piece_line, $moves_made, $row_or_col, (OFFSET + 1));
?>
