<?php
$domain = $_SERVER['HTTP_HOST'];
$allowedDomains = ['wcjkl.local', 'ccthwpd.fi.seravo.com'];
$allowedWPDomain = in_array($domain, $allowedDomains);

if ($allowedWPDomain) {
    // WordPress view bootstrapper
    define('WP_USE_THEMES', true);
    require(dirname( __FILE__ ) . '/wordpress/wp-blog-header.php');
} else {
  require_once "app.html";
}
