/**
 * There is no technical need for OOP here
 * (every pseudo-class has exactly one instance).
 * 
 * There also is no need for encapsulation in a function wrapper
 * (nothing in the page could cause interferences).
 * 
 * Anyway, most modern developers are more comfortable
 * with this way of writing code.
 * The few friends of functional programming
 * might want to have a look at 'js/functional.js'
 */
(function (pieces, columns, colours) {
    
    /**
     * Some quasi globals to avoid countless parameters...
     */
    var black_index;
    var missing_piece;
    var human_solving;
    var solution_found;
    
    var the_solution = [];
    
    var utilities;
    var display;

    
    /**
     * Helper functions
     * Quasi static - available from everywhere
     */
    function Utilities () {
        
        function remove_me (element) {
            element.parentNode.removeChild(element);
        }
        
        this.by_id = function (id) {
            return document.getElementById(id);
        };
        
        /**
         * Translation of 'in_array()'
         */
        this.contains_element = function (the_array, the_element) {
            for ( var i = 0; i < the_array.length; i++ ) {
                if ( the_array[i] == the_element )
                    return 1;
            }
            return 0;
        };
        
        /**
         * Loads a javascript file asynchronously,
         * appends it to the head section
         * and deletes it after a moment
         */
        this.load_js_file = function (url) {
            var script_node = document.createElement("script");
            script_node.setAttribute("type","text/javascript");
            script_node.setAttribute("src", url);
            document.getElementsByTagName("head")[0].appendChild(script_node);
            script_node.onload = setTimeout(remove_me, 41, script_node);
        };
        
        /**
         * JSONP (or javasrcipt in general) doesn't allow
         * pointers via http; some properties have to be
         * appended to the global namespace
         */
        this.make_global = function (first_line_fnc, second_line_fnc, final_square_fnc) {
            window.load_js = this.load_js_file;
            window.first_line_allowed = 1;
            window.second_line_allowed = 1;
            window.final_square_allowed = 1;
            window.first_line = first_line_fnc;
            window.second_line = second_line_fnc;
            window.final_square = final_square_fnc;
        };
    }
    
    /**
     * Everything to show the result on the screen
     * Quasi static - available from everywhere
     */
    function Display (piece_line) {
        
        var myself = this;
        
        /**
         * Depending on the situation,
         * some pieces shall not show their background colour
         * (to indicate they are untouchable)
         */
        var grey_list = {};
        grey_list.step = 666;
        grey_list.next_list = [];
        grey_list.next_step = 666;
        grey_list.very_next_list = [];
        grey_list.list = [];
        
        var base_problem;
        var move_piece;
        
        /**
         * Interactivity's 'move_piece()' shall - although private - be reachable from here
         */
        this.define_internal_move_piece = function (fnc) {
            move_piece = fnc;
        };
        
        this.manipulate_grey = function (step, next_list) {
            grey_list.step = step;
            grey_list.next_list = next_list;
        };
        this.manipulate_grey_again = function (len, very_next_list) {
            grey_list.next_step = grey_list.step + len;
            grey_list.very_next_list = very_next_list;
        };
        
        this.set_all_grey = function () {
            this.unset_grey();
            for ( var i = 0; i < piece_line.length; i++ )
                if ( piece_line[i] && !utilities.contains_element(grey_list.list, piece_line[i]) )
                    grey_list.list.push(piece_line[i]);
        };
        this.unset_grey = function () {
            grey_list.list = [];
        };
        
        this.show_whole_puzzle = function () {
            for ( var i = 0; i < piece_line.length; i++ ) {
                utilities.by_id("cell" + (i + 1)).innerHTML = (piece_line[i]) ? piece_line[i] : "";     // no number for hole...
                if ( !piece_line[i] || !utilities.contains_element(grey_list.list, (i + 1)) )
                    utilities.by_id("cell" + (i + 1)).style.backgroundColor = colours[piece_line[i]];
                else
                    utilities.by_id("cell" + (i + 1)).style.backgroundColor = "#BBBBBB";
            }
        };
        
        this.move_base_problem_to_left = function () {
            base_problem.style.cssFloat = "left";
        };
        
        this.set_instruction = function (formatted_message) {
            utilities.by_id("instruction").innerHTML = formatted_message;
        };
        this.get_instructions = function () {
            return utilities.by_id("instruction").innerHTML;
        };
        /**
         * Treats displayed moves as values
         */
        this.get_instruction_values = function () {
            return utilities.by_id("instruction").innerHTML.split(",");
        };
        
        /**
         * Runs, once started, in a loop
         * until all necessary steps are done...
         */
        this.show_solution = function (step, timeout) {
            if ( solution_found ) {
                /**
                 * Guess about optimum is based on experience
                 */
                if ( step > 80 )
                    bash.log( "Solution is definitely suboptimal; could be better by min. " + (step - 80) + ", probably " + parseInt(Math.sqrt(step - 52) + (step - 80)) + " steps" );
                else {
                    if ( step <= 53 )
                        bash.log( "Solution seems to be fine" );
                    else
                        bash.log( "Solution maybe is suboptimal; could be better by roundabout " + parseInt(Math.sqrt(step - 52) * Math.sqrt(3)) + " steps" );
                }
                return;
            }
            /**
             * ...unless engine is to slow
             */
            if ( step >= the_solution.length ) {
                bash.log( "waiting after step " + step + "..." );
                return;
            }
            
            if ( step == grey_list.next_step ) {
                grey_list.list = grey_list.very_next_list;
                timeout = parseInt(7 * timeout / 8);
            }
            else {
                if ( step == grey_list.step ) {
                    grey_list.list = grey_list.next_list;
                    timeout = parseInt(7 * timeout / 8);
                }
            }
            
            var next_number = the_solution[step];
            
            for ( var i = 0; i < piece_line.length; i++ )
                if ( piece_line[i] == next_number ) {
                    move_piece(i, 0);
                    break;
                }
            
            /**
             * A dead man's switch is more secure than 'setInterval()'
             */
            setTimeout(myself.show_solution, timeout, ++step, (timeout - 1));
        };
        
        /**
         * Console-like display with different colours
         */
        function create_small_puzzle_content (situation, tabu_pieces) {
            var s = "<pre style='line-height: 1.4em'>";
            for ( var i = 0; i < pieces; i++ ) {
                for ( var i = 0; i < pieces; i++ ) {
                    s += "  ";
                    if ( situation[i] < 10 )
                        s += " ";
                    if ( situation[i] && utilities.contains_element(tabu_pieces, situation[i]) ) {
                        s += "<span style='color: #FF8000'>";
                        s += situation[i];
                        s += "</span>";
                    }
                    else
                        s += situation[i];
                    if ( i % columns == (columns - 1) )
                        s += "\n";
                }
            }
            s += "</pre>";
            return s;
        }
        
        /**
         * Shows the starting point...
         */
        this.show_basic_small_puzzle = function () {
            var s = create_small_puzzle_content(piece_line, []);
            base_problem = document.createElement("div");
            base_problem.innerHTML = s;
            document.getElementsByTagName("center")[0].appendChild(base_problem);
        };
        /**
         * ...or the actual intermediate step
         */
        this.show_small_situation = function (situation, tabu_pieces) {
            var placeholder = document.createElement("div");
            placeholder.innerHTML = "<pre>        </pre>";
            placeholder.style.cssFloat = "left";
            document.getElementsByTagName("center")[0].appendChild(placeholder);
            var s = create_small_puzzle_content(situation, tabu_pieces);
            var e = document.createElement("div");
            e.style.cssFloat = "left";
            e.innerHTML = s;
            document.getElementsByTagName("center")[0].appendChild(e);
        };
        
        this.enable_search = function (enable) {
            utilities.by_id("instruction").innerHTML = (enable) ? "<br><a href='javascript: init_search()'>Relatively short solution...</a><br>" : "<br><br>";
        };
    }
    
    /**
     * Everything related to specific sliding puzzle problems
     */
    function Rules (piece_line) {
        
        var myself = this;
        
        var preferred_row, preferred_col;
        var start_time;
        
        
        /**
         * Random order - repeated when unsolvable
         */
        this.shuffle = function () {
            
            var i, random_index, tmp;
            
            for ( i = 0; i < pieces; i++ ) {
                random_index = Math.floor(Math.random() * pieces);
                if ( i == random_index )
                    continue;
                tmp = piece_line[i];
                piece_line[i] = piece_line[random_index];
                piece_line[random_index] = tmp;
            }
            for ( i = 0; i < pieces; i++ ) {
                if ( !piece_line[i] ) {
                    black_index = i;
                    break;
                }
            }
            if ( !is_puzzle_solvable(is_even) )
                setTimeout(myself.shuffle, 333);
            else {
                human_solving = 1;
                display.enable_search(true);
            }
            
            display.show_whole_puzzle();
        };
        
        this.swap_pieces = function (index) {
            var tmp = piece_line[index];
            piece_line[index] = piece_line[black_index];
            piece_line[black_index] = tmp;
            black_index = index;
        };
        
        /**
         * Ascending numbers are a good indication for success
         */
        this.is_solved = function () {
            for ( var i = 0; i < piece_line.length; i++ )
                if ( piece_line[i] && piece_line[i] != (i + 1) )
                    return 0;
            return 1;
        };
        
        this.show_black = function () {
            piece_line[black_index] = missing_piece;
        };
        
        /**
         * No human disturbance during search, please
         * 
         * Rows and columns across from the missing piece
         * shall be handled first
         */
        this.init_search = function () {
            if ( solution_found )
                return;
            display.enable_search(false);
            human_solving = 0;
            
            display.show_basic_small_puzzle();
            
            detect_section();
            invoke_preparation();
        };
        
        /**
         * First feedback!
         * Prepares for the remaining 12 pieces
         * 
         * Latecomers will be rejected
         */
        function first_line (moves_to_make, real_piece_line, row_or_col) {
            if ( !window.first_line_allowed )
                return;
            window.first_line_allowed = 0;
            
            var i;
            for ( i = 0; i < moves_to_make.length; i++ )
                the_solution.push(moves_to_make[i]);
            
            setTimeout(display.show_solution, 666, 0, 888, the_solution);
            
            var comment = "";
            var the_row = [];
            var the_col = [];
            for ( i = 0; i < columns; i++ ) {
                the_row[i] = i + 1 + ((preferred_row - 1) * columns);
                the_col[i] = (i * columns) + 1 + (preferred_col - 1);
            }
            
            /**
             * Next search: already sorted pieces are untouchable
             */
            var url = "code/partial_solution_oop.php?puzzle=" + real_piece_line.join(";");
            var the_tabus = [];
            if ( row_or_col == "row" ) {
                url += "&preferred_pieces=" + the_col.join(";");
                url += "&tabu_pieces=" + the_row.join(";");
                url += "&row_or_col=col";
                the_tabus = the_row;
            }
            else {
                url += "&preferred_pieces=" + the_row.join(";");
                url += "&tabu_pieces=" + the_col.join(";");
                url += "&row_or_col=row";
                the_tabus = the_col;
            }
            url += "&callback=second_line";
            
            utilities.load_js_file( url );
            
            var next_list = (row_or_col == "row") ? the_row : the_col;
            display.manipulate_grey(moves_to_make.length, next_list);
            
            if ( row_or_col == "row" )
                comment = (preferred_row == 1) ? "upper" : "lower";
            else
                comment = (preferred_col == 1) ? "left" : "right";

            bash.log( "Partial solution for " + comment + " " + row_or_col + " found, " + moves_to_make.length + " steps needed" );
            
            display.move_base_problem_to_left();
            display.set_instruction("<small style='color: gray'>" + moves_to_make + "</small><br>");
            
            display.show_small_situation(real_piece_line, the_tabus);
        }
        /**
         * Since the task is split up, it could appear
         * that the last move will be reversed.
         * Then it can be removed from the solution
         */
        function avoid_duplicates (moves_to_make) {
            var i;
            var solution_to_show = [];
            var moves_to_make_length = moves_to_make.length
            if ( moves_to_make[0] != the_solution[the_solution.length - 1] ) {
                for ( i = 0; i < moves_to_make.length; i++ ) {
                    the_solution.push(moves_to_make[i]);
                    solution_to_show.push(moves_to_make[i]);
                }
            }
            else {                            
                var old_solution_array = display.get_instruction_values();
                var new_solution_string = old_solution_array[0];
                for ( i = 1; i < (old_solution_array.length - 1); i++ )
                    new_solution_string += "," + old_solution_array[i];
                display.set_instruction(new_solution_string + "<br>");
                the_solution[the_solution.length - 1] = moves_to_make[1];
                solution_to_show.push(moves_to_make[1]);
                for ( i = 2; i < moves_to_make.length; i++ ) {
                    the_solution.push(moves_to_make[i]);
                    solution_to_show.push(moves_to_make[i]);
                }
                moves_to_make_length -= 2;
            }
            return [moves_to_make_length, solution_to_show];
        }
        /**
         * Second feedback!
         * Prepares for the remaining 9 pieces
         * 
         * Latecomers will be rejected
         */
        function second_line (moves_to_make, real_piece_line, row_or_col) {
            if ( !window.second_line_allowed )
                return;
            window.second_line_allowed = 0;
            
            var tmp = avoid_duplicates(moves_to_make);
            var moves_to_make_length = tmp[0];
            var solution_to_show = tmp[1];
            
            var raw_already_found = [];
            for ( var i = 0; i < columns; i++ ) {
                raw_already_found.push(i + 1 + ((preferred_row - 1) * columns));
                raw_already_found.push((i * columns) + 1 + (preferred_col - 1));
            }
            
            /**
             * Next search: already sorted pieces are untouchable
             * It will return a definitely optimal solution
             */
            var preferred_pieces = [];
            var tabu_pieces = [];
            for ( i = 0; i < pieces; i++ ) {
                if ( !real_piece_line[i] )
                    continue;
                if ( utilities.contains_element(raw_already_found, real_piece_line[i]) )
                    tabu_pieces.push(real_piece_line[i]);
                else
                    preferred_pieces.push(real_piece_line[i]);

            }
            
            var url = "code/partial_solution_oop.php?puzzle=" + real_piece_line.join(";");
            url += "&preferred_pieces=" + preferred_pieces.join(";");
            url += "&tabu_pieces=" + tabu_pieces.join(";");
            url += "&row_or_col=who_cares";
            url += "&callback=final_square";
            utilities.load_js_file( url );
            
            display.manipulate_grey_again(moves_to_make.length, tabu_pieces);
            
            var comment = "";
            if ( row_or_col == "row" )
                comment = (preferred_row == 1) ? "upper" : "lower";
            else
                comment = (preferred_col == 1) ? "left" : "right";

            bash.log( "Partial solution for " + comment + " " + row_or_col + " found, " + moves_to_make_length + " steps needed" );

            display.set_instruction(display.get_instructions() + "<small style='color: gray'>" + solution_to_show + "</small><br>");

            display.show_small_situation(real_piece_line, tabu_pieces);
        }
        /**
         * Solved!
         * Latecomers will be rejected (given solution must be optimal)
         * 
         * Shows solution and some additional information
         */
        function final_square (moves_to_make, real_piece_line, row_or_col) {
            if ( !window.final_square_allowed )
                return;
            window.final_square_allowed = 0;
            
            var tmp = avoid_duplicates(moves_to_make);
            var moves_to_make_length = tmp[0];
            var solution_to_show = tmp[1];
            
            bash.log( "Partial solution for missing pieces found, " + moves_to_make_length + " steps needed" );
            
            var duration = get_duration();
            
            bash.warn( "&nbsp;&nbsp;&nbsp;&nbsp; time needed: " + duration + " seconds" );
            bash.log( "Puzzle solved with " + the_solution.length + " steps at all" );
    
            display.set_instruction(display.get_instructions() + "<small style='color: gray'>" + solution_to_show + "</small><br>");
            
            display.show_small_situation(real_piece_line, real_piece_line);
        }
        /**
         * Formatted time
         */
        function get_duration () {
            var tmp_now = new Date();
            var tmp_duration = (tmp_now.getTime() - start_time) / 1000;
            var add = 1;
            if ( tmp_duration > 60 ) {
                add = 10;
                var s = parseInt(tmp_duration);
                var m = parseInt(s / 60);
                var sec = s % 60;
                var min_name = (m > 1) ? " minutes " : " minute ";
                tmp_duration = "" + m + min_name + sec;
            }
            return tmp_duration;
        }
        
        /**
         * Row and column across from the missing piece
         * run to the bet
         */
        function invoke_preparation () {
            var url = "code/prepare_oop.php?puzzle=" + piece_line.join(";");
            start_time = new Date().getTime();
            utilities.make_global(first_line, second_line, final_square);
            utilities.load_js_file( url + "&preferred_row=" + preferred_row );
            utilities.load_js_file( url + "&preferred_col=" + preferred_col );
        }
        
        /**
         * What does 'across from the missing piece' mean?
         */
        function detect_section () {
            var which_section;
            if ( missing_piece < (pieces / 2) ) {
                which_section = ( ((missing_piece - 1) % columns) < (columns / 2) ) ? 1 : 2;
                preferred_row = columns;
            }
            else {
                which_section = ( ((missing_piece - 1) % columns) < (columns / 2) ) ? 3 : 4;
                preferred_row = 1;
            }
            preferred_col = (which_section % 2 == 0) ? 1 : columns;
        }
        
        /**
         * Detects parity: Half of the possible situations are unsolvable...
         */
        function is_puzzle_even () {
            var n2 = (columns %2 == 0) ? parseInt(black_index / columns + 1) : 0;
            return (n2 % 2 == 0) ? 1 : 0;
        }
        /**
         * ...and decides if basic and given situation have the same parity
         */
        function is_puzzle_solvable (is_even) {
            var i, j;
            var n2 = (columns %2 == 0) ? parseInt(black_index / columns + 1) : 0;
            var n1 = 0;
            for ( i = 0; i < pieces; i++ ) {
                for ( j = 0; j < i; j++ ) {
                    if ( piece_line[i] < piece_line[j] && piece_line[i] && piece_line[j] )
                        n1++;
                }
            }
            var tmp_is_even = ((n1 + n2) % 2 == 0);
            return (is_even == tmp_is_even);
        }
        
        /**
         * Numbers from 1 to 16
         * '0' indicates hole (treated as 'black piece')
         */
        function initialise_pieces () {
            for ( var i = 0; i < pieces; i++ )
                if ( i != black_index )
                    piece_line.push(i + 1);
                else
                    piece_line.push(0);
        }
        
        initialise_pieces();
        var is_even = is_puzzle_even();
    }
    
    /**
     * What the user can do: Playing or invoking the machine to play
     */
    function Interactivity (rules) {
        
        function move_piece (index, human) {
            
            if ( human_solving != human )
                return;
            
            /**
             * Looks horrible - meaning is: Is piece adjacent to hole?
             */
            if ( Math.abs(index - black_index) != 1 && Math.abs(index - black_index) != columns )
                return;
            if ( Math.abs(index - black_index) == 1 && Math.abs((index % columns) - (black_index % columns)) != 1 )
                return;
            
            rules.swap_pieces(index);
            
            /**
             * No more user interaction after solve
             */
            if ( rules.is_solved() ) {
                human_solving = 0;
                solution_found = 1;
                rules.show_black();
                display.set_all_grey();
                setTimeout(display.unset_grey, 41);
                setTimeout(display.show_whole_puzzle, 1234);
            }
            
            display.show_whole_puzzle();
        }
        
        /**
         * Enables animation
         */
        display.define_internal_move_piece(move_piece);
        
        /**
         * Appends user related functions to the global scope
         */
        window.move_piece = function (index, redundant) {
            move_piece(index, 1);
        };
        window.init_search = rules.init_search;
    }
    
    /**
     * Something like the main function
     * 
     * Determines hole resp. black piece,
     * shuffles pieces and provides necessary objects
     */
    function Init () {
        
        utilities = new Utilities();
        
        black_index = Math.floor(Math.random() * pieces);
        missing_piece = black_index + 1;
        var piece_line = [];
        human_solving = 0;
        solution_found = 0;
        
        var rules = new Rules(piece_line);
        
        display = new Display(piece_line);        
        display.show_whole_puzzle();
        
        rules.shuffle();
        
        new Interactivity(rules);
    }
    
    new Init();
})(PIECES, COLS, colours);
