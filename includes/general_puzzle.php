<?php
    /**
     * Human-readable vardump
     * An invention of O. Schwarten, osdata.org
     * 
     * Not used, but for debugging purpose
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

    /**
     * There is no technical need for OOP nor inheritance here
     * (each class has exactly one instance each time
     * the respective file is loaded).
     * 
     * Anyway, most modern developers consider
     * this way of writing code more readable.
     * The few friends of functional programming
     * might want to have a look at 'code/prepare.php' and 'code/partial_solution.php'
     * 
     * GeneralPuzzle
     * Everything what's identical in 'PreparePuzzle' and 'SolvePuzzlePartially'
     */
    class GeneralPuzzle {
        
        protected $piece_line;                                                  // Linearised puzzle
        protected $black_index;                                                 // Position without a piece
        protected $moves_made = Array();                                        // The way to reach the actual situation
        protected $preferred_pieces = Array();                                  // The ones we are interested in
        protected $tabu_pieces = Array();                                       // The ones we ignore
        protected $row_or_col = "";                                             // When task is split up, row or column is interesting - not both
        
        protected $cols;                                                        // The board's size. In our case: 4
        protected $offset;                                                      // How many moves into the wrong direction are allowed?
        
        
        /**
         * When value is '0', the respective index
         * must be home of the hole
         */
        private function detect_black_index () {
            for ( $i = 0; $i < count($this->piece_line); $i++ )
                if ( !$this->piece_line[$i] )
                    return $i;
        }
        
        /**
         * Would a given move bring the respective piece
         * closer to its wanted position?
         */
        protected function would_be_closer ($actual, $eventual, $wanted) {
        
            $actual_horizontal = abs(($actual % $this->cols) - ($wanted % $this->cols));
            $actual_vertical = abs( (int) ($actual / $this->cols) - (int) ($wanted / $this->cols) );
            $actual_distance = $actual_horizontal + $actual_vertical;

            $eventual_horizontal = abs(($eventual % $this->cols) - ($wanted % $this->cols));
            $eventual_vertical = abs( (int) ($eventual / $this->cols) - (int) ($wanted / $this->cols) );
            $eventual_distance = $eventual_horizontal + $eventual_vertical;

            return ($eventual_distance < $actual_distance) ? 1 : 0;
        }
        
        /**
         * Tries the 4 allowed moves, if possible.
         * If
         *      - the piece shall not be ignored and
         *      - the move would improve the situation or declining is allowed and
         *      - the move doesn't reverse the last move
         * it will be executed.
         * 
         * If no move is possible, the puzzle potentially is solved.
         */
        protected function stack_search ($situation, $black_position, $moves_made, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) {
            
            $conditions = Array(
                ($black_position - $this->cols) >= 0,                           // move black piece up, other piece down
                ($black_position % $this->cols) != ($this->cols - 1),           // move black piece to right, other piece to left
                ($black_position + $this->cols) < ($this->cols * $this->cols),  // move black piece down, other piece up
                ($black_position % $this->cols) != 0                            // move black piece to left, other piece to right
            );
            $moving_piece_positions = Array(
                $black_position - $this->cols,
                $black_position + 1,
                $black_position + $this->cols,
                $black_position - 1
            );
        
            $found_something_good = 0;
            
            for ( $i = 0; $i < 4; $i++ ) {
                if ( $conditions[$i] ) {
                    $moving_piece_position = $moving_piece_positions[$i];
                    if ( !in_array($situation[$moving_piece_position], $tabu_pieces) ) {
                        if ( $this->eventually_continue_search($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) )
                           $found_something_good = 1; 
                    }
                }
            }

            if ( !$found_something_good )
                $this->nothing_good($situation, $deprecated_positions, $preferred_pieces, $moves_made);
        }
        
        /**
         * Moves reversing the last move never will be executed.
         * Moves improving the situation will be executed.
         * Moves declining the situation will be executed if worsening is allowed.
         */
        protected function eventually_continue_search ($moves_made, $situation, $moving_piece_position, $black_position, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces) {
            if ( empty($moves_made) || $situation[$moving_piece_position] != $moves_made[count($moves_made) - 1] ) {
                $better = $this->would_be_closer($moving_piece_position, $black_position, ($situation[$moving_piece_position] - 1));
                if ( $better || $allowed_faults > 0 ) {

                    $tmp_moves_made = $moves_made;
                    $tmp_moves_made[] = $situation[$moving_piece_position];

                    $tmp_situation = $situation;
                    $tmp_situation[$black_position] = $situation[$moving_piece_position];
                    $tmp_situation[$moving_piece_position] = $situation[$black_position];

                    if ( $better ) {
                        $this->stack_search($tmp_situation, $moving_piece_position, $tmp_moves_made, $allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces);
                        return 1;
                    }
                    else
                        $this->stack_search($tmp_situation, $moving_piece_position, $tmp_moves_made, --$allowed_faults, $preferred_pieces, $deprecated_positions, $tabu_pieces);
                }
            }
            return 0;
        }
        
        
        /**
         * A little variable assignment
         */
        public function __construct ($sent_puzzle) {
            
            $this->piece_line = explode(";", $sent_puzzle);
            $this->black_index = $this->detect_black_index();
            
            $this->cols = sqrt(count($this->piece_line));
            if ( isset($_GET['offset']) && $_GET['offset'] )
                $this->offset = $_GET['offset'];
            else
                $this->offset = 0;
            
            if ( isset($_GET['moves_made']) && $_GET['moves_made'] )
                $this->moves_made = explode(";", $_GET['moves_made']);
        }
    }
?>
