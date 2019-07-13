<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Read Receipt</title>
  <meta name="description" content="An email read receipt example">
  <meta name="author" content="Toby Smith">
  <link rel="stylesheet" href="css/styles.css?v=1.0">
</head>

<body>
  <div class="container">  
    <form id="input-form" action="" method="post">
      <h3>Read Receipts</h3>
      <h4>Emails can use tricks to know when you open them.</h4>
      <h4>Enter your email address below to receive an email demonstrating this.</h4>
      <fieldset>
        <input placeholder="Your Email Address" type="email" tabindex="2" required>
      </fieldset>
      <fieldset>
        <textarea placeholder="Enter the text you want your email to contain..." tabindex="5" required></textarea>
      </fieldset>
      <fieldset>
        <button name="submit" type="submit" id="contact-submit" data-submit="...Sending">Send Email!</button>
      </fieldset>
      <p class="footer-message">None of your details or information are saved. Ever.</p>
    </form>
  </div>
</body>
</html>