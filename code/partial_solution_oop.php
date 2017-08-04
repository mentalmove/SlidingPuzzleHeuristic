<?php
    header("Content-Type: text/javascript");
    
    error_reporting(E_STRICT | E_ALL);
    
    include_once "../includes/general_puzzle.php";

    /**
     * No need to do anything without a puzzle
     */
    if ( !isset($_GET['puzzle']) || !$_GET['puzzle'] )
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
     * might want to have a look at 'code/partial_solution.php'
     * 
     * SolvePuzzlePartially
     * Optimal solution under given conditions
     */
    class SolvePuzzlePartially extends GeneralPuzzle {
        
        private $callback;                                                      // The javascript function to call on success
        
        
        /**
         * When situation couldn't be improved:
         *      - solution is found or
         *      - home page has to be informed about missing success
         */
        protected function nothing_good ($situation, $deprecated_positions, $preferred_pieces, $moves_made) {
            $solution_is_found = 1;
            for ( $i = 0; $i < count($preferred_pieces); $i++ ) {
                if ( $situation[$preferred_pieces[$i] - 1] != $preferred_pieces[$i] ) {
                    $solution_is_found = 0;
                    break;
                }
            }
            if ( $solution_is_found )
                die( $this->callback . "( [" . implode(", ", $moves_made) . "], [" . implode(", ", $situation) . "], '" . $this->row_or_col . "' );" );
        }
        
        /**
         * Informs home page to try again with higher failure tolerance
         */
        protected function next_step ($new_piece_line, $new_moves_made, $new_preferred_pieces, $new_tabu_pieces) {
        
            $statement = "if ( " . $this->callback . "_allowed ) ";
            $statement .= "load_js('";
            $statement .= "code/partial_solution_oop.php?puzzle=" . implode(";", $new_piece_line);
            $statement .= "&moves_made=" . implode(";", $new_moves_made);
            $statement .= "&preferred_pieces=" . implode(";", $new_preferred_pieces);
            $statement .= "&tabu_pieces=" . implode(";", $new_tabu_pieces);
            $statement .= "&offset=" . ($this->offset + 1);
            $statement .= "&callback=" . $this->callback;
            $statement .= "&row_or_col=" . $this->row_or_col;
            $statement .= "' );";


            die( $statement );
        }
        
        /**
         * A little variable assignment
         * 
         * Tries to find solution,
         * eventually invokes next try
         */
        public function __construct ($sent_puzzle) {
            
            parent::__construct($sent_puzzle);
            
            $this->callback = $_GET['callback'];
            $this->row_or_col = $_GET['row_or_col'];
            
            if ( isset($_GET['preferred_pieces']) && $_GET['preferred_pieces'] )
                $this->preferred_pieces = explode(";", $_GET['preferred_pieces']);
            
            if ( isset($_GET['tabu_pieces']) && $_GET['tabu_pieces'] )
                $this->tabu_pieces = explode(";", $_GET['tabu_pieces']);
            
            $this->stack_search($this->piece_line, $this->black_index, $this->moves_made, $this->offset, $this->preferred_pieces, Array(), $this->tabu_pieces);
    
            $this->next_step($this->piece_line, $this->moves_made, $this->preferred_pieces, $this->tabu_pieces);
        }
    }
    new SolvePuzzlePartially($_GET['puzzle']);
?>
