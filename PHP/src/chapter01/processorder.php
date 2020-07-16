<?php 
    // create short variable names
    $tireqty = $_POST['tireqty'];
    $oilqty = $_POST['oilqty'];
    $sparkqty = $_POST['sparkqty'];
    $find = $_POST['find'];

    // 声明三个常量作为价格 
    define('TIREPRICE', 100);
    define('OILPRICE', 10);
    define('SPARKPRICE', 4);
?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Dacao's Auto Parts - Order Results</title>
  </head>

  <body>
    <h1>Dacao's Auto Parts</h1>
    <h2>Order Results</h2> 

    <?php echo $tireqty." tires<br>" ?>
    <?php echo $oilqty." bottles of oil<br>" ?>
    <!-- <?php echo $sparkqty."spark plugs<br>" ?> -->
    <?php echo "$sparkqty spark plugs<br>" ?>

    <?php 
        $total_amount = $tireqty*TIREPRICE + $oilqty*OILPRICE + $sparkqty*SPARKPRICE;
        echo "total amount is".number_format($total_amount,2)."<br>"; 
    ?>

    <?php 
    switch($find){
        case "a":
            echo"<p>Regular customer.</p>";
            break;
        case "b":
            echo"<p>Customer referred by TV advert.</p>";
            break;
        case "c":
            echo"<p>Customer referred by phone directory.</p>";
            break;
        case "d":
            echo"<p>Customer referred by word of mouth.</p>";
            break;
        default:
            echo"<p>We do not know how this customer found us.</p>";
            break;
        }  
    ?>

    <?php
        echo "<p>Order processed at:".date('H:i,jS F Y')."</p>";
    ?>

  </body>

</html>