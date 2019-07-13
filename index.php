<!doctype html>
<?php
ini_set('include_path', '/home/billspli/php:' . ini_get('include_path') );
require_once('Mail.php');
require_once('../../email-credentials.php');
error_reporting(E_ALL);
?>

<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Read Receipt</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="An email read receipt example">
  <meta name="author" content="Toby Smith">
  <link rel="stylesheet" href="css/styles.css">
</head>

<?php

function getVerb($sent) {
  if ($sent) {
    return 'GET';
  } else {
    return 'POST';
  }
}

function getButtonText($sent) {
  if ($sent) {
    return 'Return to form';
  } else {
    return 'Send email!';
  }
}

$sent = false;
if (isset( $_POST['submit'])) {
  error_log('got post');
  
  $email = '<' . $_REQUEST['email'] . '>';
  $content = $_REQUEST['content'];
  
  $message = "<p>{$content}</p>";

  $headers = array(
    'From' => '<' . $emailCredentials->username . '>',
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/html; charset=UTF-8',
    'Subject' => 'Read Receipt Example'
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

  $isError = !PEAR::isError($mail);
}
?>

<body>
  <div class="container">  
    <form id="input-form" action="" method="<?php echo getVerb($sent); ?>">
      <?php if (!$sent): ?>
        <h3>Read Receipts</h3>
        <h4>Emails can use tricks to know when you open them.</h4>
        <h4>Enter your email address below to receive an email demonstrating this.</h4>
        <fieldset>
          <input placeholder="Your Email Address" name="email" type="email" tabindex="2" required>
        </fieldset>
        <fieldset>
          <textarea placeholder="Enter the text you want your email to contain..." name="content" tabindex="5" required></textarea>
        </fieldset>
      <?php else : ?>
        <h3>Sent!</h3>
        <h4>Check your inbox for your email now.</h4>
        <h4>When you open it you will recieve a second email confirming that it was opened.</h4>
      <?php endif; ?>
      <fieldset>
        <button name="submit" type="submit" id="contact-submit" data-submit="...Sending"><?php echo getButtonText($sent); ?></button>
      </fieldset>
      <p class="footer-message">None of your details or information are saved. Ever.</p>
    </form>
  </div>
</body>
</html>