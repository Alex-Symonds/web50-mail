// Handles conditional display of views and communication with the server to send and read emails

// CSS IDs for the three views
const ID_VIEW_EMAIL = 'emails-view';
const ID_VIEW_COMPOSE = 'compose-view';
const ID_VIEW_READ = 'read-view';

// CSS IDs for the compose email form
const ID_COMPOSE_FORM = 'compose-form';
const ID_COMPOSE_RECIPIENTS = 'compose-recipients';
const ID_COMPOSE_SUBJECT = 'compose-subject';
const ID_COMPOSE_BODY = 'compose-body';


// SETUP: add event listeners to mode buttons and load the inbox
document.addEventListener('DOMContentLoaded', function() {

  // Buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});


// GENERAL
// GENERAL: Create a div with the Bootstrap row class pre-set
function new_row_div(){
  const nrow = document.createElement('div');
  nrow.classList.add('row');
  return nrow;
}


// GENERAL: Show one view and hide the others
function set_view(id_to_show) {
  let ids = [ID_VIEW_EMAIL, ID_VIEW_COMPOSE, ID_VIEW_READ];

  document.querySelector(`#${id_to_show}`).style.display = 'block';

  for(var id in ids){
    if (ids[id] !== id_to_show)
    {
      document.querySelector(`#${ids[id]}`).style.display = 'none';
    }
  }
}


// COMPOSE
// Note: "Normal" HTML for composing an email is in the layout.html file
function compose_email() {
  set_view(ID_VIEW_COMPOSE);

  // Clear out any old data from composition fields
  document.querySelector(`#${ID_COMPOSE_RECIPIENTS}`).value = '';
  document.querySelector(`#${ID_COMPOSE_SUBJECT}`).value = '';
  document.querySelector(`#${ID_COMPOSE_BODY}`).value = '';
}


// COMPOSE: Send an email to the server
function send_email() {
  // Get the data from the form the user submitted
  send_form = document.querySelector(`#${ID_COMPOSE_FORM}`)

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: send_form[ID_COMPOSE_RECIPIENTS].value,
      subject: send_form[ID_COMPOSE_SUBJECT].value,
      body: send_form[ID_COMPOSE_BODY].value
    })
  })
  .then(response => {
    if(response.status != 201){
      result = response.json();
      console.log(result);
    }
  })
  .catch(error => {
    console.log('Error: ', error)
  });

  load_mailbox('sent');
  return false;
}

// COMPOSE: Display the compose page in "reply mode", i.e. with some preset values
function reply_to_email(email){
  // Set the view and clear any old inputs
  compose_email();

  // Preset recipients
  document.querySelector(`#${ID_COMPOSE_RECIPIENTS}`).value = email.sender;

  // Preset subject. Append "Re:" prefix if there isn't one already
  let preset_subj = email.subject;
  if (email.subject.slice(0,3) !== 'Re:')
  {
    preset_subj = 'Re: ' + email.subject;
  }
  document.querySelector(`#${ID_COMPOSE_SUBJECT}`).value = preset_subj;

  // Preset body
  let preset_body = '\n\n--------------------------------------\n';
  preset_body += `On ${email.timestamp} ${email.sender} wrote:\n`;
  preset_body += '--------------------------------------\n';
  document.querySelector(`#${ID_COMPOSE_BODY}`).value = preset_body + email.body;
}


// MAILBOX
function load_mailbox(mailbox) {
  const mailbox_view_ele = document.querySelector(`#${ID_VIEW_EMAIL}`);
  mailbox_view_ele.replaceChildren();

  update_mailbox_heading(mailbox, mailbox_view_ele);
  add_mailbox_container(mailbox, mailbox_view_ele);
  set_view(ID_VIEW_EMAIL);
}

// MAILBOX: Change the heading to the current mailbox
function update_mailbox_heading(mailbox_name, mailbox_view_ele){
  let heading_text = mailbox_name.charAt(0).toUpperCase() + mailbox_name.slice(1);

  let existing_headings = mailbox_view_ele.getElementsByTagName('h3');
  if(existing_headings.length > 0)
  {
    existing_headings[0].innerHTML = heading_text;
  }
  else
  {
    let heading_ele = document.createElement('h3');
    heading_ele.innerHTML = heading_text;
    mailbox_view_ele.prepend(heading_ele);    
  }
}


// MAILBOX: Get mailbox contents from the server and add it to the DOM
function add_mailbox_container(mailbox, mailbox_view_ele){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    mailbox_view_ele.append(create_mailbox_element(emails, mailbox));
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

// MAILBOX: Create container element showing a list of all emails
function create_mailbox_element(emails, mailbox){
  // Setup the container div
  const container = document.createElement('div');
  container.classList.add('container');
  container.id = 'mailbox-container';

  // Add a row for each email
  emails.forEach(function(email){
    // Get a standard email row div; add "read" CSS; enable "opening" the email
    const ediv = mailbox_row(email.sender, email.subject, email.timestamp);

    if (email.read)
    {
      ediv.classList.add('read');
    }

    ediv.addEventListener('click', function(){
      read_email(email.id, mailbox)
    });

    container.append(ediv);
  });

  return container;
}

// MAILBOX: Display one email's data in a single three-column row
function mailbox_row(first, second, third){
  let cell_1 = document.createElement('div');
  cell_1.classList.add('col-sm-3', 'col-12');
  cell_1.innerHTML = first;

  let cell_2 = document.createElement('div');
  cell_2.classList.add('col-sm', 'col-12');
  cell_2.innerHTML = second;

  let cell_3 = document.createElement('div');
  cell_3.classList.add('col-xl-3', 'col-md-4', 'col-sm-5', 'col-12');
  cell_3.innerHTML = third;


  let row_ele = new_row_div();
  row_ele.classList.add('email-row');
  row_ele.append(cell_1);
  row_ele.append(cell_2);
  row_ele.append(cell_3);

  return row_ele;
}



// READ EMAIL
function read_email(email_id, mailbox){
    const read_view = document.querySelector(`#${ID_VIEW_READ}`);
    read_view.replaceChildren();
    add_email_container(email_id, read_view, mailbox);
    set_view(ID_VIEW_READ);
}

// READ EMAIL: Fetch data for this email, mark it as read, append the email container to the DOM
function add_email_container(email_id, read_view_ele, mailbox){
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email =>{
    mark_as_read(email_id);
    read_view_ele.append(create_read_email_element(email, mailbox))
  })
  .catch(error => {
    console.log('Error: ', error);
  });
}

// READ_EMAIL: Set an email's read status to 'read'
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

// READ EMAIL: Toggle archive status for a single email
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

// READ EMAIL: Create an element displaying one email in full
function create_read_email_element(email, mailbox){

  // Container
  let ediv = document.createElement('div');
  ediv.classList.add('container');

  // Info at the top
  ediv.append(create_reader_info_row('From:', email.sender));
  ediv.append(create_reader_info_row('To:', email.recipients));
  ediv.append(create_reader_info_row('Sent:', email.timestamp));
  ediv.append(create_reader_info_row('Subject:', email.subject));

  // Reply and archive buttons
  ediv.append(create_reader_command_row(email, mailbox));

  // hr
  let my_hr = document.createElement('hr');
  my_hr.id = 'reader-splitter';
  ediv.append(my_hr);

  // Email contents
  const body = document.createElement('div');
  body.id = 'reader-body';
  body.innerHTML = email.body.replaceAll(/&/g,'&amp;').replaceAll(/</g,'&lt;').replaceAll(/>/g,'&gt;');
  ediv.append(body);

  return ediv;
}

// READ EMAIL: Create element for displaying a single heading/value pair at the top of an email
function create_reader_info_row(label, content){
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

// READ EMAIL: Create element with reply and archive buttons
function create_reader_command_row(email, mailbox){
  // Setup an element containing the row of email-specific buttons
  const rrow = new_row_div();
  rrow.id = 'reader-command-row';

  // Add reply button
  const reply_col = create_reader_command_col();
  reply_col.append(reply_button(email));
  rrow.append(reply_col);

  // If this is not the sent box, add an archive button
  if (mailbox !== 'sent')
  {
    const arch_col = create_reader_command_col();
    arch_col.append(archive_button(email))
    rrow.append(arch_col);
  }

  return rrow;
}

// READ EMAIL: Column to store a button
function create_reader_command_col(){
  const col = document.createElement('div');
  col.classList.add('col-lg-2', 'col-md-3', 'col-sm-4','col-6');
  return col;
}

// READ EMAIL: Create reply button element
function reply_button(email){
  const rbtn = document.createElement('button');
  rbtn.innerHTML = 'reply';
  rbtn.classList.add('btn', 'btn-sm', 'btn-primary', 'my-btn');
  rbtn.addEventListener('click', () => {
    reply_to_email(email);
  });
  return rbtn;
}

// READ EMAIL: Create archive button element
function archive_button(email){
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


