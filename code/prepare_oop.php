<?php
    header("Content-Type: text/javascript");
    
    error_reporting(E_STRICT | E_ALL);
    
    include_once "../includes/general_puzzle.php";

    /**
     * No need to do anything without a puzzle
     */
    if ( !isset($_GET['puzzle']) || !$_GET['puzzle'] || ( !isset($_GET['preferred_row']) && !isset($_GET['preferred_col']) ) )
        die( "bash.log( 'No vaild puzzle data' );" );

    
    /**
     * There is no technical need for OOP here
     * (the class has exactly one instance each time the file is loaded).
     * 
     * There is also no technical need for inheritance
     * (simple copy and paste would not increase the loaded data).
     * 
     * Anyway, most modern developers consider
     * this way of writing code more readable.
     * The few friends of functional programming
     * might want to have a look at 'code/prepare.php'
     */
    class PreparePuzzle extends GeneralPuzzle {
        
        private $preferred_positions = Array();                                 // The indices we are interested in. Not to be messed up with $preferred_pieces
        private $deprecated_positions = Array();                                // The indices we ignore. Not to be messed up with $tabu_pieces
        
        
        /**
         * Detect row across from the preferred one 
         */
        private function has_preferred_row ($preferred_row, $change_add) {
            $this->row_or_col = "row";
            $deprecated_add = $this->cols * $this->cols - $this->cols;
            $deprecated_add *= ($preferred_row == 1) ? 1 : -1;
            $start_position = ($preferred_row - 1) * $this->cols;
            for ( $i = $start_position; $i < ($start_position + $this->cols); $i++ ) {
                $this->preferred_positions[] = $i;
                $this->deprecated_positions[] = $i + $deprecated_add;
            }
            if ( in_array($this->black_index, $this->preferred_positions) )
                return ($preferred_row == 1) ? 4 : -4;
            return $change_add;
        }
        /**
         * Detect column across from the preferred one 
         */
        private function has_preferred_col ($preferred_col, $change_add) {
            $this->row_or_col = "col";
            $deprecated_add = $this->cols - 1;
            $deprecated_add *= ($preferred_col == 1) ? 1 : -1;
            $start_position = ($preferred_col - 1);
            for ( $i = $start_position; $i < count($this->piece_line); $i += $this->cols ) {
                $this->preferred_positions[] = $i;
                $this->deprecated_positions[] = $i + $deprecated_add;
            }
            if ( in_array($this->black_index, $this->preferred_positions) )
                return ($preferred_col == 1) ? 1 : -1;
            return $change_add;
        }
        /**
         * Free the row resp. column across from the preferred one
         * from the pieces we want to move.
         * After that, the bboard's size will de facto be reduced to 12.
         */
        private function respect_change ($change_add) {
            for ( $i = 0; $i < $this->cols; $i++ ) {
                if ( !$this->piece_line[$this->preferred_positions[$i]] ) {
                    $moved_piece = $this->piece_line[$this->preferred_positions[$i] + $change_add];
                    $this->piece_line[$this->preferred_positions[$i] + $change_add] = 0;
                    $this->piece_line[$this->preferred_positions[$i]] = $moved_piece;
                    $this->moves_made[] = $moved_piece;
                    break;
                }
            }
        }
        
        /**
         * Informs home page to try again, remembering already made moves
         */
        private function restart ($new_offset = 0) {
            $statement = "load_js('";
            $statement .= "code/prepare_oop.php?puzzle=" . implode(";", $this->piece_line);
            $statement .= "&preferred_" . $this->row_or_col . "=" . $_GET["preferred_" . $this->row_or_col];
            $statement .= "&moves_made=" . implode(";", $this->moves_made);
            if ( $new_offset )
                $statement .= "&offset=" . $new_offset;
            $statement .= "' );";
            die( $statement );
        }
        
        /**
         * When situation couldn't be improved:
         *      - solution is found or
         *      - home page has to be informed about missing success
         */
        protected function nothing_good ($situation, $deprecated_positions, $preferred_pieces, $moves_made) {
            $solution_is_found = 1;
            for ( $i = 0; $i < $this->cols; $i++ ) {
                if ( !$situation[$deprecated_positions[$i]] || in_array($situation[$deprecated_positions[$i]], $preferred_pieces) ) {
                    $solution_is_found = 0;
                    break;
                }
            }
            if ( $solution_is_found )
                $this->next_step($situation, $moves_made, $preferred_pieces, $deprecated_positions);
        }
        
        /**
         * Informs home page that preparation is done
         */
        protected function next_step ($new_piece_line, $new_moves_made, $new_preferred_pieces, $new_deprecated_positions) {
        
            $tabu_pieces = Array();
            for ( $i = 0; $i < $this->cols; $i++ )
                $tabu_pieces[] = $new_piece_line[$new_deprecated_positions[$i]];

            $statement = "load_js('";
            $statement .= "code/partial_solution_oop.php?puzzle=" . implode(";", $new_piece_line);
            $statement .= "&moves_made=" . implode(";", $new_moves_made);
            $statement .= "&preferred_pieces=" . implode(";", $new_preferred_pieces);
            $statement .= "&tabu_pieces=" . implode(";", $tabu_pieces);
            $statement .= "&callback=first_line";
            $statement .= "&row_or_col=" . $this->row_or_col;
            $statement .= "' );";

            die( $statement );
        }
        
        
        /**
         * A little variable assignment
         * 
         * Tells preferred and untouchable pieces apart
         * 
         * Tries to solve given task,
         * invokes next try
         */
        public function __construct ($sent_puzzle) {
            
            parent::__construct($sent_puzzle);
            
            $change_add = 0;
            if ( isset($_GET['preferred_row']) )
                $change_add = $this->has_preferred_row($_GET['preferred_row'], 0);
            if ( isset($_GET['preferred_col']) )
                $change_add = $this->has_preferred_col($_GET['preferred_col'], $change_add);
            if ( $change_add ) {
                $this->respect_change($change_add);
                $this->restart();
            }
            
            for ( $i = 0; $i < $this->cols; $i++ )
                $this->tabu_pieces[] = $this->piece_line[$this->preferred_positions[$i]];
            for ( $i = 0; $i < $this->cols; $i++ )
                $this->preferred_pieces[] = $this->preferred_positions[$i] + 1;
            
            $this->stack_search($this->piece_line, $this->black_index, $this->moves_made, $this->offset, $this->preferred_pieces, $this->deprecated_positions, $this->tabu_pieces);
            
            $this->restart($this->offset + 1);
        }
    }
    new PreparePuzzle($_GET['puzzle']);
?>
