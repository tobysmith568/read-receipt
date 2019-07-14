<?php
ini_set('include_path', '/home/billspli/php:' . ini_get('include_path'));
require_once('Mail.php');
require_once('../email-credentials.php');
error_reporting(E_ALL);

$name = 'img/pixel.png';
$openPixel = fopen($name, 'rb');

header('Content-Type: image/png');
header('Content-Length: ' . filesize($name));

function getUserIpAddr() {
  if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    return $_SERVER['HTTP_CLIENT_IP'];
  } else if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    return $_SERVER['HTTP_X_FORWARDED_FOR'];
  }

  return $_SERVER['REMOTE_ADDR'];
}

function getListElement($content) {
  return '<li>' . $content . '</li>';
}

function processIP($ip) {
  $result = file_get_contents('http://ip-api.com/json/' . $ip . '?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,mobile,proxy,query');

  if (empty($result)) {
    return '';
  }

  return json_decode($result);
}

function getAddressFromIPDetails($ipDetails) {
  $result = getListElement('Latitude: ' . $ipDetails->lat);
  $result .= getListElement('Longitude: ' . $ipDetails->lon);
  $result .= getListElement('City: ' . $ipDetails->zip . ', '
                                     . $ipDetails->city . ', '
                                     . $ipDetails->country
                                     . ' (' . $ipDetails->countryCode . ')');
  $result .= getListElement('Timezone: ' . $ipDetails->timezone);

  return $result;
}

$email = trim($_GET['email'], '/');
$timestamp = trim( $_GET['timestamp'], '/');

$dateTimeSent = DateTime::createFromFormat('U', $timestamp, new DateTimeZone('UTC'));
$dateTimeNow = new DateTime('now', new DateTimeZone('UTC'));
$timeDifference = $dateTimeNow->diff($dateTimeSent)->format('%a days, %h hours, %i minutes and %s seconds');

$ip = getUserIpAddr();
$ipDetails = processIP($ip);

$userAgent = $_SERVER['HTTP_USER_AGENT'];
if (!isset($userAgent)) {
  $userAgent = 'unknown';
}

ob_start(); ?>
<h3>You just opened your email!</h3>
<p>
  <div>Time of original email: <?php echo $dateTimeSent->format('Y-m-d H:i:s') . 'UTC'; ?></div>
  <div>Time email was read: <?php echo $dateTimeNow->format('Y-m-d H:i:s') . 'UTC'; ?></div>
  <div>Time difference: <?php echo $timeDifference; ?></div>
</p>
<p>
  <div>IP address: <?php echo $ip; ?></div>
  <div>Internet service provider: <?php echo $ipDetails->isp; ?></div>
  <div>Is mobile connection: <?php echo $ipDetails->mobile ? 'Yes' : 'No'; ?></div>
  <div>Is a proxy: <?php echo $ipDetails->proxy ? 'Yes' : 'No'; ?></div>
</p>
<p>Guessed location:
  <ul><?php echo getAddressFromIPDetails($ipDetails); ?></ul>
</p>
<p>
  <div>User agent: <?php echo $userAgent; ?></div>
</p>
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

fpassthru($openPixel);
die();