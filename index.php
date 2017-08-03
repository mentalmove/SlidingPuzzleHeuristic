<?php
    include_once "includes/utilities.php";
?><!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>IDA* based partial puzzle solutions</title>
        
        <style type="text/css">
            html, body {
                margin: 0px;
                background-color: #F8F8F8;
                font-family: Arial, Verdana;
                min-height: 100%;
                font-size: 14px;
                text-align: center;
                overflow: visible;
            }
            
            .main_frame {
                position: relative;
                margin-left: auto;
                margin-right: auto;
                min-width: 768px;
                max-width: 816px;
                height: auto;
            }
            
            #instruction {
                font-size: 20px;
            }
            
            td {
		width: <?=$cell_size?>px;
                height: <?=$cell_size?>px;
		text-align: center;
                cursor: pointer;
                font-size: <?=$font_size?>px;
                color: #6C6C6C;
                border: ridge;
	    }
            
            a:link {
                color: #707868;
                text-decoration: none;
            }
            a:visited {
                color: #707868;
                text-decoration: none;
            }
        </style>
        
        <script type="text/javascript">
            <?php
                echo create_js_basic_values($colours);
            ?>
        </script>
        
    </head>
    <body>
        
        <div class="main_frame">
        
            <span id="instruction"><br><br></span>

            <br><br>

            <center>
                <?php
                    echo create_table();
                ?>
            </center>

            <script type="text/javascript" src="js/debug.js"></script>
            <!--
                It should be either 'js/functional.js' either 'js/oop.js' embedded - not both
            -->
            <!--<script type="text/javascript" src="js/functional.js"></script>-->
            <script type="text/javascript" src="js/oop.js"></script>
        
        </div>
    
    </body>
</html>
