/**
 * Straightforward solution - just scripting until the task is done :-)
 */

function iD (x) {
    return document.getElementById(x);
}

function lS (s) {
    var sn = document.createElement('script');
    sn.setAttribute('type','text/javascript');
    sn.setAttribute('src',s);
    document.getElementsByTagName('head')[0].appendChild(sn);
}

/*  */

var i;
var human_solving = 0;
var solution_found = 0;
var black_index = Math.floor(Math.random() * PIECES);
var missing_piece = black_index + 1;
var piece_line = [];

var allowd_offset = 0;

var TAKE_DIFFICULT = 0;
var AUTO_SOLVE = 0;

var preferred_row, preferred_col, start_time;

var first_line_allowed = 1;
var second_line_allowed = 1;
var final_square_allowed = 1;

var the_solution = [];

var grey_list = {};
grey_list.step = 666;
grey_list.next_list = [];
grey_list.next_step = 666;
grey_list.very_next_list = [];
grey_list.list = [];

/*  */

function contains_element (the_array, the_element) {
    for ( var i = 0; i < the_array.length; i++ ) {
        if ( the_array[i] == the_element )
            return 1;
    }
    return 0;
}

function show_solution (step, timeout) {                        
    if ( solution_found ) {
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

    setTimeout(show_solution, timeout, ++step, (timeout - 1));
}

function final_square (moves_to_make, real_piece_line, row_or_col) {

    if ( !final_square_allowed )
        return;

    final_square_allowed = 0;

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
        var old_solution_array = iD("instruction").innerHTML.split(",");
        var new_solution_string = old_solution_array[0];
        for ( i = 1; i < (old_solution_array.length - 1); i++ )
            new_solution_string += "," + old_solution_array[i];
        iD("instruction").innerHTML = new_solution_string + "<br>";

        the_solution[the_solution.length - 1] = moves_to_make[1];
        solution_to_show.push(moves_to_make[1]);
        for ( i = 2; i < moves_to_make.length; i++ ) {
            the_solution.push(moves_to_make[i]);
            solution_to_show.push(moves_to_make[i]);
        }
        moves_to_make_length -= 2;
    }


    bash.log( "Partial solution for missing pieces found, " + moves_to_make_length + " steps needed" );


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


    bash.warn( "&nbsp;&nbsp;&nbsp;&nbsp; time needed: " + tmp_duration + " seconds" );
    bash.log( "Puzzle solved with " + the_solution.length + " steps at all" );

    iD("instruction").innerHTML += "<small style='color: gray'>" + solution_to_show + "</small>";

    show_small_situation(real_piece_line, real_piece_line);
}

function second_line (moves_to_make, real_piece_line, row_or_col) {

    if ( !second_line_allowed )
        return;

    second_line_allowed = 0;

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
        var old_solution_array = iD("instruction").innerHTML.split(",");
        var new_solution_string = old_solution_array[0];
        for ( i = 1; i < (old_solution_array.length - 1); i++ )
            new_solution_string += "," + old_solution_array[i];
        iD("instruction").innerHTML = new_solution_string + "<br>";

        the_solution[the_solution.length - 1] = moves_to_make[1];
        solution_to_show.push(moves_to_make[1]);
        for ( i = 2; i < moves_to_make.length; i++ ) {
            the_solution.push(moves_to_make[i]);
            solution_to_show.push(moves_to_make[i]);
        }
        moves_to_make_length -= 2;
    }


    var raw_already_found = [];
    for ( i = 0; i < COLS; i++ ) {
        raw_already_found.push(i + 1 + ((preferred_row - 1) * COLS));
        raw_already_found.push((i * COLS) + 1 + (preferred_col - 1));
    }

    var preferred_pieces = [];
    var tabu_pieces = [];
    for ( i = 0; i < PIECES; i++ ) {
        if ( !real_piece_line[i] )
            continue;
        if ( contains_element(raw_already_found, real_piece_line[i]) )
            tabu_pieces.push(real_piece_line[i]);
        else
            preferred_pieces.push(real_piece_line[i]);

    }

    var url = "code/partial_solution.php?puzzle=" + real_piece_line.join(";");
    url += "&preferred_pieces=" + preferred_pieces.join(";");
    url += "&tabu_pieces=" + tabu_pieces.join(";");
    url += "&row_or_col=who_cares";
    url += "&callback=final_square";

    lS( url );


    grey_list.next_step = grey_list.step + moves_to_make.length;
    grey_list.very_next_list = tabu_pieces;


    var comment = "";
    if ( row_or_col == "row" )
        comment = (preferred_row == 1) ? "upper" : "lower";
    else
        comment = (preferred_col == 1) ? "left" : "right";

    bash.log( "Partial solution for " + comment + " " + row_or_col + " found, " + moves_to_make_length + " steps needed" );

    iD("instruction").innerHTML += "<small style='color: gray'>" + solution_to_show + "</small><br>";

    show_small_situation(real_piece_line, tabu_pieces);
}

function first_line (moves_to_make, real_piece_line, row_or_col) {

    if ( !first_line_allowed )
        return;

    first_line_allowed = 0;

    var i;
    for ( i = 0; i < moves_to_make.length; i++ )
        the_solution.push(moves_to_make[i]);

    setTimeout(show_solution, 666, 0, 888);


    var comment = "";

    var the_row = [];
    var the_col = [];
    for ( i = 0; i < COLS; i++ ) {
        the_row[i] = i + 1 + ((preferred_row - 1) * COLS);
        the_col[i] = (i * COLS) + 1 + (preferred_col - 1);
    }

    var url = "code/partial_solution.php?puzzle=" + real_piece_line.join(";");
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

    lS( url );


    grey_list.step = moves_to_make.length;
    grey_list.next_list = (row_or_col == "row") ? the_row : the_col;


    if ( row_or_col == "row" )
        comment = (preferred_row == 1) ? "upper" : "lower";
    else
        comment = (preferred_col == 1) ? "left" : "right";

    bash.log( "Partial solution for " + comment + " " + row_or_col + " found, " + moves_to_make.length + " steps needed" );

    iD("base_problem").style.cssFloat = "left";
    iD("instruction").innerHTML = "<small style='color: gray'>" + moves_to_make + "</small><br>";

    show_small_situation(real_piece_line, the_tabus);
}

function invoke_preparation () {
    var i;

    var base_url = "code/prepare.php?";

    var the_puzzle = piece_line.join(";");
    var url = base_url + "puzzle=" + the_puzzle;

    var now = new Date();
    start_time = now.getTime();

    lS( url + "&preferred_row=" + preferred_row );
    lS( url + "&preferred_col=" + preferred_col );
}

function detect_section () {
    var which_section;

    if ( missing_piece < (PIECES / 2) ) {
        which_section = ( ((missing_piece - 1) % COLS) < (COLS / 2) ) ? 1 : 2;
        preferred_row = COLS;
    }
    else {
        which_section = ( ((missing_piece - 1) % COLS) < (COLS / 2) ) ? 3 : 4;
        preferred_row = 1;
    }

    preferred_col = (which_section % 2 == 0) ? 1 : COLS;
}

function move_piece (index, human) {
    if ( human_solving != human )
        return;

    if ( Math.abs(index - black_index) != 1 && Math.abs(index - black_index) != COLS )
        return;

    if ( Math.abs(index - black_index) == 1 && Math.abs((index % COLS) - (black_index % COLS)) != 1 )
        return;

    var tmp = piece_line[index];
    piece_line[index] = piece_line[black_index];
    piece_line[black_index] = tmp;
    black_index = index;

    var solved = 1;
    var i;
    for ( i = 0; i < piece_line.length; i++ )
        if ( piece_line[i] && piece_line[i] != (i + 1) ) {
            solved = 0;
            break;
        }
    if ( solved ) {
        var tmp_grey = [];
        for ( i = 0; i < piece_line.length; i++ )
            if ( piece_line[i] && !contains_element(grey_list.list, piece_line[i]) )
                tmp_grey.push(piece_line[i]);
        grey_list.list = tmp_grey;
        piece_line[black_index] = missing_piece;
        human_solving = 0;
        solution_found = 1;
        setTimeout(show_whole_puzzle, 1234);
    }

    show_whole_puzzle();

    if ( solved )
        grey_list.list = [];
}

function show_small_situation (situation, tabu_pieces) {
    var t = document.getElementsByTagName("table")[document.getElementsByTagName("table").length - 1].parentNode;

    var placeholder = document.createElement("div");
    placeholder.innerHTML = "<pre>        </pre>";
    placeholder.style.cssFloat = "left";
    t.appendChild(placeholder);

    var s = "<pre style='line-height: 1.4em'>";
    for ( i = 0; i < PIECES; i++ ) {
        for ( var i = 0; i < PIECES; i++ ) {
            s += "  ";
            if ( situation[i] < 10 )
                s += " ";
            if ( situation[i] && contains_element(tabu_pieces, situation[i]) ) {
                s += "<span style='color: #FF8000'>";
                s += situation[i];
                s += "</span>";
            }
            else
                s += situation[i];
            if ( i % COLS == (COLS - 1) )
                s += "\n";
        }
    }
    s += "</pre>";

    var e = document.createElement("div");
    e.style.cssFloat = "left";
    e.innerHTML = s;
    var t = document.getElementsByTagName("table")[document.getElementsByTagName("table").length - 1].parentNode;
    t.appendChild(e);
}

function init_search () {
    if ( solution_found )
        return;

    iD("instruction").innerHTML = "<br><br>";
    human_solving = 0;


    var s = "<pre style='line-height: 1.4em'>";
    for ( i = 0; i < PIECES; i++ ) {
        for ( var i = 0; i < PIECES; i++ ) {
            s += "  ";
            if ( piece_line[i] < 10 )
                s += " ";
            s += piece_line[i];
            if ( i % COLS == (COLS - 1) )
                s += "\n";
        }
    }
    s += "</pre>";

    var e = document.createElement("div");
    e.id = "base_problem";
    e.innerHTML = s;
    var t = document.getElementsByTagName("table")[document.getElementsByTagName("table").length - 1].parentNode;
    t.appendChild(e);


    detect_section();

    invoke_preparation();
}

function is_puzzle_solvable (is_even) {
    var i, j;
    var n2 = (COLS %2 == 0) ? parseInt(black_index / COLS + 1) : 0;

    var n1 = 0;
    for ( i = 0; i < PIECES; i++ ) {
        for ( j = 0; j < i; j++ ) {
            if ( piece_line[i] < piece_line[j] && piece_line[i] && piece_line[j] )
                n1++;
        }
    }

    var tmp_is_even = ((n1 + n2) % 2 == 0);

    return (is_even == tmp_is_even);
}

function is_puzzle_even () {
    var n2 = (COLS %2 == 0) ? parseInt(black_index / COLS + 1) : 0;

    return (n2 % 2 == 0) ? 1 : 0;
}

function shuffle_a_lot (is_even) {
    var i, random_index, tmp;

    for ( i = 0; i < PIECES; i++ ) {
        random_index = Math.floor(Math.random() * PIECES);
        if ( i == random_index )
            continue;
        tmp = piece_line[i];
        piece_line[i] = piece_line[random_index];
        piece_line[random_index] = tmp;
    }
    if ( TAKE_DIFFICULT )
        //piece_line = [ 0, 12, 9, 13, 15, 11, 10, 14, 3, 7, 2, 5, 4, 8, 6, 1 ];
        piece_line = [ 16, 3, 4, 2, 6, 8, 14, 9, 12, 7, 13, 1, 11, 15, 0, 5 ];
    for ( i = 0; i < PIECES; i++ ) {
        if ( !piece_line[i] ) {
            black_index = i;
            break;
        }
    }

    if ( !is_puzzle_solvable(is_even) )
        setTimeout(shuffle_a_lot, 333, is_even);
    else {
        iD("instruction").innerHTML = "<br><a href='javascript: init_search()'>Relatively short solution...</a><br>";
        human_solving = 1;
        if ( AUTO_SOLVE )
            init_search();
    }

    show_whole_puzzle();
}

function show_whole_puzzle () {
    for ( var i = 0; i < piece_line.length; i++ ) {
        iD("cell" + (i + 1)).innerHTML = (piece_line[i]) ? piece_line[i] : "";
        if ( !piece_line[i] || !contains_element(grey_list.list, (i + 1)) )
            iD("cell" + (i + 1)).style.backgroundColor = colours[piece_line[i]];
        else
            iD("cell" + (i + 1)).style.backgroundColor = "#BBBBBB";
    }
}

/*  */

for ( i = 0; i < PIECES; i++ )
    if ( i != black_index )
        piece_line.push(i + 1);
    else
        piece_line.push(0);

show_whole_puzzle();

var is_even = is_puzzle_even();

setTimeout(shuffle_a_lot, 333, is_even);
