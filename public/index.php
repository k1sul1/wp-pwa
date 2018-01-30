<?php
$uri = $_SERVER['REQUEST_URI'];
$domain = $_SERVER['HTTP_HOST'];
$allowed = ['/wp-admin', '/wp-json', '/wp-login'];
$allowedDomains = ['wcjkl.local', 'ccthwpd.fi.seravo.com'];
$allowedDomain = in_array($domain, $allowedDomains);

foreach ($allowed as $x) {
  if (strpos($uri, $x) !== false && $allowedDomain) {
    // WordPress view bootstrapper
    define('WP_USE_THEMES', true);
    require(dirname( __FILE__ ) . '/wordpress/wp-blog-header.php');
    die();
  }
}

if (!$allowedDomain) {
  echo "<!-- Hello! -->";
  require_once "app.html";
  die();
}

die("I don't know who you are or how you got here. You shouldn't be here.");
