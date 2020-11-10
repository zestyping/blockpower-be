## Introduction
Welcome to the BlockPower Voting Ambassador Platform project!  BlockPower is a nonprofit focused on increasing voter turnout among Black citizens who don't vote regularly. BlockPower pays people in majority-Black neighborhoods to be "Voting Ambassadors" and talk with their friends, family members, and neighbors about the importance of voting. A Voting Ambassadors asks these friends, family members and neighbors to become "Vote Triplers" who will, in turn, remind 3 other people in their community to vote.

This software platform enables Voting Ambassadors to find people they know in the database to text them through the platform about their commitment to be a Vote Tripler, and to receive payments for affirmative responses from their Vote Triplers.  A simple sign-up form leads to the dashboard, where a Voting Ambassador can get started looking for people they know in the database. By default, the Voting Ambassador will be shown a list of people in their area (within a configurable number of meters from the Ambassador). This distance is calculated via the Neo4J apoc.distance function, using the Point data type either imported from CSV in the case of a Vote Tripler, or pulled from an external API (census.gov) in the case of Voting Ambassadors.  Voting Ambassadors can also find people they know in the list by setting a variety of search filters, including first and last name, phone number, metro area, age, gender and proximity. The Voting Ambassador can then "claim" a tripler by selecting one or more from the list. If a Vote Tripler is already claimed, no other Voting Ambassadors will see them in their lists going forward and therefore cannot claim an already claimed Vote Tripler.

Once the Ambassador has "claimed" one or more Vote Triplers, they can contact these Vote Triplers via standardized text (via a pool of Twilio longcodes) through the platform . The text will follow up with the Vote Tripler, prompting a confirmation from the Vote Tripler that they will remind 3 others to vote.  If that Vote Tripler responds "Yes" to the SMS, the system will record a pending payment for the Voting Ambassador. There is a maximum number of Vote Triplers each ambassador can claim that is configurable, as is payment amount. Voting Ambassadors can go through a simple process via Plaid-Link to login to their bank account and link it to the platform for payments via Stripe Connected Account (PayPal as another option to receive payments is coming soon).

Also see the [CONTRIBUTING](/CONTRIBUTING.md) document for more background and a technical overview.

### Frontend

A Vote Ambassador signs up with and interacts mainly with the React front-end. The front-end code can be found here: [hello-voter](https://github.com/colab-coop/hello-voter). 

### Admin-ui

This software also has the concept of "admin", an Ambassador account which is empowered to block Ambassadors, make another Ambassador an admin, and download CSV data reports of Ambassadors and their claimed Triplers.

The admin panel can be found here: [https://github.com/colab-coop/HelloVoter-admin-ui](https://github.com/colab-coop/HelloVoter-admin-ui).

## Development

### Prerequisites

- Node. We recommend installing via [Node Version Manager](https://github.com/nvm-sh/nvm#installing-and-updating).
- [Docker](https://docs.docker.com/desktop/) is required to get the database running.

### Installation

1. Copy `.env.example` to `.env` and modify as needed: `cp server/.env.example server/.env`
1. Install dependencies: `npm install`
1. Setup the database: `npm run database`
1. (optional) Seed the database with fake data: `(cd server && npm run seed:fresh)`
1. Start the server: `npm start`

### Usage

After following the steps above,
1. The API will be available at <http://localhost:8080/api/v1/>
1. The Neo4j Browser will be available at <http://localhost:7474/browser/>
    - Username `neo4j`, default password `hellovoter`
    - Example query to see all data: `MATCH (n) RETURN n`

For local development without requiring real OAuth:
1. Set `REACT_APP_NO_AUTH=1`
1. Modify an Ambassador to work with a mock Authorization token: `MATCH (a:Ambassador {admin: true}) SET a.external_id = "noauth:localuser"`
1. Use this Bearer token when making requests: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im5vYXV0aDpsb2NhbHVzZXIiLCJuYW1lIjoiTG9jYWwgVXNlciIsImVtYWlsIjoibG9jYWxAbG9jYWxob3N0IiwiaXNzIjoib3Vydm9pY2V1c2Eub3JnIiwiaWF0IjoxLCJleHAiOjIsImRpc2NsYWltZXIiOiJCbGFoIGJsYWggZGlzY2xhaW1lciJ9.qa5K2pgi1uLYkV7jP3aNvazcchvgBD8RwhdG6Q86GxlvusQx7nNCTr3LrAnn6pxDJxNidJoqjD3Ie77jj5hWK_-lbgtHMLhNXGExDxI8pQ0I5ZnAV_5pDu7vARinoy3mctQWFO2pIQSu8KzQc7eQ90IQZBseE7nQV-ugZRfK8Teo_48COcJxGxqwCNCO80G_JzBoif2xaWRb2i2n0qeSUKfXN4Fwy46JOiHFnL9yOS5s54tB6doe1wFJNYps8eVQbVkTBL1I9PQP4Gs-BmzND0vcQaczTdu_J50uvLL5do1FHb48lRhrA44ZrYv3EVwNsJXZtH3MbasxgPrZhl69VQ`

### Debugging

1. See hellovoter.log for output: `less +F server/hellovoter.log`

## Production Deployment

Note the deployment branch for the api is "ambassador", with tagged releases.

We (CoLab) are currently using an AWS cluster to deploy all of this code (api, frontend, and admin-ui). We use an Ansible playbook to provision the servers. We point the servers to a Neo4J database hosted at Graphene. The frontend is also hosted on an AWS server in the cluster, also using an Ansible playbook. We have CircleCI workflows implemented for deployment.

You are, of course, free to deploy in any way you wish, but we have not attempted any other deployment configuration so YMMV.

## License

	Software License Agreement (AGPLv3+)

	Copyright (c) 2020, Our Voice USA. All rights reserved.

        This program is free software; you can redistribute it and/or
        modify it under the terms of the GNU Affero General Public License
        as published by the Free Software Foundation; either version 3
        of the License, or (at your option) any later version.

        This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        GNU Affero General Public License for more details.

        You should have received a copy of the GNU Affero General Public License
        along with this program; if not, write to the Free Software
        Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

**NOTE:** We relicense the mobile app code for the purposes of distribution on the App Store. For details, read our [CLA Rationale](CLA-Rationale.md)

Logos, icons, and other artwork depicting the Our Voice bird are copyright and not for redistribution without express written permission by Our Voice USA.
