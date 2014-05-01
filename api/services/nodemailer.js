var nodemailer = require('nodemailer');
module.exports = {

  /**
   * Sends an email to a given recipient
   * @param  {object}   email           an object containing all of the necessary data to email
   * @param  {Function} cb[err, res]    the callback to call once email is sent, or if it fails
   */
  send: function(email, cb){

    /** sets up the modemailer smtp transport */
    var transport = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
          user: "gsky89@gmail.com",
          pass: "troppolol90"
      }
    });

    /** sets up the mail options, from and such like that **/
    var from    = email.from || 'nobody@nobody.com';

    if (sails.config.nodemailer.prepend_subject){
      var subject = sails.config.nodemailer.prepend_subject +  email.subject;
    }else{
      var subject = email.subject;
    }

    var mailOptions = {
      from: email.name + '<' + from + '>',
      to: email.to,
      subject: subject,
      html: email.messageHtml
    }

    /** Actually sends the email */
    transport.sendMail(mailOptions, function(err, response){
      if(err) return cb(err);
      return cb(null, response);
    });
  }
}
