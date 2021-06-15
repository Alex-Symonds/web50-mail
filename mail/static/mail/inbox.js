document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
 });

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  const emv = document.querySelector('#emails-view');
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load the table-looking div of emails
  load_emails(mailbox, emv);

}


// Loading emails
function load_emails(mailbox, emv){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emv.append(mailbox_as_div(emails));
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}


function mailbox_as_div(emails){
  // Setup the container div
  const div = document.createElement('div');
  div.class = 'container mailbox-container';

  // Start work on the HTML inside. Begin with the header.
  let results = '<div class="row mailbox-header"><div class="col">Sender</div><div class="col">Subject</div><div class="col">Time</div></div>';

  // Add div rows for each email
  emails.forEach(function(email){

    // Start the row div, with different CSS for read vs. unread  
    results += '<div class="';
    if (email.read){
      results += 'row read';
    }
    else{
      results += 'row unread';
    }

    // Add the info
    results += `"><div class="col">${email.sender}</div><div class="col">${email.subject}</div><div class="col">${email.timestamp}</div>`;
    results += '</div>';
  });

  // Add to div as innerHTML and return the div
  div.innerHTML = results;
  return div;
}


function send_email() {

  // Get the data from the form the user submitted
  send_form = document.querySelector('#compose-form')
  my_recipients = send_form['compose-recipients'].value;
  my_subject = send_form['compose-subject'].value;
  my_body = send_form['compose-body'].value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: my_recipients,
      subject: my_subject,
      body: my_body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
  })
  .catch(error => {
    console.log('Error: ', error)
  });

  load_mailbox('sent');

  return false;
}