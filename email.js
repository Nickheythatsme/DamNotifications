var mailer = require('nodemailer');
var fs = require('fs');
var path = require('path');

var auth = fs.readFileSync(path.join(__dirname,'email.json'));
auth = JSON.parse(auth);

var transporter = mailer.createTransport({
    service: 'gmail',
    auth
});

var mailOptions = {
    from: auth.user,
    to: auth.user,
    subject: 'test!',
    text: 'That was easy!'
};


transporter.sendMail(mailOptions, (err, info) => {
    if(err) console.log(err)
    else console.log('Email send: ' + info.response);
});