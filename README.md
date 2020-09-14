## Introduction

This software enables a "Voting Ambassador" workflow for get-out-the-vote campaigns. A Vote Ambassador signs up with the [hello-voter](https://github.com/colab-coop/hello-voter) React front-end serviced by the backend contained in this repo.

## Development Setup

### Prerequisites

**Docker** - Docker is required to get the database running, so make sure you have that installed on your system.

**JDK 1.8** - JDK (not JRE) 1.8 is required for the server. You need to have this installed and your JAVA_HOME environment variable set in order to successfully build and start the server.

To get set up locally, simply run the following commands:

    git clone git@github.com:colab-coop/HelloVoter.git
    cd HelloVoter
    npm install
    npm run database
    npm start

This should initialize the database + Docker instance and start the server.

## About This App

The Vote Ambassador, once signed up, is provided a list of voters in their area (within some configurable number of meters from the Ambassador). This distance is calculated via the Neo4J apoc.distance function, using the Point data type either imported from CSV in the case of a Tripler, or pulled from an external API in the case of Ambassadors. This list must of course be imported using the import script found in `/server/scripts/importer` (NOTE! CSV format, very specific column order). The Vote Ambassador contacts these voters (called Vote Triplers) and encourages them to help 3 additional people vote (called Triplees). Once the Vote Tripler responds "YES" to the system's SMS (this software assumes Twilio SMS integration), the Vote Ambassador will receive payment from the organization who has set up this software. Currently this software assumes payment via Stripe + Plaid, though Paypal is at least somewhat working.

## History

This software was built with the assumption that it would eventually be merged back into the OurVoiceUSA [HelloVoter](https://github.com/OurVoiceUSA/HelloVoter) app. While this will hopefully happen at some point in the future, this software has diverged from HelloVoter in numerous ways. However, due to the historical nature of building this software on top of HelloVoter, you will find a large portion of the codebase remains HelloVoter specific. The software is intended to be used with the [hello-voter](https://github.com/colab-coop/hello-voter) React front-end, which calls the specific API endpoints of this software, rather than the endpoints that the now-deleted `/client` folder used.

### Neode

The first and likely biggest change breaking from HelloVoter is that we began to use the neode OGM: [https://github.com/adam-cowley/neode](https://github.com/adam-cowley/neode). This OGM was assumed to reduce lines of code and make working with Neo4J simpler. In most cases, this has matched expectations. In several cases, it has not. There are multiple reasons for why neode did not make things easier for us. One reason is that because we are using Neo4J 3.5, we could not use the latest version of neode. Other reasons included certain functionality simply not being supported by neode. When we could not rely on neode's OGM functions, we dropped down into neode's query-building feature. If you see this in the codebase, feel free to attempt to refactor using OGM functions.

### VA

We have tried to leave the existing HelloVoter routes alone, and have thus placed the majority of new routes within the `/va` directory with a few exceptions. VA here stands for "Vote Ambassador", as the software does not formally have a name outside of HelloVoter.

### Admin-ui

Another major change is that we have deleted the `/client` folder, previously used in the HelloVoter app to manage canvassing campaigns. The code has been copied and re-used here: [https://github.com/colab-coop/HelloVoter-admin-ui](https://github.com/colab-coop/HelloVoter-admin-ui). Here again, the majority of the React app front-end has been untouched, and different functionality has been added to call the API endpoints we created for this software, and not the HelloVoter endpoints. Though again, the intention is that this will eventually be merged back into the HelloVoter app.

### Cron

We use a cron job to schedule the payouts and payout retries upon failure. In the case of Stripe, the first scheduled action is a disbursement. The second scheduled action is a settlement. The cron job is also used to schedule a "24-hours later" SMS to be sent to a Vote Tripler who has responded "YES" to a Vote Ambassador. It is intended to persuade the Vote Tripler to sign up to become a Vote Ambassador themselves. Related to the Cron job is a FIFO queue implemented to ease pressure on the external calls (Stripe, Twilio, etc).

## TODO

We are in the process of removing the business logic from `/routes` and placing them where they belong in `/services`. This is not yet complete, but you will see evidence of our initial progress in doing so. For any additional routes created, please put business logic in `/services`, and move over any relevant functionality to `/services` when and where you are able.

## Production Setup

We are currently using an AWS cluster to deploy this code. We use an Ansible playbook to provision the servers. We point the servers to a Neo4J database hosted at Graphene. The frontend is also hosted on an AWS server in the cluster, also using an Ansible playbook. We have CircleCI workflows implemented for deployment.

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
