document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
 });


 // COMPOSE EMAIL
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

function reply_to_email(email){
  // Set the views and clear any old inputs
  compose_email();

  // Preset recipients
  document.querySelector('#compose-recipients').value = email.sender;

  // Preset subject. Append "Re:" prefix if there isn't one already
  let preset_subj = email.subject;
  if (email.subject.slice(0,3) !== 'Re:')
  {
    preset_subj = 'Re: ' + email.subject;
  }
  document.querySelector('#compose-subject').value = preset_subj;

  // Preset body
  let preset_body = '\n\n--------------------------------------\n';
  preset_body += `On ${email.timestamp} ${email.sender} wrote:\n`;
  preset_body += '--------------------------------------\n';
  document.querySelector('#compose-body').value = preset_body + email.body;
}


// LOAD MAILBOX
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

function add_mailbox_container(mailbox, emv){
  // Get mailbox data, turn it into HTML and add it to the DOM
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

function mailbox_element(emails, mailbox){
  // Create container containing divs showing a list of all emails in a particular mailbox
  // Setup the container div
  const container = document.createElement('div');
  container.classList.add('container');
  container.id = 'mailbox-container';

  // Add a div-row for each email
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

    // Fill the row with columns of info
    ediv.innerHTML = mailbox_row_html(email.sender, email.subject, email.timestamp);
    ediv.addEventListener('click', function(){
      read_email(email.id, mailbox)
    });
    container.append(ediv);
  });

  return container;
}

function mailbox_row_html(first, second, third){
  // Shared HTML for all rows in the mailbox
  return `<div class="col-sm-3 col-12">${first}</div><div class="col-sm col-12">${second}</div><div class="col-xl-3 col-md-4 col-sm-5 col-12">${third}</div>`
}



// READ EMAIL
function read_email(email_id, mailbox){

    // Show the email reader and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'block';

    // Get the element and clear out any old stuff
    const rdv = document.querySelector('#read-view');
    rdv.innerHTML = '';

    // Handle the data and HTML for the actual email
    add_email_container(email_id, rdv, mailbox);
}

function add_email_container(email_id, rdv, mailbox){
  // Fetch data for this email, mark it as read, append the email container to the DOM
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email =>{
    console.log(email);
    mark_as_read(email_id);
    rdv.append(read_email_element(email, mailbox))
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

function mark_as_read(email_id){
  // Sets an email's status as 'read'
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
  // Toggle archive status in a single email
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

function read_email_element(email, mailbox){
  // Create a container div containing info for one email
  // Create the container element and apply CSS labels
  let ediv = document.createElement('div');
  ediv.classList.add('container');

  // Add rows for info at the top
  ediv.append(reader_info_row('From:', email.sender));
  ediv.append(reader_info_row('To:', email.recipients));
  ediv.append(reader_info_row('Sent:', email.timestamp));
  ediv.append(reader_info_row('Subject:', email.subject));

  // Add row with reply and archive buttons
  ediv.append(reader_command_row(email, mailbox));

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

function reader_info_row(label, content){
  // Create a row div element setup for the info at the top of an email
  // Create a basic row element
  const rrow = new_row_div();

  // Add a div for the label column
  let tcol = document.createElement('div');
  tcol.classList.add('col-lg-1', 'col-sm-2', 'col-3');
  const myh = document.createElement('h6');
  myh.innerHTML = label;
  tcol.append(myh);
  rrow.append(tcol);

  // Add a div to store the contents
  tcol = document.createElement('div');
  tcol.classList.add('col');
  tcol.innerHTML = content;
  rrow.append(tcol);

  return rrow;
}

function reader_command_col(){
  // Resuable column for email-specific buttons with any shared classes preset
  const col = document.createElement('div');
  col.classList.add('col-lg-1', 'col-md-2', 'col-sm-4','col-6');
  return col;
}

function reader_command_row(email, mailbox){
  // Setup an element containing the row of email-specific buttons
  const rrow = new_row_div();
  rrow.id = 'reader-command-row';

  // Add col div and reply button
  const reply_col = reader_command_col();
  reply_col.append(reply_button(email));
  rrow.append(reply_col);

  // If this is not the sent box, add a col div and archive button
  if (mailbox !== 'sent')
  {
    const arch_col = reader_command_col();
    arch_col.append(archive_button(email))
    rrow.append(arch_col);
  }

  return rrow;
}

function reply_button(email){
  // Create an element for the reply button, adding class and eventListener
  const rbtn = document.createElement('button');
  rbtn.innerHTML = 'reply';
  rbtn.classList.add('btn', 'btn-sm', 'btn-primary', 'my-btn');
  rbtn.addEventListener('click', () => {
    reply_to_email(email);
  });
  return rbtn;
}

function archive_button(email){
  // Create a element for the archive button with ID, class and eventListener
  const abtn = document.createElement('button');
  abtn.classList.add('btn', 'btn-sm', 'my-btn');
  abtn.addEventListener('click', () => {
    toggle_archived(email);
  });

  // Set class and innerHTML based on current archived status
  if (email.archived)
  {
    abtn.classList.add('btn-primary');
    abtn.innerHTML = 'de-archive';
  }
  else
  {
    abtn.classList.add('btn-outline-primary');
    abtn.innerHTML = 'archive';
  }

  return abtn;
}


// GENERAL PURPOSE
function new_row_div(){
  // Create a div with the Bootstrap row class pre-set
  const nrow = document.createElement('div');
  nrow.classList.add('row');
  return nrow;
}