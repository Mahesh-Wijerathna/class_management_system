<?php
$content = file_get_contents("/var/www/html/PaymentController.php");
$content = str_replace("bind_param(\"sids\"", "bind_param(\"sids\"", $content);
file_put_contents("/var/www/html/PaymentController.php", $content);
echo "Fixed bind_param string
";
?>
