<?php

$uri = $_SERVER['REQUEST_URI'];
$allowed = ['/wp-admin', '/wp-json', '/wp-login'];

foreach ($allowed as $x) {
  if (strpos($uri, $x) !== false) {
    // WordPress view bootstrapper
    define('WP_USE_THEMES', true);
    require(dirname( __FILE__ ) . '/wordpress/wp-blog-header.php');
    die();
  }
} ?>
