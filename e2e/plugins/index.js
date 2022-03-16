const ms = require("smtp-tester");

module.exports = (on, config) => {
  const port = 2525;
  const mailServer = ms.init(port);
  console.log("mail server at port %d", port);

  let lastEmailPerRecipient = {};

  on("task", {
    deleteAllEmails() {
      console.log("Deleting all emails");
      lastEmailPerRecipient = {};
      return null;
    },

    getLastEmail(email) {
      return lastEmailPerRecipient[email] || null;
    }
  });

  mailServer.bind((addr, id, email) => {
    lastEmailPerRecipient[email.headers.to] = { html: email.html, subject: email.headers.subject };
  });
};
