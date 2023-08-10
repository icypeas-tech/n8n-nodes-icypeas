# Icypeas node

This is an n8n community node. It lets you use Icypeas API in your n8n workflows.

Icypeas is a node that will take care of the single and bulk searches (email verification, email search, domain search) with the [Icypeas's API](https://app.icypeas.com/).

For the [API](https://app.icypeas.com/), you can always refer to the [Icypeas documentation](https://api-doc.icypeas.com/getting-started) for more informations.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Usage](#usage)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

You can do :

- email verification
- email search
- domain search

by either performing :

- a single search
- or a bulk search.

## Credentials

You need to implement three informations:

- The API key
- The API Secret
- The User ID for the bulk search

To retrieve those informations, go to the user profile in the Icypeas application. After logging in: Click on the profile icon > Select _Your Profile_ > Go to the _API_ section > Click on the _Enable API Access_ button.

## Usage

The bulk search needs the user ID, and a file with the informations to search. The file must be a xlsx file (or Google Sheet) with the following columns:

- _email_ (for email verification)
- _companyOrDomain_ (for domain search)
- _firstname_, _lastname_, _companyOrDomain_ (for email search).

You can also implement your own colomns names if they are different, by specifying them in the node settings.

You can always refer to the [Icypeas documentation](https://api-doc.icypeas.com/getting-started) for more informations.

## Resources

- [Icypeas's API](https://app.icypeas.com/)
- [Icypeas documentation](https://api-doc.icypeas.com/getting-started)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
