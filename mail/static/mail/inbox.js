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
  document.querySelector('#read-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}




function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';

  // Show the mailbox name
  const emv = document.querySelector('#emails-view');
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load the table-looking div of emails
  add_mailbox_container(mailbox, emv);
}



function read_email(email_id, mailbox){

    // Show the email reader and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'block';

    // Get the element and clear out anything in it from previous emails
    const rdv = document.querySelector('#read-view');
    rdv.innerHTML = '';

    // Load the email reader
    add_email_container(email_id, rdv, mailbox);
}

function add_email_container(email_id, rdv, mailbox){
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email =>{
    console.log(email);
    mark_as_read(email_id);
    rdv.append(email_element(email, mailbox))
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

function mark_as_read(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

function toggle_archived(email){
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
  .then(
    load_mailbox('inbox')
  )
  .catch(error => {
    console.log('Error: ', error);
  });
}


function email_element(email, mailbox){
  // Create a container element
  let ediv = document.createElement('div');
  ediv.classList.add('container');
  ediv.id = 'reader-container';

  // If this is not the sent box, add a div for the archive button
  if (mailbox !== 'sent')
  {
    ediv.append(archive_icon(email));
  }

  // Add rows for info at the top
  ediv.append(reader_info_row('From:', email.sender));
  ediv.append(reader_info_row('To:', email.recipients));
  ediv.append(reader_info_row('Sent:', email.timestamp));
  ediv.append(reader_info_row('Subject:', email.subject));

  // Add hr
  let my_hr = document.createElement('hr');
  my_hr.id = 'reader-splitter';
  ediv.append(my_hr);

  // Add the email contents
  const body = document.createElement('div');
  body.id = 'reader-body';
  body.innerHTML = email.body;
  ediv.append(body);

  return ediv;
}

function archive_icon(email){

  // Create a element and set the ID and event listener
  const adiv = document.createElement('div');
  adiv.id = 'archive-toggle';
  adiv.addEventListener('click', () => {
    toggle_archived(email);
  });

  // Set class and innerHTML based on current archived status
  if (email.archived)
  {
    adiv.classList.add('archived');
    adiv.innerHTML = 'in archive';
  }
  else
  {
    adiv.classList.add('unarchived');
    adiv.innerHTML = 'add to archive';
  }

  return adiv;
}



function reader_info_row(label, content){
  // Create a row for this info
  const rrow = new_row_div();

  // Add a div for the label column
  let tcol = document.createElement('div');
  tcol.classList.add('col-2');
  tcol.innerHTML = label;
  rrow.append(tcol);

  // Add a div to store the contents
  tcol = document.createElement('div');
  tcol.classList.add('col');
  tcol.innerHTML = content;
  rrow.append(tcol);

  return rrow;
}



function new_row_div(){
  const nrow = document.createElement('div');
  nrow.classList.add('row');
  return nrow;
}




// Loading all emails in a mailbox
function add_mailbox_container(mailbox, emv){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emv.append(mailbox_element(emails, mailbox));
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

// Create elements for a table showing a list of all emails in a particular mailbox
function mailbox_element(emails, mailbox){
  // Setup the container div
  const container = document.createElement('div');
  container.classList.add('container', 'mailbox-container');

  // Start work on the HTML inside. Begin with the header.
  const hrow = document.createElement('div');
  hrow.classList.add('row', 'mailbox-header');
  hrow.innerHTML = '<div class="col">Sender</div><div class="col">Subject</div><div class="col">Time</div>';
  container.append(hrow);

  // Add div rows for each email
  emails.forEach(function(email){
    // Start the row div, with different CSS for read vs. unread  
    const ediv = document.createElement('div');
    ediv.classList.add('row');
  
    if (email.read){
      ediv.classList.add('read');
    }
    else{
      ediv.classList.add('unread');
    }

    // Add the info
    ediv.innerHTML = `<div class="col">${email.sender}</div><div class="col">${email.subject}</div><div class="col">${email.timestamp}</div>`;
    ediv.addEventListener('click', function(){
      read_email(email.id, mailbox)
    });
    container.append(ediv);
  });

  return container;
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