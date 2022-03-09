# Harvard's CS50w: Project 3, "Mail", by Alex Symonds

## Introduction
Create a frontend for a mail client.

## Specification and Provided Materials
Students were given:
* Complete Django backend, incl. log in, log out, register pages
* Almost complete inbox.html file (small additions were required)
* Skeleton JavaScript file, "started off" with:
    * DOMContentLoaded function with event listeners added to the navigation buttons
    * Incomplete compose_email function (i.e. shows a form, but does nothing when you click the buttons)
    * Incomplete load_mailbox function (i.e. shows a name for the inbox, but no emails and no way to actually read an email)

Students were not expected to touch the Django files, nor to make many changes to the HTML: this was primarily a JavaScript project, with a little CSS.

Students were required to add the following features:
* Send email via a POST request to the server, then loads the user's sent inbox
* Display email inside an inbox. Clicking an inbox sends an appropriate GET request, then creates DOM elements for each email, with conditional CSS applied for read/unread
* View email: clicking an email in an inbox displays a page showing the email in full.
    * Add buttons to archive / unarchive a received email.
    * Add a reply button which loads the compose email form with pre-filled fields

[Project specification details here.](https://cs50.harvard.edu/web/2020/projects/3/mail/)

## Pages
* inbox
* log in, register

## Learning Comments
* Creation/manipulation of DOM elements in JavaScript
* Adding event listeners to DOM elements
* Use of fetch, then, catch blocks



