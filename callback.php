<?php
ini_set('include_path', '/home/billspli/php:' . ini_get('include_path'));
require_once('Mail.php');
require_once('../email-credentials.php');
error_reporting(E_ALL);

header("Content-Type: image/jpeg");

function getUserIpAddr() {
  if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    return $_SERVER['HTTP_CLIENT_IP'];
  } else if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    return $_SERVER['HTTP_X_FORWARDED_FOR'];
  }

  return $_SERVER['REMOTE_ADDR'];
}

$email = $_GET['email'];
error_log($email);

if (!$email) {
  die();
}
ob_start(); ?>

<h3>You just opened your email!</h3>
<p>IP Address: <?php echo getUserIpAddr(); ?></p>

<?php
$message = ob_get_clean();
$email = '<' . $email . '>';

$headers = array(
  'From' => '<' . $emailCredentials->username . '>',
  'MIME-Version' => '1.0',
  'Content-Type' => 'text/html; charset=UTF-8',
  'Subject' => 'You just opened your email!'
);

$params = array(
  'host' => 'ssl://' . $emailCredentials->host,
  'port' => 465,
  'auth' => true,
  'username' => $emailCredentials->username,
  'password' => $emailCredentials->password
);

$smtp = Mail::factory('smtp', $params);
$sent = $smtp->send($email, $headers, $message);